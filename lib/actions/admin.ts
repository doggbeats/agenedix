"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import {
  failure,
  formBoolean,
  formString,
  parseForm,
  success,
  type ActionState,
} from "@/lib/action-utils";
import { manualPaymentSchema, planSchema } from "@/lib/validation";
import { slugify } from "@/lib/slug";

export async function toggleEstablishmentStatusAction(
  formData: FormData,
): Promise<void> {
  const auth = await requirePlatformAdmin();
  const id = formString(formData, "id");
  const establishment = await prisma.establishment.findUnique({ where: { id } });
  if (!establishment) {
    redirect(`/admin/estabelecimentos?erro=${encodeURIComponent("Estabelecimento não encontrado.")}`);
  }

  const status = establishment.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  await prisma.establishment.update({
    where: { id: establishment.id },
    data: { status },
  });
  await recordAudit({
    actorUserId: auth.user.id,
    establishmentId: establishment.id,
    action: `platform.establishment.${status.toLowerCase()}`,
    entityType: "Establishment",
    entityId: establishment.id,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/estabelecimentos");
  revalidatePath(`/agendar/${establishment.slug}`);
  redirect(
    `/admin/estabelecimentos?ok=${encodeURIComponent(
      status === "ACTIVE" ? "Estabelecimento reativado." : "Estabelecimento suspenso.",
    )}`,
  );
}

const subscriptionUpdateSchema = z.object({
  establishmentId: z.string().min(1),
  planId: z.string().min(1),
  status: z.enum(["TRIALING", "ACTIVE", "PAST_DUE", "CANCELED", "SUSPENDED"]),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]),
  trialEndsAt: z.string().optional(),
  currentPeriodEnd: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export async function updateSubscriptionAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requirePlatformAdmin();
  const parsed = parseForm(subscriptionUpdateSchema, {
    establishmentId: formString(formData, "establishmentId"),
    planId: formString(formData, "planId"),
    status: formString(formData, "status"),
    billingCycle: formString(formData, "billingCycle"),
    trialEndsAt: formString(formData, "trialEndsAt") || undefined,
    currentPeriodEnd: formString(formData, "currentPeriodEnd") || undefined,
    notes: formString(formData, "notes") || undefined,
  });
  if (!parsed.data) return parsed.state ?? failure("Dados inválidos.");

  const [establishment, plan] = await Promise.all([
    prisma.establishment.findUnique({ where: { id: parsed.data.establishmentId } }),
    prisma.subscriptionPlan.findUnique({ where: { id: parsed.data.planId } }),
  ]);
  if (!establishment || !plan) return failure("Estabelecimento ou plano inválido.");

  const now = new Date();
  const trialEndsAt = parsed.data.trialEndsAt
    ? new Date(`${parsed.data.trialEndsAt}T12:00:00.000Z`)
    : null;
  const currentPeriodEnd = parsed.data.currentPeriodEnd
    ? new Date(`${parsed.data.currentPeriodEnd}T12:00:00.000Z`)
    : parsed.data.status === "ACTIVE"
      ? new Date(now.getTime() + 30 * 86400000)
      : null;

  await prisma.subscription.update({
    where: { establishmentId: establishment.id },
    data: {
      planId: plan.id,
      status: parsed.data.status,
      billingCycle: parsed.data.billingCycle,
      trialEndsAt,
      currentPeriodEnd,
      notes: parsed.data.notes ?? null,
      provider: "MANUAL",
    },
  });

  await recordAudit({
    actorUserId: auth.user.id,
    establishmentId: establishment.id,
    action: "platform.subscription.updated",
    entityType: "Subscription",
    entityId: establishment.id,
    metadata: {
      plan: plan.slug,
      status: parsed.data.status,
      billingCycle: parsed.data.billingCycle,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/estabelecimentos");
  return success("Assinatura atualizada manualmente. Registre o pagamento no provedor financeiro.");
}

function featuresFromText(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function parsePlanForm(formData: FormData) {
  return parseForm(planSchema, {
    name: formString(formData, "name"),
    slug: slugify(formString(formData, "slug") || formString(formData, "name")),
    description: formString(formData, "description"),
    priceMonthly: formString(formData, "priceMonthly"),
    priceYearly: formString(formData, "priceYearly"),
    maxProfessionals: formString(formData, "maxProfessionals"),
    maxServices: formString(formData, "maxServices"),
    maxAppointmentsMonth: formString(formData, "maxAppointmentsMonth"),
    trialDays: formString(formData, "trialDays"),
    features: formString(formData, "features"),
    active: formData.get("active") === "on",
    isDemo: formData.get("isDemo") === "on",
  });
}

export async function createPlanAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requirePlatformAdmin();
  const parsed = parsePlanForm(formData);
  if (!parsed.data) return parsed.state ?? failure("Dados inválidos.");

  const existing = await prisma.subscriptionPlan.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) return failure("Já existe um plano com este identificador.");

  const plan = await prisma.subscriptionPlan.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      priceMonthly: parsed.data.priceMonthly,
      priceYearly: parsed.data.priceYearly,
      maxProfessionals: parsed.data.maxProfessionals,
      maxServices: parsed.data.maxServices,
      maxAppointmentsMonth: parsed.data.maxAppointmentsMonth,
      trialDays: parsed.data.trialDays,
      features: featuresFromText(parsed.data.features ?? ""),
      active: parsed.data.active,
      isDemo: parsed.data.isDemo,
    },
  });

  await recordAudit({
    actorUserId: auth.user.id,
    action: "platform.plan.created",
    entityType: "SubscriptionPlan",
    entityId: plan.id,
    metadata: { slug: plan.slug },
  });

  revalidatePath("/admin/planos");
  revalidatePath("/");
  return success("Plano criado.");
}

