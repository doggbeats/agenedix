import type { BillingCycle, SubscriptionPlan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  amountToCents,
  createPagarmeCustomer,
  createPagarmePlan,
  type PagarmeAddress,
} from "./pagarme";

export function planAmount(plan: SubscriptionPlan, cycle: BillingCycle): number {
  return cycle === "YEARLY"
    ? Number(plan.priceYearly)
    : Number(plan.priceMonthly);
}

export function planAmountCents(plan: SubscriptionPlan, cycle: BillingCycle): number {
  return amountToCents(planAmount(plan, cycle));
}

export async function getProviderPlanId(
  plan: SubscriptionPlan,
  cycle: BillingCycle,
): Promise<string> {
  const cached =
    cycle === "YEARLY" ? plan.providerPlanIdYearly : plan.providerPlanIdMonthly;
  if (cached) return cached;

  const created = await createPagarmePlan({
    name: `${plan.name} · ${cycle === "YEARLY" ? "anual" : "mensal"}`,
    description: plan.description ?? `Plano ${plan.name} do AgendamentoON.`,
    amountCents: planAmountCents(plan, cycle),
    cycle,
    metadata: { agendamentoonPlanId: plan.id, cycle },
  });

  await prisma.subscriptionPlan.update({
    where: { id: plan.id },
    data:
      cycle === "YEARLY"
        ? { providerPlanIdYearly: created.id }
        : { providerPlanIdMonthly: created.id },
  });

  return created.id;
}

export function billingAddress(input: {
  establishmentAddress: string | null;
  addressNumber: string;
  zipCode: string;
  city: string;
  state: string;
}): PagarmeAddress {
  return {
    line_1: `${input.establishmentAddress ?? "Endereço principal"}, ${input.addressNumber}`,
    zip_code: input.zipCode,
    city: input.city,
    state: input.state,
    country: "BR",
  };
}

export async function getOrCreateCustomer(input: {
  subscriptionId: string | null;
  providerCustomerId: string | null;
  name: string;
  email: string;
  phone: string | null;
  document: string;
  address: PagarmeAddress;
}): Promise<string> {
  if (input.providerCustomerId) return input.providerCustomerId;

  const customer = await createPagarmeCustomer({
    name: input.name,
    email: input.email,
    document: input.document,
    phone: input.phone ?? undefined,
    address: input.address,
  });

  if (input.subscriptionId) {
    await prisma.subscription.update({
      where: { id: input.subscriptionId },
      data: { providerCustomerId: customer.id, provider: "PAGARME" },
    });
  }

  return customer.id;
}

export function addCycle(date: Date, cycle: BillingCycle): Date {
  const next = new Date(date);
  if (cycle === "YEARLY") next.setUTCFullYear(next.getUTCFullYear() + 1);
  else next.setUTCMonth(next.getUTCMonth() + 1);
  return next;
}
