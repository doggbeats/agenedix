"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { BillingCycle, SubscriptionPlan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthContext, getRequestMeta } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import { parseForm, failure, success, type ActionState } from "@/lib/action-utils";
import {
  cardCheckoutSchema,
  infinitePayCheckoutSchema,
  pixCheckoutSchema,
  planChangeSchema,
} from "@/lib/validation";
import {
  PagarmeError,
  createPagarmePixOrder,
  createPagarmeSubscription,
  getPagarmeConfig,
  updatePagarmeSubscription,
} from "@/lib/payments/pagarme";
import {
  InfinitePayError,
  createInfinitePayLink,
  getInfinitePayConfig,
} from "@/lib/payments/infinitepay";
import {
  billingAddress,
  getOrCreateCustomer,
  getProviderPlanId,
  planAmount,
  planAmountCents,
} from "@/lib/payments/service";
import { getAppUrl } from "@/lib/urls";

export type PixCharge = {
  paymentId: string;
  qrCode: string;
  qrCodeUrl: string | null;
  expiresAt: string | null;
  amount: number;
};

export type InfinitePayCharge = {
  orderNsu: string;
  url: string;
};

export type CheckoutState = ActionState & {
  pix?: PixCharge;
  infinitePay?: InfinitePayCharge;
};

function pagarmeFailure(error: unknown): CheckoutState {
  if (error instanceof PagarmeError) {
    console.error("Erro no Pagar.me", error.status, error.details);
    return failure(
      error.status === 401 || error.status === 403
        ? "O Pagar.me recusou as credenciais configuradas. Fale com o suporte."
        : error.message,
    );
  }
  console.error("Erro inesperado no checkout", error);
  return failure("Não foi possível concluir o pagamento agora. Tente novamente.");
}

function infinitePayErrorCode(details: unknown): string | null {
  if (!details || typeof details !== "object" || Array.isArray(details)) return null;
  const code = (details as Record<string, unknown>).error;
  return typeof code === "string" && code.trim() ? code.trim() : null;
}

function infinitePayFailure(error: unknown): CheckoutState {
  if (error instanceof InfinitePayError) {
    console.error("Erro na InfinitePay", error.status, error.details);
    const code = infinitePayErrorCode(error.details);
    if (code === "external_checkout_not_enabled") {
      return failure(
        "A InfinitePay ainda não liberou o Checkout Integrado nesta conta. Ative o recurso nas configurações de checkout da InfinitePay e tente novamente.",
      );
    }
    return failure(
      error.status === 401 || error.status === 403
        ? "A InfinitePay recusou as credenciais configuradas. Fale com o suporte."
        : error.message,
    );
  }
  console.error("Erro inesperado no checkout InfinitePay", error);
  return failure(
    "Não foi possível gerar o pagamento na InfinitePay agora. Tente novamente.",
  );
}

async function loadContext() {
  const auth = await getAuthContext();
  if (!auth?.establishment) redirect("/login");
  if (auth.role !== "OWNER") {
    return { auth, error: "Apenas o responsável pelo estabelecimento pode contratar o plano." };
  }
  const subscription = await prisma.subscription.findUnique({
    where: { establishmentId: auth.establishment.id },
    include: { plan: true },
  });
  return { auth, subscription, error: null };
}

async function findPlan(slug: string): Promise<SubscriptionPlan | null> {
  return prisma.subscriptionPlan.findFirst({
    where: { slug, active: true, isDemo: false },
  });
}

const withReplacedNote = {
  status: "FAILED" as const,
  notes: "Substituído pela assinatura no cartão.",
};

