"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_IMPERSONATION_COOKIE,
  ADMIN_IMPERSONATION_MAX_AGE,
  requirePlatformAdmin,
} from "@/lib/auth/session";
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
  const requestedRedirect = formString(formData, "redirectTo");
  const redirectTo =
    requestedRedirect.startsWith("/admin/") && !requestedRedirect.startsWith("//")
      ? requestedRedirect
      : "/admin/estabelecimentos";
  const establishment = await prisma.establishment.findUnique({ where: { id } });
  if (!establishment) {
    redirect(`${redirectTo}?erro=${encodeURIComponent("Estabelecimento não encontrado.")}`);
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
  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${establishment.id}`);
  revalidatePath("/admin/estabelecimentos");
  revalidatePath(`/agendar/${establishment.slug}`);
  redirect(
    `${redirectTo}?ok=${encodeURIComponent(
      status === "ACTIVE" ? "Estabelecimento reativado." : "Estabelecimento suspenso.",
    )}`,
  );
}

const subscriptionUpdateSchema = z.object({
  establishmentId: z.string().min(1),
  planId: z.string().min(1),
  status: z.enum([
    "TRIALING",
    "ACTIVE",
    "PENDING_PAYMENT",
    "PAST_DUE",
    "CANCELED",
    "SUSPENDED",
  ]),
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

  const [establishment, plan, existing] = await Promise.all([
    prisma.establishment.findUnique({ where: { id: parsed.data.establishmentId } }),
    prisma.subscriptionPlan.findUnique({ where: { id: parsed.data.planId } }),
    prisma.subscription.findUnique({
      where: { establishmentId: parsed.data.establishmentId },
    }),
  ]);
  if (!establishment || !plan) return failure("Estabelecimento ou plano inválido.");

  const now = new Date();
  const existingFutureTrial =
    existing?.trialEndsAt && existing.trialEndsAt.getTime() > now.getTime()
      ? existing.trialEndsAt
      : null;
  const existingFuturePeriod =
    existing?.currentPeriodEnd && existing.currentPeriodEnd.getTime() > now.getTime()
      ? existing.currentPeriodEnd
      : null;

  const trialEndsAt = parsed.data.trialEndsAt
    ? new Date(`${parsed.data.trialEndsAt}T12:00:00.000Z`)
    : parsed.data.status === "TRIALING"
      ? existingFutureTrial ??
        new Date(now.getTime() + Math.max(1, plan.trialDays) * 86400000)
      : null;
  const currentPeriodEnd = parsed.data.currentPeriodEnd
    ? new Date(`${parsed.data.currentPeriodEnd}T12:00:00.000Z`)
    : parsed.data.status === "ACTIVE"
      ? existingFuturePeriod ?? new Date(now.getTime() + 30 * 86400000)
      : parsed.data.status === "PAST_DUE"
        ? existing?.currentPeriodEnd ?? null
        : null;
  const currentPeriodStart =
    existing?.currentPeriodStart ??
    (parsed.data.status === "ACTIVE" || parsed.data.status === "TRIALING" ? now : null);

  await prisma.subscription.upsert({
    where: { establishmentId: establishment.id },
    create: {
      establishmentId: establishment.id,
      planId: plan.id,
      status: parsed.data.status,
      billingCycle: parsed.data.billingCycle,
      trialEndsAt,
      currentPeriodStart,
      currentPeriodEnd,
      notes: parsed.data.notes ?? null,
      provider: "MANUAL",
    },
    update: {
      planId: plan.id,
      status: parsed.data.status,
      billingCycle: parsed.data.billingCycle,
      trialEndsAt,
      currentPeriodStart,
      currentPeriodEnd,
      notes: parsed.data.notes ?? null,
    },
  });

  await recordAudit({
    actorUserId: auth.user.id,
    establishmentId: establishment.id,
    action: existing
      ? "platform.subscription.updated"
      : "platform.subscription.created",
    entityType: "Subscription",
    entityId: establishment.id,
    metadata: {
      plan: plan.slug,
      status: parsed.data.status,
      billingCycle: parsed.data.billingCycle,
      created: !existing,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${establishment.id}`);
  revalidatePath("/admin/estabelecimentos");
  revalidatePath("/admin/pagamentos");
  revalidatePath(`/agendar/${establishment.slug}`);
  revalidatePath("/painel/plano");
  return success(
    existing
      ? "Assinatura atualizada manualmente. Registre o pagamento no provedor financeiro."
      : "Assinatura criada. O cliente já pode acessar o painel conforme a situação definida.",
  );
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
    maxUnits: formString(formData, "maxUnits") || "1",
    maxUsers: formString(formData, "maxUsers") || "2",
    maxAppointmentsMonth: formString(formData, "maxAppointmentsMonth"),
    trialDays: formString(formData, "trialDays"),
    features: formString(formData, "features"),
    active: formData.get("active") === "on",
    isDemo: formData.get("isDemo") === "on",
    highlight: formData.get("highlight") === "on",
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
      maxUnits: parsed.data.maxUnits,
      maxUsers: parsed.data.maxUsers,
      maxAppointmentsMonth: parsed.data.maxAppointmentsMonth,
      trialDays: parsed.data.trialDays,
      features: featuresFromText(parsed.data.features ?? ""),
      active: parsed.data.active,
      isDemo: parsed.data.isDemo,
      highlight: parsed.data.highlight,
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
      maxUnits: parsed.data.maxUnits,
      maxUsers: parsed.data.maxUsers,
      maxAppointmentsMonth: parsed.data.maxAppointmentsMonth,
      trialDays: parsed.data.trialDays,
      features: featuresFromText(parsed.data.features ?? ""),
      active: parsed.data.active,
      isDemo: parsed.data.isDemo,
      highlight: parsed.data.highlight,
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

