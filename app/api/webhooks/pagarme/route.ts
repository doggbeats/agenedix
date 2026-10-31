import type { BillingCycle, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { getPagarmeConfig, verifyPagarmeWebhook } from "@/lib/payments/pagarme";
import {
  normalizePagarmeEvent,
  type NormalizedPagarmeEvent,
} from "@/lib/payments/pagarme-webhook";
import { addCycle, planAmount } from "@/lib/payments/service";

export const dynamic = "force-dynamic";

function signatureHeader(request: Request): string | null {
  return (
    request.headers.get("x-hub-signature") ??
    request.headers.get("x-pagarme-signature") ??
    request.headers.get("x-signature")
  );
}

async function resolveSubscription(event: NormalizedPagarmeEvent) {
  if (event.establishmentId) {
    const byEstablishment = await prisma.subscription.findUnique({
      where: { establishmentId: event.establishmentId },
      include: { plan: true, establishment: true },
    });
    if (byEstablishment) return byEstablishment;
  }

  if (event.providerSubscriptionId) {
    const byProvider = await prisma.subscription.findFirst({
      where: { providerSubscriptionId: event.providerSubscriptionId },
      include: { plan: true, establishment: true },
    });
    if (byProvider) return byProvider;
  }

  if (event.providerPaymentId) {
    const payment = await prisma.payment.findUnique({
      where: { providerPaymentId: event.providerPaymentId },
      include: {
        subscription: { include: { plan: true, establishment: true } },
        establishment: {
          include: { subscription: { include: { plan: true, establishment: true } } },
        },
      },
    });
    if (payment?.subscription) return payment.subscription;
    if (payment?.establishment.subscription) return payment.establishment.subscription;
  }

  return null;
}

export async function POST(request: Request) {
  const config = getPagarmeConfig();
  if (!config.webhookSecret) {
    return Response.json(
      { error: "Webhook do Pagar.me não configurado." },
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  if (!verifyPagarmeWebhook(rawBody, signatureHeader(request), config.webhookSecret)) {
    return Response.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const event = normalizePagarmeEvent(payload);
  if (!event) {
    return Response.json({ error: "Evento inválido." }, { status: 422 });
  }

  if (event.kind === "IGNORED") {
    return Response.json({ ok: true, ignored: true, type: event.type });
  }

  const duplicate = await prisma.payment.findUnique({
    where: { providerEventId: event.eventId },
    select: { id: true, status: true },
  });
  if (duplicate) {
    return Response.json({
      ok: true,
      duplicate: true,
      paymentId: duplicate.id,
      status: duplicate.status,
    });
  }

  const subscription = await resolveSubscription(event);
  if (!subscription) {
    console.warn("Webhook Pagar.me sem assinatura local", event.type, event.eventId);
    return Response.json({ ok: true, ignored: true, reason: "subscription-not-found" });
  }

  if (event.kind === "CANCELED") {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "CANCELED", notes: "Assinatura cancelada no Pagar.me." },
    });
    await recordAudit({
      establishmentId: subscription.establishmentId,
      action: "platform.payment.webhook.canceled",
      entityType: "Subscription",
      entityId: subscription.id,
      metadata: { eventId: event.eventId, type: event.type },
    });
    return Response.json({ ok: true, subscriptionStatus: "CANCELED" });
  }

  const now = new Date();
  const cycle = subscription.billingCycle as BillingCycle;
  const periodStart = event.periodStart ?? now;
  const periodEnd = event.periodEnd ?? addCycle(periodStart, cycle);
  const amount =
    event.amountCents != null
      ? event.amountCents / 100
      : planAmount(subscription.plan, cycle);
  const isPaid = event.kind === "PAID";
  const paymentStatus: PaymentStatus =
    event.kind === "PAID"
      ? "PAID"
      : event.kind === "REFUNDED"
        ? "REFUNDED"
        : event.kind === "FAILED"
          ? "FAILED"
          : "PENDING";

  const paymentData = {
    establishmentId: subscription.establishmentId,
    subscriptionId: subscription.id,
    amount,
    currency: "BRL",
    status: paymentStatus,
    provider: "PAGARME",
    providerPaymentId: event.providerPaymentId,
    providerEventId: event.eventId,
    method: event.method ?? (subscription.providerSubscriptionId ? "credit_card" : null),
    paidAt: isPaid ? event.paidAt ?? now : null,
    periodStart: isPaid ? periodStart : null,
    periodEnd: isPaid ? periodEnd : null,
    notes: isPaid
      ? null
      : event.kind === "REFUNDED"
        ? "Pagamento reembolsado pelo Pagar.me."
        : event.kind === "FAILED"
          ? "Falha na cobrança do Pagar.me."
          : "Aguardando confirmação do Pagar.me.",
    metadata: {
      eventType: event.type,
      providerSubscriptionId: event.providerSubscriptionId,
      source: "pagarme-webhook",
    } satisfies Prisma.InputJsonObject,
  };

  const payment = await prisma.$transaction(async (tx) => {
    let existing = event.providerPaymentId
      ? await tx.payment.findUnique({
          where: { providerPaymentId: event.providerPaymentId },
          select: { id: true },
        })
      : null;

    // Eventos de Pix podem chegar com o ID da cobrança em vez do ID do pedido.
    // Como só mantemos uma cobrança Pix por estabelecimento, usamos esse
    // registro em vez de criar um pagamento duplicado — inclusive quando o
    // pedido já foi marcado como pago por um evento anterior.
    if (!existing && event.establishmentId) {
      existing = await tx.payment.findFirst({
        where: {
          establishmentId: event.establishmentId,
          provider: "PAGARME",
          method: "pix",
          status: { in: ["PENDING", "PAID"] },
        },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
    }

    const record = existing
      ? await tx.payment.update({ where: { id: existing.id }, data: paymentData })
      : await tx.payment.create({ data: paymentData });

    if (isPaid) {
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "ACTIVE",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          trialEndsAt: null,
          cancelAtPeriodEnd: false,
          provider: "PAGARME",
          ...(event.providerSubscriptionId
            ? { providerSubscriptionId: event.providerSubscriptionId }
            : {}),
          notes: null,
        },
      });
    } else if (event.kind === "FAILED" || event.kind === "REFUNDED") {
      if (subscription.status !== "PENDING_PAYMENT") {
        await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            status: "PAST_DUE",
            notes:
              event.kind === "REFUNDED"
                ? "Pagamento reembolsado. Regularize para manter o acesso."
                : "Não foi possível cobrar o cartão. Atualize o pagamento.",
          },
        });
      }
    }

    return record;
  });

  await recordAudit({
    establishmentId: subscription.establishmentId,
    action: `platform.payment.pagarme.${paymentStatus.toLowerCase()}`,
    entityType: "Payment",
    entityId: payment.id,
    metadata: {
      eventId: event.eventId,
      type: event.type,
      providerPaymentId: event.providerPaymentId,
      amount,
      periodEnd: isPaid ? periodEnd.toISOString() : null,
    },
  });

  return Response.json({
    ok: true,
    paymentId: payment.id,
    status: payment.status,
    subscriptionStatus: isPaid
      ? "ACTIVE"
      : event.kind === "FAILED" || event.kind === "REFUNDED"
        ? "PAST_DUE"
        : subscription.status,
    periodEnd: isPaid ? periodEnd.toISOString() : null,
  });
}