export async function startCardTrialAction(
  _prevState: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const parsed = parseForm(cardCheckoutSchema, {
    planSlug: formData.get("planSlug"),
    cycle: formData.get("cycle") || "MONTHLY",
    cardToken: formData.get("cardToken"),
    document: formData.get("document"),
    zipCode: formData.get("zipCode"),
    addressNumber: formData.get("addressNumber"),
    city: formData.get("city"),
    state: formData.get("state"),
  });
  if (!parsed.data) return parsed.state ?? failure("Dados inválidos.");
  const input = parsed.data;

  const context = await loadContext();
  if (context.error) return failure(context.error);
  const { auth } = context;
  const establishment = auth.establishment;
  const subscription = context.subscription;

  const config = getPagarmeConfig();
  if (!config.configured) {
    return failure(
      "O pagamento online ainda não está configurado. Fale com o suporte para liberar o acesso.",
    );
  }

  const plan = await findPlan(input.planSlug);
  if (!plan) return failure("Plano indisponível. Escolha outro plano.");

  const cycle = input.cycle as BillingCycle;
  const now = new Date();
  const trialEndsAt = new Date(
    now.getTime() + Math.max(1, plan.trialDays) * 86_400_000,
  );

  // Troca de plano de uma assinatura já ativa no cartão: mantém o cartão
  // salvo no Pagar.me e só atualiza o plano, sem nova cobrança imediata.
  if (
    subscription &&
    subscription.provider === "PAGARME" &&
    subscription.providerSubscriptionId &&
    subscription.status !== "PENDING_PAYMENT"
  ) {
    try {
      const providerPlanId = await getProviderPlanId(plan, cycle);
      await updatePagarmeSubscription({
        subscriptionId: subscription.providerSubscriptionId,
        planId: providerPlanId,
      });
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { planId: plan.id, billingCycle: cycle, provider: "PAGARME" },
      });
      await recordAudit({
        actorUserId: auth.user.id,
        establishmentId: establishment.id,
        action: "subscription.plan_changed",
        entityType: "Subscription",
        entityId: subscription.id,
        metadata: { plan: plan.slug, cycle, provider: "PAGARME" },
      });
    } catch (error) {
      return pagarmeFailure(error);
    }
    revalidatePath("/painel/plano");
    revalidatePath("/painel", "layout");
    redirect("/painel/plano?ok=plano");
  }

  try {
    const address = billingAddress({
      establishmentAddress: establishment.address,
      addressNumber: input.addressNumber,
      zipCode: input.zipCode,
      city: input.city,
      state: input.state,
    });

    const customerId = await getOrCreateCustomer({
      subscriptionId: subscription?.id ?? null,
      providerCustomerId: subscription?.providerCustomerId ?? null,
      name: establishment.ownerName || auth.user.name,
      email: establishment.email || auth.user.email,
      phone: establishment.phone,
      document: input.document,
      address,
    });

    const providerPlanId = await getProviderPlanId(plan, cycle);
    const providerSubscription = await createPagarmeSubscription({
      planId: providerPlanId,
      customerId,
      cardToken: input.cardToken,
      startAt: trialEndsAt,
      billingAddress: address,
      metadata: {
        establishmentId: establishment.id,
        establishmentSlug: establishment.slug,
        planSlug: plan.slug,
        cycle,
        agendamentoonSubscription: "true",
      },
    });

    await prisma.$transaction(async (tx) => {
      await tx.subscription.upsert({
        where: { establishmentId: establishment.id },
        create: {
          establishmentId: establishment.id,
          planId: plan.id,
          status: "TRIALING",
          billingCycle: cycle,
          trialEndsAt,
          currentPeriodStart: now,
          currentPeriodEnd: trialEndsAt,
          provider: "PAGARME",
          providerCustomerId: customerId,
          providerSubscriptionId: providerSubscription.id,
        },
        update: {
          planId: plan.id,
          status: "TRIALING",
          billingCycle: cycle,
          trialEndsAt,
          currentPeriodStart: now,
          currentPeriodEnd: trialEndsAt,
          provider: "PAGARME",
          providerCustomerId: customerId,
          providerSubscriptionId: providerSubscription.id,
          cancelAtPeriodEnd: false,
          notes: null,
        },
      });

      await tx.payment.updateMany({
        where: {
          establishmentId: establishment.id,
          status: "PENDING",
          provider: "PAGARME",
          method: "pix",
        },
        data: withReplacedNote,
      });
    });

    await recordAudit({
      actorUserId: auth.user.id,
      establishmentId: establishment.id,
      action: "subscription.trial_started",
      entityType: "Subscription",
      entityId: providerSubscription.id,
      metadata: {
        plan: plan.slug,
        cycle,
        provider: "PAGARME",
        trialEndsAt: trialEndsAt.toISOString(),
        cardLastFour: providerSubscription.card?.last_four_digits ?? null,
      },
    });
  } catch (error) {
    return pagarmeFailure(error);
  }

  revalidatePath("/painel", "layout");
  redirect("/painel/onboarding?boas-vindas=1");
}