/**
 * Arquiva o estabelecimento. Some das listas administrativas, sai do ar na
 * página pública e os vínculos de equipe deixam de abrir o painel. Pode ser
 * restaurado depois pelo filtro de arquivados.
 */
export async function archiveEstablishmentAction(formData: FormData): Promise<void> {
  const auth = await requirePlatformAdmin();
  const id = formString(formData, "id");
  const requestedRedirect = formString(formData, "redirectTo");
  const redirectTo =
    requestedRedirect.startsWith("/admin/") && !requestedRedirect.startsWith("//")
      ? requestedRedirect
      : "/admin/estabelecimentos";

  const establishment = await prisma.establishment.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, archivedAt: true },
  });
  if (!establishment) {
    redirect(`${redirectTo}?erro=${encodeURIComponent("Estabelecimento não encontrado.")}`);
  }
  if (establishment.archivedAt) {
    redirect(`${redirectTo}?erro=${encodeURIComponent("Este estabelecimento já está arquivado.")}`);
  }

  await prisma.establishment.update({
    where: { id: establishment.id },
    data: {
      archivedAt: new Date(),
      status: "SUSPENDED",
      publicPageEnabled: false,
    },
  });

  // Se o admin estava dentro do painel deste cliente, encerra o modo.
  const store = await cookies();
  if (store.get(ADMIN_IMPERSONATION_COOKIE)?.value === establishment.id) {
    store.delete(ADMIN_IMPERSONATION_COOKIE);
  }

  await recordAudit({
    actorUserId: auth.user.id,
    establishmentId: establishment.id,
    action: "platform.establishment.archived",
    entityType: "Establishment",
    entityId: establishment.id,
    metadata: { name: establishment.name, slug: establishment.slug },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${establishment.id}`);
  revalidatePath("/admin/estabelecimentos");
  revalidatePath("/painel", "layout");
  revalidatePath("/agendar");
  revalidatePath(`/agendar/${establishment.slug}`);
  revalidatePath("/");
  redirect(
    `${redirectTo}?ok=${encodeURIComponent(
      "Estabelecimento apagado. Você pode restaurar ou excluir definitivamente em Arquivados.",
    )}`,
  );
}

/**
 * Suporte manual: marca o e-mail de um membro como verificado quando o envio
 * de e-mail falha e o usuário fica sem acesso ao painel.
 */
export async function verifyUserEmailAction(formData: FormData): Promise<void> {
  const auth = await requirePlatformAdmin();
  const userId = formString(formData, "userId");
  const establishmentId = formString(formData, "establishmentId");
  const fallback = establishmentId
    ? `/admin/clientes/${establishmentId}`
    : "/admin/clientes";

  const membership = await prisma.membership.findFirst({
    where: { userId, establishmentId },
    select: {
      id: true,
      user: { select: { name: true, email: true, emailVerifiedAt: true } },
    },
  });
  if (!membership) {
    redirect(`${fallback}?erro=${encodeURIComponent(
      "Usuário não vinculado a este estabelecimento.",
    )}`);
  }
  if (membership.user.emailVerifiedAt) {
    redirect(`${fallback}?ok=${encodeURIComponent(
      `O e-mail de ${membership.user.name} já está verificado.`,
    )}`);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date(), emailVerificationExempt: false },
  });

  await recordAudit({
    actorUserId: auth.user.id,
    establishmentId,
    action: "platform.user.email.verified",
    entityType: "User",
    entityId: userId,
    metadata: { email: membership.user.email, manual: true },
  });

  revalidatePath(`/admin/clientes/${establishmentId}`);
  revalidatePath("/admin/clientes");
  revalidatePath("/painel", "layout");
  redirect(`${fallback}?ok=${encodeURIComponent(
    `E-mail de ${membership.user.name} marcado como verificado.`,
  )}`);
}

export async function restoreEstablishmentAction(formData: FormData): Promise<void> {  const auth = await requirePlatformAdmin();
  const id = formString(formData, "id");
  const establishment = await prisma.establishment.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, archivedAt: true },
  });
  if (!establishment) {
    redirect(`/admin/estabelecimentos?status=archived&erro=${encodeURIComponent(
      "Estabelecimento não encontrado.",
    )}`);
  }
  if (!establishment.archivedAt) {
    redirect(`/admin/estabelecimentos?erro=${encodeURIComponent(
      "Este estabelecimento não está arquivado.",
    )}`);
  }

  await prisma.establishment.update({
    where: { id: establishment.id },
    data: {
      archivedAt: null,
      status: "ACTIVE",
      publicPageEnabled: true,
    },
  });

  await recordAudit({
    actorUserId: auth.user.id,
    establishmentId: establishment.id,
    action: "platform.establishment.restored",
    entityType: "Establishment",
    entityId: establishment.id,
    metadata: { name: establishment.name, slug: establishment.slug },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${establishment.id}`);
  revalidatePath("/admin/estabelecimentos");
  revalidatePath("/painel", "layout");
  revalidatePath("/agendar");
  revalidatePath(`/agendar/${establishment.slug}`);
  revalidatePath("/");
  redirect(
    `/admin/estabelecimentos?ok=${encodeURIComponent(
      "Estabelecimento restaurado e reativado.",
    )}`,
  );
}

