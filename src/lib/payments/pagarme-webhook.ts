/**
 * Normalização dos webhooks do Pagar.me.
 *
 * O provedor manda payloads diferentes para pedidos, cobranças e assinaturas.
 * Esta camada traduz tudo para um formato único e testável antes de tocar no
 * banco.
 */

export type PagarmeEventKind =
  | "PAID"
  | "PENDING"
  | "FAILED"
  | "REFUNDED"
  | "CANCELED"
  | "IGNORED";

export type NormalizedPagarmeEvent = {
  eventId: string;
  type: string;
  kind: PagarmeEventKind;
  providerPaymentId: string | null;
  providerSubscriptionId: string | null;
  establishmentId: string | null;
  amountCents: number | null;
  method: string | null;
  paidAt: Date | null;
  periodStart: Date | null;
  periodEnd: Date | null;
};

type Rec = Record<string, unknown>;

function asRecord(value: unknown): Rec | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Rec)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asDate(value: unknown): Date | null {
  const text = asString(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function firstRecord(value: unknown): Rec | null {
  return Array.isArray(value) ? asRecord(value[0]) : null;
}

function findMetadata(data: Rec): Rec {
  const candidates: unknown[] = [
    data.metadata,
    firstRecord(data.charges)?.metadata,
    asRecord(data.subscription)?.metadata,
    asRecord(data.order)?.metadata,
  ];
  for (const candidate of candidates) {
    const record = asRecord(candidate);
    if (record) return record;
  }
  return {};
}

export function classifyPagarmeEvent(
  type: string,
  status: string | null,
): PagarmeEventKind {
  const normalized = type.toLowerCase();
  const state = (status ?? "").toLowerCase();

  if (normalized.includes("refund") || state === "refunded" || normalized.includes("chargeback")) {
    return "REFUNDED";
  }
  if (
    normalized.includes("cancel") ||
    state === "canceled" ||
    state === "cancelled"
  ) {
    return "CANCELED";
  }
  if (
    normalized.includes("failed") ||
    normalized.includes("refused") ||
    state === "failed" ||
    state === "refused" ||
    state === "not_authorized"
  ) {
    return "FAILED";
  }
  if (
    normalized.endsWith(".paid") ||
    normalized.includes("charged") ||
    normalized.includes("succeeded") ||
    state === "paid" ||
    state === "succeeded"
  ) {
    return "PAID";
  }
  if (normalized.includes("pending") || state === "pending" || state === "waiting_payment") {
    return "PENDING";
  }
  return "IGNORED";
}

export function normalizePagarmeEvent(
  payload: unknown,
): NormalizedPagarmeEvent | null {
  const body = asRecord(payload);
  if (!body) return null;
  const type = asString(body.type) ?? asString(body.event);
  const data = asRecord(body.data);
  if (!type || !data) return null;

  const status = asString(data.status);
  const kind = classifyPagarmeEvent(type, status);
  const metadata = findMetadata(data);
  const charges = Array.isArray(data.charges) ? data.charges : [];
  const firstCharge = asRecord(charges[0]);
  const currentCycle = asRecord(data.current_cycle);
  const lastTransaction =
    asRecord(firstCharge?.last_transaction) ?? asRecord(data.last_transaction);

  const isSubscriptionEvent = type.toLowerCase().startsWith("subscription.");
  const providerSubscriptionId = isSubscriptionEvent
    ? asString(data.id) ?? asString(data.subscription_id)
    : asString(data.subscription_id) ?? asString(asRecord(data.subscription)?.id);

  const cycleId =
    asString(currentCycle?.cycle_id) ??
    asString(currentCycle?.id) ??
    asString(data.next_billing_at);

  const paymentIdFromCharge =
    asString(firstCharge?.id) ??
    asString(asRecord(data.last_transaction)?.id) ??
    asString(lastTransaction?.id);

  const providerPaymentId = isSubscriptionEvent
    ? paymentIdFromCharge ?? (asString(data.id) && cycleId ? `${data.id}:${cycleId}` : null)
    : type.toLowerCase().startsWith("order.")
      ? asString(data.id) ?? paymentIdFromCharge
      : paymentIdFromCharge ?? asString(data.id);

  const amountCents =
    asNumber(firstCharge?.amount) ??
    asNumber(data.amount) ??
    asNumber(currentCycle?.amount) ??
    asNumber(lastTransaction?.amount);

  const method =
    asString(firstCharge?.payment_method) ??
    asString(data.payment_method) ??
    asString(lastTransaction?.transaction_type);

  const paidAt =
    asDate(firstCharge?.paid_at) ??
    asDate(data.paid_at) ??
    asDate(data.updated_at) ??
    asDate(body.created_at);

  const periodStart = asDate(currentCycle?.start_at) ?? asDate(data.period_start);
  const periodEnd =
    asDate(currentCycle?.end_at) ??
    asDate(data.period_end) ??
    asDate(data.next_billing_at);

  const establishmentId = asString(metadata.establishmentId);

  const eventId =
    asString(body.id) ??
    `${type}:${providerPaymentId ?? providerSubscriptionId ?? "sem-id"}:${
      cycleId ?? paidAt?.toISOString() ?? "sem-ciclo"
    }`;

  return {
    eventId,
    type,
    kind,
    providerPaymentId,
    providerSubscriptionId,
    establishmentId,
    amountCents,
    method,
    paidAt,
    periodStart,
    periodEnd,
  };
}