export async function startPixPaymentAction(
  _prevState: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const parsed = parseForm(pixCheckoutSchema, {
    planSlug: formData.get("planSlug"),
    cycle: formData.get("cycle") || "MONTHLY",
    document: formData.get("document"),
    zipCode: formData.get("zipCode"),
    addressNumber: formData.get("addressNumber"),
    city: formData.get("city"),
    state: formData.get("state"),
  });
  if (!parsed.data) return parsed.state ?? failure("Dados inválidos.");
  const input = parsed.data;

  const context = await loadContext();
  if (context.error) return failure(context.error);
  const { auth } = context;
  const establishment = auth.establishment;
  const subscription = context.subscription;

  const config = getPagarmeConfig();
  if (!config.configured) {
    return failure(
      "O pagamento online ainda não está configurado. Fale com o suporte para liberar o acesso.",
    );
  }

  const plan = await findPlan(input.planSlug);
  if (!plan) return failure("Plano indisponível. Escolha outro plano.");

  const cycle = input.cycle as BillingCycle;
  const amount = planAmount(plan, cycle);

  try {
    const address = billingAddress({
      establishmentAddress: establishment.address,
      addressNumber: input.addressNumber,
      zipCode: input.zipCode,
      city: input.city,
      state: input.state,
    });

    const customerId = await getOrCreateCustomer({
      subscriptionId: subscription?.id ?? null,
      providerCustomerId: subscription?.providerCustomerId ?? null,
      name: establishment.ownerName || auth.user.name,
      email: establishment.email || auth.user.email,
      phone: establishment.phone,
      document: input.document,
      address,
    });

    const order = await createPagarmePixOrder({
      customerId,
      amountCents: planAmountCents(plan, cycle),
      description: `AgendamentoON · plano ${plan.name} (${cycle === "YEARLY" ? "anual" : "mensal"})`,
      metadata: {
        establishmentId: establishment.id,
        establishmentSlug: establishment.slug,
        planSlug: plan.slug,
        cycle,
        agendamentoOnCheckout: "pix",
      },
      idempotencyKey: crypto.randomUUID(),
    });

    const charge = order.charges?.[0];
    const qrCode = charge?.last_transaction?.qr_code;
    if (!order.id || !qrCode) {
      throw new PagarmeError(
        "O Pagar.me não retornou o código Pix. Tente novamente.",
        502,
        order,
      );
    }

    const expiresAt = charge?.last_transaction?.expires_at ?? null;
    const qrCodeUrl = charge?.last_transaction?.qr_code_url ?? null;

    await prisma.$transaction(async (tx) => {
      await tx.payment.updateMany({
        where: {
          establishmentId: establishment.id,
          status: "PENDING",
          provider: "PAGARME",
          method: "pix",
        },
        data: { status: "FAILED", notes: "Substituído por uma nova cobrança Pix." },
      });

      const localSubscription = await tx.subscription.upsert({
        where: { establishmentId: establishment.id },
        create: {
          establishmentId: establishment.id,
          planId: plan.id,
          status: "PENDING_PAYMENT",
          billingCycle: cycle,
          provider: "PAGARME",
          providerCustomerId: customerId,
        },
        update: {
          planId: plan.id,
          status: "PENDING_PAYMENT",
          billingCycle: cycle,
          provider: "PAGARME",
          providerCustomerId: customerId,
          providerSubscriptionId: null,
          trialEndsAt: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          notes: "Aguardando confirmação do pagamento via Pix.",
        },
      });

      await tx.payment.upsert({
        where: { providerPaymentId: order.id },
        create: {
          establishmentId: establishment.id,
          subscriptionId: localSubscription.id,
          amount,
          status: "PENDING",
          provider: "PAGARME",
          providerPaymentId: order.id,
          method: "pix",
          notes: "Cobrança Pix aguardando pagamento.",
          metadata: {
            checkout: "pix",
            establishmentId: establishment.id,
            planId: plan.id,
            planSlug: plan.slug,
            cycle,
            qrCode,
            qrCodeUrl,
            expiresAt,
          },
        },
        update: {
          amount,
          status: "PENDING",
          notes: "Cobrança Pix aguardando pagamento.",
          metadata: {
            checkout: "pix",
            establishmentId: establishment.id,
            planId: plan.id,
            planSlug: plan.slug,
            cycle,
            qrCode,
            qrCodeUrl,
            expiresAt,
          },
        },
      });
    });

    await recordAudit({
      actorUserId: auth.user.id,
      establishmentId: establishment.id,
      action: "subscription.pix_created",
      entityType: "Payment",
      entityId: order.id,
      metadata: { plan: plan.slug, cycle, amount },
    });

    revalidatePath("/checkout");
    return {
      ...success("Cobrança Pix criada. Pague pelo QR Code para liberar o painel."),
      pix: {
        paymentId: order.id,
        qrCode,
        qrCodeUrl,
        expiresAt,
        amount,
      },
    };
  } catch (error) {
    return pagarmeFailure(error);
  }
}