export async function updatePlanAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requirePlatformAdmin();
  const id = formString(formData, "id");
  const parsed = parsePlanForm(formData);
  if (!parsed.data) return parsed.state ?? failure("Dados inválidos.");

  const plan = await prisma.subscriptionPlan.findFirst({ where: { id } });
  if (!plan) return failure("Plano não encontrado.");

  const duplicate = await prisma.subscriptionPlan.findFirst({
    where: { slug: parsed.data.slug, id: { not: plan.id } },
  });
  if (duplicate) return failure("Já existe outro plano com este identificador.");

  await prisma.subscriptionPlan.update({
    where: { id: plan.id },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      priceMonthly: parsed.data.priceMonthly,
      priceYearly: parsed.data.priceYearly,
      maxProfessionals: parsed.data.maxProfessionals,
      maxServices: parsed.data.maxServices,
      maxAppointmentsMonth: parsed.data.maxAppointmentsMonth,
      trialDays: parsed.data.trialDays,
      features: featuresFromText(parsed.data.features ?? ""),
      active: parsed.data.active,
      isDemo: parsed.data.isDemo,
    },
  });

  await recordAudit({
    actorUserId: auth.user.id,
    action: "platform.plan.updated",
    entityType: "SubscriptionPlan",
    entityId: plan.id,
    metadata: { slug: parsed.data.slug },
  });

  revalidatePath("/admin/planos");
  revalidatePath("/");
  return success("Plano atualizado.");
}

export async function togglePlanActiveAction(formData: FormData): Promise<void> {
  const auth = await requirePlatformAdmin();
  const id = formString(formData, "id");
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
  if (!plan) {
    redirect(`/admin/planos?erro=${encodeURIComponent("Plano não encontrado.")}`);
  }
  await prisma.subscriptionPlan.update({
    where: { id: plan.id },
    data: { active: !plan.active },
  });
  await recordAudit({
    actorUserId: auth.user.id,
    action: "platform.plan.toggled",
    entityType: "SubscriptionPlan",
    entityId: plan.id,
    metadata: { active: !plan.active },
  });
  revalidatePath("/admin/planos");
  revalidatePath("/");
  redirect(
    `/admin/planos?ok=${encodeURIComponent(
      !plan.active ? "Plano ativado." : "Plano desativado.",
    )}`,
  );
}

export async function registerManualPaymentAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requirePlatformAdmin();
  const parsed = parseForm(manualPaymentSchema, {
    establishmentId: formString(formData, "establishmentId"),
    amount: formString(formData, "amount"),
    method: formString(formData, "method"),
    paidAt: formString(formData, "paidAt"),
    notes: formString(formData, "notes"),
    extendDays: formString(formData, "extendDays") || "30",
    activate: formBoolean(formData, "activate"),
  });
  if (!parsed.data) return parsed.state ?? failure("Dados inválidos.");
  const input = parsed.data;

  const establishment = await prisma.establishment.findFirst({
    where: { id: input.establishmentId, archivedAt: null },
    include: { subscription: { include: { plan: true } } },
  });
  if (!establishment) return failure("Estabelecimento não encontrado.");
  if (!establishment.subscription) {
    return failure(
      "Este estabelecimento não tem assinatura vinculada. Use Estabelecimentos para criar a assinatura primeiro.",
    );
  }

  const now = new Date();
  const paidAt = input.paidAt ? new Date(`${input.paidAt}T12:00:00.000Z`) : now;
  const existingEnd = establishment.subscription.currentPeriodEnd;
  const base =
    existingEnd && existingEnd.getTime() > now.getTime() ? existingEnd : now;
  const periodStart = existingEnd && existingEnd.getTime() > now.getTime() ? existingEnd : now;
  const periodEnd = new Date(base.getTime() + Math.max(0, input.extendDays) * 86_400_000);
  const activate = input.activate;

  const payment = await prisma.$transaction(async (tx) => {
    const created = await tx.payment.create({
      data: {
        establishmentId: establishment.id,
        subscriptionId: establishment.subscription!.id,
        amount: input.amount,
        currency: "BRL",
        status: "PAID",
        provider: "MANUAL",
        method: input.method ?? "Manual",
        paidAt,
        periodStart,
        periodEnd,
        notes: input.notes ?? null,
        metadata: {
          registeredBy: auth.user.email,
          plan: establishment.subscription!.plan.slug,
          extendDays: input.extendDays,
        },
      },
    });

    if (activate) {
      await tx.subscription.update({
        where: { id: establishment.subscription!.id },
        data: {
          status: "ACTIVE",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          trialEndsAt: null,
          cancelAtPeriodEnd: false,
        },
      });
    }

    return created;
  });

  await recordAudit({
    actorUserId: auth.user.id,
    establishmentId: establishment.id,
    action: "platform.payment.registered",
    entityType: "Payment",
    entityId: payment.id,
    metadata: {
      amount: input.amount,
      method: input.method ?? "manual",
      activate,
      periodEnd: periodEnd.toISOString(),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/pagamentos");
  revalidatePath("/admin/estabelecimentos");
  revalidatePath(`/agendar/${establishment.slug}`);
  revalidatePath("/painel/plano");

  return success(
    `Pagamento de ${input.amount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })} registrado${activate ? " e assinatura ativada" : ""}. Período até ${periodEnd.toLocaleDateString(
      "pt-BR",
    )}.`,
  );
}
