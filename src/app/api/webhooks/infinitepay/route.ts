import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/http";
import { enforceRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  getInfinitePayConfig,
  normalizeInfinitePayEvent,
} from "@/lib/payments/infinitepay";
import {
  confirmInfinitePayPayment,
  markInfinitePayPaymentFailure,
} from "@/lib/payments/infinitepay-service";

export const dynamic = "force-dynamic";

/**
 * Webhook do Checkout Integrado da InfinitePay.
 *
 * A InfinitePay não assina o webhook. Por isso, todo evento de pagamento
 * aprovado é revalidado em `POST /payment_check` antes de liberar o painel.
 * O `order_nsu` é o ID local do pagamento (UUID), o que também evita que um
 * POST anônimo consiga atingir um pedido que não exista.
 */
export async function POST(request: Request) {
  // A InfinitePay não assina o webhook, então limitamos a origem por IP para
  // evitar que um atacante use o endpoint como amplificador de chamadas.
  const limit = await enforceRateLimit(
    "webhooks.infinitepay",
    clientIp(request),
    300,
    60,
  );
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

  const config = getInfinitePayConfig();
  if (!config.configured) {
    return Response.json(
      { error: "Webhook da InfinitePay não configurado." },
      { status: 503 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const event = normalizeInfinitePayEvent(payload);
  if (!event) {
    return Response.json({ error: "Evento inválido." }, { status: 422 });
  }

  if (event.kind === "IGNORED") {
    return Response.json({ ok: true, ignored: true, type: event.type });
  }

  const payment = await prisma.payment.findUnique({
    where: { providerPaymentId: event.orderNsu },
    select: { id: true, provider: true, establishmentId: true, status: true },
  });

  if (!payment || payment.provider !== "INFINITEPAY") {
    console.warn("Webhook InfinitePay sem pagamento local", event.orderNsu, event.type);
    return Response.json({ ok: true, ignored: true, reason: "payment-not-found" });
  }

  if (event.kind === "PENDING") {
    return Response.json({ ok: true, pending: true, paymentId: payment.id });
  }

  if (event.kind === "PAID") {
    const result = await confirmInfinitePayPayment({
      orderNsu: event.orderNsu,
      transactionNsu: event.transactionNsu,
      slug: event.slug,
    });

    return Response.json({
      ok: true,
      ...result,
      subscriptionStatus: result.status === "PAID" ? "ACTIVE" : "PENDING_PAYMENT",
    });
  }

  const result = await markInfinitePayPaymentFailure({
    orderNsu: event.orderNsu,
    kind: event.kind,
    transactionNsu: event.transactionNsu,
    slug: event.slug,
  });

  return Response.json({ ok: true, ...result });
}