/**
 * Exclusão definitiva, permitida apenas para estabelecimentos já arquivados.
 * Remove os dados operacionais e mantém o registro de auditoria da exclusão.
 */
export async function deleteEstablishmentAction(formData: FormData): Promise<void> {
  const auth = await requirePlatformAdmin();
  const id = formString(formData, "id");
  const confirmName = formString(formData, "confirmName").trim();
  const fallback = "/admin/estabelecimentos?status=archived";

  const establishment = await prisma.establishment.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, archivedAt: true },
  });
  if (!establishment) {
    redirect(`${fallback}&erro=${encodeURIComponent("Estabelecimento não encontrado.")}`);
  }
  if (!establishment.archivedAt) {
    redirect(`${fallback}&erro=${encodeURIComponent(
      "Arquive o estabelecimento antes de excluir definitivamente.",
    )}`);
  }
  if (confirmName.toLowerCase() !== establishment.name.trim().toLowerCase()) {
    redirect(`${fallback}&erro=${encodeURIComponent(
      "O nome digitado não confere. A exclusão definitiva foi cancelada.",
    )}`);
  }

  // Se o admin estava dentro do painel deste cliente, encerra o modo.
  const store = await cookies();
  if (store.get(ADMIN_IMPERSONATION_COOKIE)?.value === establishment.id) {
    store.delete(ADMIN_IMPERSONATION_COOKIE);
  }

  await prisma.$transaction(async (tx) => {
    // Ordem respeita as chaves Restrict (agendamentos antes de profissionais,
    // serviços e clientes) e deixa o restante cascatear pela exclusão final.
    await tx.appointmentEvent.deleteMany({ where: { establishmentId: establishment.id } });
    await tx.notification.deleteMany({ where: { establishmentId: establishment.id } });
    await tx.appointment.deleteMany({ where: { establishmentId: establishment.id } });
    await tx.payment.deleteMany({ where: { establishmentId: establishment.id } });
    await tx.professional.deleteMany({ where: { establishmentId: establishment.id } });
    await tx.service.deleteMany({ where: { establishmentId: establishment.id } });
    await tx.customer.deleteMany({ where: { establishmentId: establishment.id } });
    await tx.establishment.delete({ where: { id: establishment.id } });
  });

  await recordAudit({
    actorUserId: auth.user.id,
    establishmentId: null,
    action: "platform.establishment.deleted",
    entityType: "Establishment",
    entityId: establishment.id,
    metadata: { name: establishment.name, slug: establishment.slug },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/clientes");
  revalidatePath("/admin/estabelecimentos");
  revalidatePath("/painel", "layout");
  revalidatePath("/agendar");
  revalidatePath(`/agendar/${establishment.slug}`);
  revalidatePath("/");
  redirect(
    `${fallback}&ok=${encodeURIComponent(
      "Estabelecimento excluído definitivamente.",
    )}`,
  );
}

/**
 * Abre o painel de um cliente mantendo a sessão do administrador.
 * O vínculo é apenas de contexto: nenhuma Membership é criada.
 */
export async function startImpersonationAction(formData: FormData): Promise<void> {
  const auth = await requirePlatformAdmin();
  const establishmentId = formString(formData, "establishmentId");
  const fallback = establishmentId
    ? `/admin/clientes/${establishmentId}`
    : "/admin/clientes";

  const establishment = await prisma.establishment.findFirst({
    where: { id: establishmentId, archivedAt: null },
    select: { id: true, name: true, slug: true },
  });
  if (!establishment) {
    redirect(
      `${fallback}?erro=${encodeURIComponent(
        "Cliente não encontrado ou arquivado. Não é possível acessar o painel.",
      )}`,
    );
  }

  const store = await cookies();
  store.set(ADMIN_IMPERSONATION_COOKIE, establishment.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_IMPERSONATION_MAX_AGE,
  });

  await recordAudit({
    actorUserId: auth.user.id,
    establishmentId: establishment.id,
    action: "platform.impersonation.started",
    entityType: "Establishment",
    entityId: establishment.id,
    metadata: { slug: establishment.slug },
  });

  revalidatePath("/painel", "layout");
  redirect("/painel");
}

/**
 * Encerra o modo administrador e devolve o acesso ao /admin,
 * mais precisamente à ficha do cliente que estava aberto.
 */
export async function stopImpersonationAction(): Promise<void> {
  const auth = await requirePlatformAdmin();
  const store = await cookies();
  const establishmentId = store.get(ADMIN_IMPERSONATION_COOKIE)?.value ?? null;
  store.delete(ADMIN_IMPERSONATION_COOKIE);

  if (establishmentId) {
    await recordAudit({
      actorUserId: auth.user.id,
      establishmentId,
      action: "platform.impersonation.stopped",
      entityType: "Establishment",
      entityId: establishmentId,
    });
  }

  revalidatePath("/painel", "layout");
  revalidatePath("/admin");
  redirect(establishmentId ? `/admin/clientes/${establishmentId}` : "/admin");
}
