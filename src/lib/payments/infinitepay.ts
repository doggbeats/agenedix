/**
 * Cliente mínimo do Checkout Integrado da InfinitePay.
 *
 * A InfinitePay não tem sandbox, não guarda cartão e não faz cobrança
 * recorrente. O fluxo é: criamos um link de pagamento no servidor, levamos o
 * cliente para a página hospedada (Pix ou cartão) e confirmamos o pagamento
 * pelo webhook e/ou por `POST /payment_check`.
 *
 * Documentação: https://www.infinitepay.io/checkout-documentacao
 */

const API_BASE = "https://api.checkout.infinitepay.io";

export type InfinitePayConfig = {
  handle: string;
  apiKey: string;
  configured: boolean;
};

export function getInfinitePayConfig(): InfinitePayConfig {
  const handle = (process.env.INFINITEPAY_HANDLE ?? "").trim().replace(/^\$/, "");
  const apiKey = (process.env.INFINITEPAY_API_KEY ?? "").trim();
  return {
    handle,
    apiKey,
    // A handle identifica a conta no link e também é usada no payment_check.
    // A API Key é opcional e só habilita as opções avançadas do link.
    configured: Boolean(handle),
  };
}

export class InfinitePayError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status = 502, details?: unknown) {
    super(message);
    this.name = "InfinitePayError";
    this.status = status;
    this.details = details;
  }
}

function readString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function readNumber(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

async function infinitePayFetch<T>(
  path: string,
  body: unknown,
  init: { idempotencyKey?: string } = {},
): Promise<T> {
  const config = getInfinitePayConfig();
  if (!config.configured) {
    throw new InfinitePayError("InfinitePay não configurada.", 503);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(config.apiKey ? { "X-Api-Key": config.apiKey } : {}),
        ...(init.idempotencyKey ? { "X-Idempotency-Key": init.idempotencyKey } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (error) {
    throw new InfinitePayError(
      "Não foi possível falar com a InfinitePay. Tente novamente em instantes.",
      502,
      error,
    );
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message: unknown }).message)
        : `InfinitePay respondeu ${response.status}.`;
    throw new InfinitePayError(message, response.status, payload);
  }

  return payload as T;
}

export type InfinitePayLink = {
  url: string;
  raw: unknown;
};

function extractLinkUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;

  const direct = readString(record, [
    "url",
    "link",
    "checkout_url",
    "checkoutUrl",
    "payment_url",
    "paymentUrl",
  ]);
  if (direct) return direct;

  if (record.data && typeof record.data === "object" && !Array.isArray(record.data)) {
    return extractLinkUrl(record.data);
  }
  return null;
}

export type InfinitePayCustomer = {
  name?: string;
  email?: string;
  phone_number?: string;
};

export type CreateInfinitePayLinkInput = {
  orderNsu: string;
  amountCents: number;
  description: string;
  redirectUrl: string;
  webhookUrl: string;
  customer?: InfinitePayCustomer;
  /** Validade do link em horas. Padrão: 24 horas. */
  validForHours?: number;
};

export async function createInfinitePayLink(
  input: CreateInfinitePayLinkInput,
): Promise<InfinitePayLink> {
  const config = getInfinitePayConfig();
  if (!config.configured) {
    throw new InfinitePayError("InfinitePay não configurada.", 503);
  }
  if (!Number.isInteger(input.amountCents) || input.amountCents < 100) {
    throw new InfinitePayError("O valor mínimo da InfinitePay é R$ 1,00.", 400);
  }

  const validUntil = new Date(
    Date.now() + Math.max(1, input.validForHours ?? 24) * 3_600_000,
  );

  const payload: Record<string, unknown> = {
    ...(config.handle ? { handle: config.handle } : {}),
    order_nsu: input.orderNsu,
    redirect_url: input.redirectUrl,
    webhook: {
      url: input.webhookUrl,
      events: ["paid", "settled", "refunded", "canceled", "payment_failed"],
    },
    items: [
      {
        quantity: 1,
        price: input.amountCents,
        description: input.description.slice(0, 240),
      },
    ],
    ...(input.customer &&
    (input.customer.name || input.customer.email || input.customer.phone_number)
      ? { customer: input.customer }
      : {}),
  };

  // As opções exigem API Key. Sem ela, o link continua válido e aceita Pix e
  // cartão, apenas sem expiração e sem a trava de pagamento único.
  if (config.apiKey) {
    payload.options = {
      single_payment: true,
      require_delivery_address: false,
      valid_until: validUntil.toISOString(),
      payment_methods_enabled: ["credit_card", "pix"],
    };
  }

  const response = await infinitePayFetch<unknown>("/links", payload, {
    idempotencyKey: input.orderNsu,
  });
  const url = extractLinkUrl(response);
  if (!url) {
    throw new InfinitePayError(
      "A InfinitePay não retornou o link de pagamento. Tente novamente.",
      502,
      response,
    );
  }

  return { url, raw: response };
}