function internationalPhone(value: string): string | undefined {
  const digits = value.replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("55")) return `+${digits}`;
  if (digits.length >= 10) return `+55${digits}`;
  return `+${digits}`;
}

export async function startInfinitePayPaymentAction(
  _prevState: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const parsed = parseForm(infinitePayCheckoutSchema, {
    planSlug: formData.get("planSlug"),
    cycle: formData.get("cycle") || "MONTHLY",
  });
  if (!parsed.data) return parsed.state ?? failure("Dados inválidos.");
  const input = parsed.data;

  const context = await loadContext();
  if (context.error) return failure(context.error);
  const { auth } = context;
  const establishment = auth.establishment;
  const subscription = context.subscription;

  const config = getInfinitePayConfig();
  if (!config.configured) {
    return failure(
      "O pagamento pela InfinitePay ainda não está configurado. Fale com o suporte para liberar o acesso.",
    );
  }

  const plan = await findPlan(input.planSlug);
  if (!plan) return failure("Plano indisponível. Escolha outro plano.");

  const cycle = input.cycle as BillingCycle;
  const amount = planAmount(plan, cycle);
  const amountCents = planAmountCents(plan, cycle);
  const orderNsu = `agendamentoon-${crypto.randomUUID()}`;
  const appUrl = getAppUrl();
  const redirectUrl = `${appUrl}/checkout/retorno?order_nsu=${encodeURIComponent(orderNsu)}`;
  const webhookUrl = `${appUrl}/api/webhooks/infinitepay`;

  try {
    const link = await createInfinitePayLink({
      orderNsu,
      amountCents,
      description: `AgendamentoON · plano ${plan.name} (${cycle === "YEARLY" ? "anual" : "mensal"})`,
      redirectUrl,
      webhookUrl,
      customer: {
        name: establishment.ownerName || auth.user.name,
        email: establishment.email || auth.user.email,
        phone_number: internationalPhone(establishment.whatsapp || establishment.phone),
      },
    });

    await prisma.$transaction(async (tx) => {
      await tx.payment.updateMany({
        where: {
          establishmentId: establishment.id,
          status: "PENDING",
          provider: "INFINITEPAY",
        },
        data: { status: "CANCELED", notes: "Substituído por um novo link InfinitePay." },
      });

      const localSubscription = await tx.subscription.upsert({
        where: { establishmentId: establishment.id },
        create: {
          establishmentId: establishment.id,
          planId: plan.id,
          status: "PENDING_PAYMENT",
          billingCycle: cycle,
          provider: "INFINITEPAY",
        },
        update: {
          planId: plan.id,
          status: "PENDING_PAYMENT",
          billingCycle: cycle,
          provider: "INFINITEPAY",
          providerCustomerId: null,
          providerSubscriptionId: null,
          trialEndsAt: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          notes: "Aguardando confirmação do pagamento via InfinitePay.",
        },
      });

      await tx.payment.upsert({
        where: { providerPaymentId: orderNsu },
        create: {
          establishmentId: establishment.id,
          subscriptionId: localSubscription.id,
          amount,
          status: "PENDING",
          provider: "INFINITEPAY",
          providerPaymentId: orderNsu,
          method: "checkout",
          notes: "Link InfinitePay aguardando pagamento.",
          metadata: {
            checkout: "infinitepay",
            orderNsu,
            linkUrl: link.url,
            redirectUrl,
            establishmentId: establishment.id,
            planId: plan.id,
            planSlug: plan.slug,
            cycle,
            amountCents,
          },
        },
        update: {
          subscriptionId: localSubscription.id,
          amount,
          status: "PENDING",
          method: "checkout",
          notes: "Link InfinitePay aguardando pagamento.",
          metadata: {
            checkout: "infinitepay",
            orderNsu,
            linkUrl: link.url,
            redirectUrl,
            establishmentId: establishment.id,
            planId: plan.id,
            planSlug: plan.slug,
            cycle,
            amountCents,
          },
        },
      });
    });

    await recordAudit({
      actorUserId: auth.user.id,
      establishmentId: establishment.id,
      action: "subscription.infinitepay_link_created",
      entityType: "Payment",
      entityId: orderNsu,
      metadata: { plan: plan.slug, cycle, amount, previousProvider: subscription?.provider ?? null },
    });

    revalidatePath("/checkout");
    return {
      ...success("Link da InfinitePay criado. Redirecionando para o pagamento..."),
      infinitePay: { orderNsu, url: link.url },
    };
  } catch (error) {
    return infinitePayFailure(error);
  }
}

