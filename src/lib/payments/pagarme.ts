import crypto from "node:crypto";

/**
 * Cliente mínimo da API Core v5 do Pagar.me.
 *
 * Nenhum dado de cartão passa por aqui: o navegador tokeniza o cartão
 * diretamente no Pagar.me e envia apenas o `card_token` para o servidor.
 */

const API_BASE = "https://api.pagar.me/core/v5";

export type PagarmeConfig = {
  secretKey: string;
  publicKey: string;
  webhookSecret: string;
  configured: boolean;
  sandbox: boolean;
};

export function getPagarmeConfig(): PagarmeConfig {
  const secretKey = process.env.PAGARME_SECRET_KEY?.trim() ?? "";
  const publicKey = process.env.NEXT_PUBLIC_PAGARME_PUBLIC_KEY?.trim() ?? "";
  const webhookSecret = process.env.PAGARME_WEBHOOK_SECRET?.trim() ?? "";
  return {
    secretKey,
    publicKey,
    webhookSecret,
    configured: Boolean(secretKey && publicKey),
    sandbox: secretKey.startsWith("sk_test_") || publicKey.startsWith("pk_test_"),
  };
}

export class PagarmeError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status = 502, details?: unknown) {
    super(message);
    this.name = "PagarmeError";
    this.status = status;
    this.details = details;
  }
}

function authHeader(secretKey: string): string {
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

async function pagarmeFetch<T>(
  path: string,
  init: RequestInit & { idempotencyKey?: string } = {},
): Promise<T> {
  const config = getPagarmeConfig();
  if (!config.secretKey) {
    throw new PagarmeError("Pagar.me não configurado.", 503);
  }

  const { idempotencyKey, headers, ...rest } = init;
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authHeader(config.secretKey),
        ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
        ...(headers ?? {}),
      },
      cache: "no-store",
    });
  } catch (error) {
    throw new PagarmeError(
      "Não foi possível falar com o Pagar.me. Tente novamente em instantes.",
      502,
      error,
    );
  }

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof body === "object" && body && "message" in body
        ? String((body as { message: unknown }).message)
        : `Pagar.me respondeu ${response.status}.`;
    throw new PagarmeError(message, response.status, body);
  }

  return body as T;
}

export type PagarmeCustomer = {
  id: string;
  name?: string;
  email?: string;
};

export type PagarmeAddress = {
  line_1: string;
  line_2?: string;
  zip_code: string;
  city: string;
  state: string;
  country: string;
};

export async function createPagarmeCustomer(input: {
  name: string;
  email: string;
  document: string;
  phone?: string;
  address: PagarmeAddress;
}): Promise<PagarmeCustomer> {
  const document = input.document.replace(/\D/g, "");
  const phoneDigits = (input.phone ?? "").replace(/\D/g, "");
  const localPhone =
    phoneDigits.startsWith("55") && phoneDigits.length > 11
      ? phoneDigits.slice(2)
      : phoneDigits;

  return pagarmeFetch<PagarmeCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      document,
      type: document.length === 14 ? "company" : "individual",
      ...(localPhone.length >= 10
        ? {
            phones: {
              mobile_phone: {
                country_code: "55",
                area_code: localPhone.slice(0, 2),
                number: localPhone.slice(2),
              },
            },
          }
        : {}),
      address: input.address,
    }),
  });
}

export type PagarmePlan = {
  id: string;
  name?: string;
  status?: string;
};

export async function createPagarmePlan(input: {
  name: string;
  description: string;
  amountCents: number;
  cycle: "MONTHLY" | "YEARLY";
  metadata: Record<string, string>;
}): Promise<PagarmePlan> {
  return pagarmeFetch<PagarmePlan>("/plans", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      description: input.description.slice(0, 240),
      currency: "BRL",
      interval: input.cycle === "YEARLY" ? "year" : "month",
      interval_count: 1,
      billing_type: "prepaid",
      payment_methods: ["credit_card"],
      items: [
        {
          name: input.name,
          quantity: 1,
          pricing_scheme: {
            scheme_type: "unit",
            price: input.amountCents,
          },
        },
      ],
      metadata: input.metadata,
    }),
  });
}

export type PagarmeSubscription = {
  id: string;
  status?: string;
  start_at?: string;
  current_cycle?: { start_at?: string; end_at?: string };
  next_billing_at?: string;
  card?: { id?: string; last_four_digits?: string; brand?: string };
};

export async function createPagarmeSubscription(input: {
  planId: string;
  customerId: string;
  cardToken: string;
  startAt: Date;
  billingAddress: PagarmeAddress;
  metadata: Record<string, string>;
}): Promise<PagarmeSubscription> {
  return pagarmeFetch<PagarmeSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: input.planId,
      customer_id: input.customerId,
      payment_method: "credit_card",
      card_token: input.cardToken,
      start_at: input.startAt.toISOString(),
      billing_address: input.billingAddress,
      metadata: input.metadata,
    }),
  });
}

export async function updatePagarmeSubscription(input: {
  subscriptionId: string;
  planId: string;
  billingAddress?: PagarmeAddress;
}): Promise<PagarmeSubscription> {
  return pagarmeFetch<PagarmeSubscription>(
    `/subscriptions/${encodeURIComponent(input.subscriptionId)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        plan_id: input.planId,
        ...(input.billingAddress ? { billing_address: input.billingAddress } : {}),
      }),
    },
  );
}

export async function cancelPagarmeSubscription(
  subscriptionId: string,
): Promise<PagarmeSubscription> {
  return pagarmeFetch<PagarmeSubscription>(
    `/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { method: "DELETE" },
  );
}

export type PagarmeOrder = {
  id: string;
  status?: string;
  charges?: Array<{
    id?: string;
    status?: string;
    payment_method?: string;
    last_transaction?: {
      qr_code?: string;
      qr_code_url?: string;
      expires_at?: string;
      transaction_type?: string;
    };
  }>;
};

export async function createPagarmePixOrder(input: {
  customerId: string;
  amountCents: number;
  description: string;
  metadata: Record<string, string>;
  idempotencyKey: string;
}): Promise<PagarmeOrder> {
  return pagarmeFetch<PagarmeOrder>("/orders", {
    method: "POST",
    idempotencyKey: input.idempotencyKey,
    body: JSON.stringify({
      customer_id: input.customerId,
      items: [
        {
          amount: input.amountCents,
          description: input.description.slice(0, 240),
          quantity: 1,
        },
      ],
      payments: [
        {
          payment_method: "pix",
          pix: { expires_in: 3600 },
        },
      ],
      metadata: input.metadata,
    }),
  });
}

export function amountToCents(value: number): number {
  return Math.max(0, Math.round(value * 100));
}

/**
 * O Pagar.me assina o corpo cru do webhook com HMAC e envia no header
 * `X-Hub-Signature` (sha1=<hex>). Também aceitamos sha256 para facilitar
 * testes e mudanças futuras do provedor.
 */
export function verifyPagarmeWebhook(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature || !secret) return false;
  const [algorithm, provided] = signature.includes("=")
    ? signature.split("=", 2)
    : ["sha1", signature];
  if (!provided) return false;
  const normalized = algorithm.toLowerCase();
  if (normalized !== "sha1" && normalized !== "sha256") return false;

  const expected = crypto
    .createHmac(normalized, secret)
    .update(rawBody, "utf8")
    .digest("hex");
  const a = Buffer.from(provided.trim().toLowerCase(), "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