export type InfinitePayPaymentCheck = {
  success: boolean;
  paid: boolean;
  amountCents: number | null;
  paidAmountCents: number | null;
  installments: number | null;
  captureMethod: string | null;
  raw: unknown;
};

export async function checkInfinitePayPayment(input: {
  orderNsu: string;
  transactionNsu?: string | null;
  slug?: string | null;
}): Promise<InfinitePayPaymentCheck> {
  const config = getInfinitePayConfig();
  if (!config.configured) {
    throw new InfinitePayError("InfinitePay não configurada.", 503);
  }
  if (!input.transactionNsu || !input.slug) {
    throw new InfinitePayError(
      "Não foi possível confirmar o pagamento: transaction_nsu ou slug ausente.",
      400,
    );
  }

  const payload = await infinitePayFetch<unknown>("/payment_check", {
    handle: config.handle,
    order_nsu: input.orderNsu,
    transaction_nsu: input.transactionNsu,
    slug: input.slug,
  });

  const record =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};

  return {
    success: record.success === true,
    paid: record.paid === true,
    amountCents: readNumber(record, ["amount"]),
    paidAmountCents: readNumber(record, ["paid_amount", "paidAmount"]),
    installments: readNumber(record, ["installments"]),
    captureMethod: readString(record, ["capture_method", "captureMethod"]),
    raw: payload,
  };
}

export type InfinitePayEventKind =
  | "PAID"
  | "PENDING"
  | "REFUNDED"
  | "CANCELED"
  | "FAILED"
  | "IGNORED";

export type NormalizedInfinitePayEvent = {
  kind: InfinitePayEventKind;
  type: string;
  orderNsu: string;
  transactionNsu: string | null;
  slug: string | null;
  captureMethod: string | null;
  amountCents: number | null;
  paidAmountCents: number | null;
  receiptUrl: string | null;
};

function eventKind(type: string): InfinitePayEventKind {
  switch (type.toLowerCase()) {
    case "paid":
    case "settled":
      return "PAID";
    case "created":
    case "pending":
      return "PENDING";
    case "refunded":
      return "REFUNDED";
    case "canceled":
    case "cancelled":
      return "CANCELED";
    case "payment_failed":
    case "failed":
      return "FAILED";
    case "":
      // O webhook de pagamento aprovado pode não trazer o nome do evento.
      // Nesse caso confirmamos pelo /payment_check antes de ativar.
      return "PAID";
    default:
      return "IGNORED";
  }
}

export function normalizeInfinitePayEvent(
  payload: unknown,
): NormalizedInfinitePayEvent | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;

  const orderNsu = readString(record, ["order_nsu", "orderNsu"]);
  if (!orderNsu) return null;

  const type =
    readString(record, ["event", "type", "event_type", "eventType", "status"]) ?? "";

  return {
    kind: eventKind(type),
    type: type || "paid",
    orderNsu,
    transactionNsu: readString(record, ["transaction_nsu", "transactionNsu"]),
    slug: readString(record, ["invoice_slug", "slug"]),
    captureMethod: readString(record, ["capture_method", "captureMethod"]),
    amountCents: readNumber(record, ["amount"]),
    paidAmountCents: readNumber(record, ["paid_amount", "paidAmount"]),
    receiptUrl: readString(record, ["receipt_url", "receiptUrl"]),
  };
}