export async function confirmPlanChangeAction(
  _prevState: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const parsed = parseForm(planChangeSchema, {
    planSlug: formData.get("planSlug"),
    cycle: formData.get("cycle") || "MONTHLY",
  });
  if (!parsed.data) return parsed.state ?? failure("Dados inválidos.");

  const context = await loadContext();
  if (context.error) return failure(context.error);
  const subscription = context.subscription;
  if (
    !subscription ||
    subscription.provider !== "PAGARME" ||
    !subscription.providerSubscriptionId
  ) {
    return failure("Esta assinatura não permite troca automática de plano.");
  }

  const plan = await findPlan(parsed.data.planSlug);
  if (!plan) return failure("Plano indisponível.");

  const cycle = parsed.data.cycle as BillingCycle;
  try {
    const providerPlanId = await getProviderPlanId(plan, cycle);
    await updatePagarmeSubscription({
      subscriptionId: subscription.providerSubscriptionId,
      planId: providerPlanId,
    });
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { planId: plan.id, billingCycle: cycle },
    });
    await recordAudit({
      actorUserId: context.auth.user.id,
      establishmentId: subscription.establishmentId,
      action: "subscription.plan_changed",
      entityType: "Subscription",
      entityId: subscription.id,
      metadata: { plan: plan.slug, cycle },
    });
  } catch (error) {
    return pagarmeFailure(error);
  }

  revalidatePath("/painel/plano");
  revalidatePath("/painel", "layout");
  redirect("/painel/plano?ok=plano");
}

/**
 * Atalho exclusivo de desenvolvimento. Nunca funciona em produção, mesmo que
 * a variável seja definida por engano.
 */
export async function devActivateTrialAction(
  _prevState: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.PAYMENTS_DEV_BYPASS !== "true"
  ) {
    return failure("Atalho de teste desativado.");
  }

  const context = await loadContext();
  if (context.error) return failure(context.error);
  const plan = await findPlan(String(formData.get("planSlug") ?? ""));
  if (!plan) return failure("Plano indisponível.");

  const { ip } = await getRequestMeta();
  const now = new Date();
  const trialEndsAt = new Date(
    now.getTime() + Math.max(1, plan.trialDays) * 86_400_000,
  );

  await prisma.subscription.upsert({
    where: { establishmentId: context.auth.establishment.id },
    create: {
      establishmentId: context.auth.establishment.id,
      planId: plan.id,
      status: "TRIALING",
      trialEndsAt,
      currentPeriodStart: now,
      currentPeriodEnd: trialEndsAt,
      provider: "MANUAL",
    },
    update: {
      planId: plan.id,
      status: "TRIALING",
      trialEndsAt,
      currentPeriodStart: now,
      currentPeriodEnd: trialEndsAt,
      provider: "MANUAL",
      providerSubscriptionId: null,
      notes: "Teste liberado pelo atalho de desenvolvimento.",
    },
  });

  await recordAudit({
    actorUserId: context.auth.user.id,
    establishmentId: context.auth.establishment.id,
    action: "subscription.dev_trial_started",
    entityType: "Subscription",
    entityId: plan.id,
    metadata: { plan: plan.slug },
    ip,
  });

  revalidatePath("/painel", "layout");
  redirect("/painel/onboarding?boas-vindas=1");
}
