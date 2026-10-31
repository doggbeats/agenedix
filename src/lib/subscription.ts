import type { Prisma, PrismaClient, SubscriptionPlan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { startOfDayInZone, todayInZone } from "./timezone";

type Db = PrismaClient | Prisma.TransactionClient;

export function isSubscriptionUsable(
  subscription:
    | {
        status: string;
        trialEndsAt: Date | null;
        currentPeriodEnd?: Date | null;
        toleranceDays?: number;
      }
    | null
    | undefined,
  now = new Date(),
): boolean {
  if (!subscription) return false;
  if (subscription.status === "ACTIVE") return true;
  if (subscription.status === "TRIALING") {
    if (!subscription.trialEndsAt) return true;
    return subscription.trialEndsAt.getTime() > now.getTime();
  }
  if (subscription.status === "PAST_DUE" && subscription.currentPeriodEnd) {
    const tolerance = Math.max(0, subscription.toleranceDays ?? 0);
    return (
      subscription.currentPeriodEnd.getTime() + tolerance * 86_400_000 > now.getTime()
    );
  }
  return false;
}

export function subscriptionBlockedMessage(
  subscription: { status: string } | null | undefined,
): string {
  if (!subscription) return "O estabelecimento ainda não configurou um plano.";
  if (subscription.status === "TRIALING") {
    return "O período de teste deste estabelecimento terminou.";
  }
  if (subscription.status === "PENDING_PAYMENT") {
    return "O pagamento do plano está pendente.";
  }
  if (subscription.status === "PAST_DUE") {
    return "O plano está com pagamento atrasado.";
  }
  if (subscription.status === "SUSPENDED") {
    return "A assinatura está suspensa.";
  }
  if (subscription.status === "CANCELED") {
    return "A assinatura foi cancelada.";
  }
  return "A assinatura não está ativa.";
}

export function isTrialEndingSoon(
  subscription:
    | {
        status: string;
        trialEndsAt: Date | null;
      }
    | null
    | undefined,
  days = 5,
  now = new Date(),
): boolean {
  if (!subscription || subscription.status !== "TRIALING" || !subscription.trialEndsAt) {
    return false;
  }
  return subscription.trialEndsAt.getTime() - now.getTime() < days * 86_400_000;
}

export interface PlanCapacityCheck {
  allowed: boolean;
  reason?: string;
}

export async function checkPlanCapacity(
  db: Db,
  establishmentId: string,
  resource: "services" | "professionals",
): Promise<PlanCapacityCheck> {
  const subscription = await db.subscription.findUnique({
    where: { establishmentId },
    include: { plan: true },
  });
  if (!subscription) {
    return { allowed: false, reason: "Estabelecimento sem plano contratado." };
  }

  const plan = subscription.plan;
  if (resource === "services") {
    const count = await db.service.count({
      where: { establishmentId, deletedAt: null },
    });
    if (count >= plan.maxServices) {
      return {
        allowed: false,
        reason: `Seu plano permite até ${plan.maxServices} serviços ativos.`,
      };
    }
  }

  if (resource === "professionals") {
    const count = await db.professional.count({
      where: { establishmentId, active: true },
    });
    if (count >= plan.maxProfessionals) {
      return {
        allowed: false,
        reason: `Seu plano permite até ${plan.maxProfessionals} profissionais ativos.`,
      };
    }
  }

  return { allowed: true };
}

export async function checkMonthlyAppointmentLimit(
  db: Db,
  establishmentId: string,
  startAt: Date,
  timezone: string,
): Promise<PlanCapacityCheck> {
  const subscription = await db.subscription.findUnique({
    where: { establishmentId },
    include: { plan: true },
  });
  if (!subscription) {
    return { allowed: false, reason: "Estabelecimento sem plano contratado." };
  }

  const max = subscription.plan.maxAppointmentsMonth;
  if (!max) return { allowed: true };

  const monthStartDate = `${todayInZone(timezone, startAt).slice(0, 7)}-01`;
  const monthStart = startOfDayInZone(monthStartDate, timezone);
  const nextMonth = new Date(monthStart);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);

  const count = await db.appointment.count({
    where: {
      establishmentId,
      startAt: { gte: monthStart, lt: nextMonth },
      status: { not: "CANCELLED" },
    },
  });

  return count >= max
    ? {
        allowed: false,
        reason: "O limite mensal de agendamentos do plano foi atingido.",
      }
    : { allowed: true };
}

export function planFeatures(plan: SubscriptionPlan): string[] {
  if (Array.isArray(plan.features)) {
    return plan.features.filter((item): item is string => typeof item === "string");
  }
  return [];
}

export async function getSubscriptionOverview(establishmentId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { establishmentId },
    include: { plan: true },
  });
  const plans = await prisma.subscriptionPlan.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  return { subscription, plans };
}
