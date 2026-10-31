import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const paymentEventSchema = z
  .object({
    eventId: z.string().trim().min(1).max(200),
    type: z.enum([
      "payment.paid",
      "payment.pending",
      "payment.failed",
      "payment.refunded",
    ]),
    establishmentId: z.string().trim().min(1).optional(),
    establishmentSlug: z.string().trim().min(1).optional(),
    providerPaymentId: z.string().trim().min(1).max(200),
    amount: z.coerce.number().positive().max(1_000_000),
    currency: z.string().trim().min(3).max(3).default("BRL"),
    method: z.string().trim().max(80).optional(),
    paidAt: z.string().trim().optional(),
    periodStart: z.string().trim().optional(),
    periodEnd: z.string().trim().optional(),
    extendDays: z.coerce.number().int().min(0).max(3650).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((value) => Boolean(value.establishmentId || value.establishmentSlug), {
    message: "Informe establishmentId ou establishmentSlug.",
    path: ["establishmentId"],
  });

type PaymentEvent = z.infer<typeof paymentEventSchema>;

function signatureHeader(request: Request): string | null {
  return (
    request.headers.get("x-agendix-signature") ??
    request.headers.get("x-webhook-signature") ??
    request.headers.get("x-signature")
  );
}

function verifySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const provided = header.startsWith("sha256=") ? header.slice(7) : header;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function paymentStatusFor(type: PaymentEvent["type"]): "PAID" | "PENDING" | "FAILED" | "REFUNDED" {
  switch (type) {
    case "payment.paid":
      return "PAID";
    case "payment.pending":
      return "PENDING";
    case "payment.failed":
      return "FAILED";
    case "payment.refunded":
      return "REFUNDED";
  }
}

async function handlePaymentEvent(event: PaymentEvent) {
  const establishment = await prisma.establishment.findFirst({
    where: {
      archivedAt: null,
      ...(event.establishmentId
        ? { id: event.establishmentId }
        : { slug: event.establishmentSlug }),
    },
    include: { subscription: { include: { plan: true } } },
  });

  if (!establishment) {
    return { status: 404, body: { error: "Estabelecimento não encontrado." } };
  }
  if (!establishment.subscription) {
    return {
      status: 422,
      body: { error: "Estabelecimento sem assinatura vinculada." },
    };
  }

  const status = paymentStatusFor(event.type);
  const now = new Date();
  const paidAt = parseDate(event.paidAt) ?? now;
  const isPaid = status === "PAID";

  const existingEnd = establishment.subscription.currentPeriodEnd;
  const periodStart =
    parseDate(event.periodStart) ??
    (existingEnd && existingEnd.getTime() > now.getTime() ? existingEnd : now);
  const extendDays = event.extendDays ?? 30;
  const periodEnd =
    parseDate(event.periodEnd) ??
    new Date(periodStart.getTime() + Math.max(0, extendDays) * 86_400_000);

  const payment = await prisma.$transaction(async (tx) => {
    const existing = await tx.payment.findUnique({
      where: { providerPaymentId: event.providerPaymentId },
      select: { id: true, status: true },
    });

    const data = {
      establishmentId: establishment.id,
      subscriptionId: establishment.subscription!.id,
      amount: event.amount,
      currency: event.currency.toUpperCase(),
      status,
      provider: "WEBHOOK",
      providerPaymentId: event.providerPaymentId,
      method: event.method ?? null,
      paidAt: isPaid ? paidAt : null,
      periodStart: isPaid ? periodStart : null,
      periodEnd: isPaid ? periodEnd : null,
      notes: event.notes ?? null,
      metadata: {
        source: "payment-webhook",
        eventType: event.type,
        previousStatus: existing?.status ?? null,
      } satisfies Prisma.InputJsonObject,
    };

    const record = existing
      ? await tx.payment.update({ where: { id: existing.id }, data })
      : await tx.payment.create({
          data: { ...data, providerEventId: event.eventId },
        });

    if (isPaid) {
      await tx.subscription.update({
        where: { id: establishment.subscription!.id },
        data: {
          status: "ACTIVE",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          trialEndsAt: null,
          cancelAtPeriodEnd: false,
          provider: "WEBHOOK",
        },
      });
    }

    return record;
  });

  await recordAudit({
    establishmentId: establishment.id,
    action: `platform.payment.webhook.${status.toLowerCase()}`,
    entityType: "Payment",
    entityId: payment.id,
    metadata: {
      eventId: event.eventId,
      providerPaymentId: event.providerPaymentId,
      amount: event.amount,
      status,
      periodEnd: isPaid ? periodEnd.toISOString() : null,
    },
  });

  return {
    status: 200,
    body: {
      ok: true,
      paymentId: payment.id,
      status: payment.status,
      subscriptionStatus: isPaid ? "ACTIVE" : establishment.subscription.status,
      periodEnd: isPaid ? periodEnd.toISOString() : null,
    },
  };
}

export async function POST(request: Request) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return Response.json(
      { error: "Webhook de pagamentos não configurado." },
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  if (!verifySignature(rawBody, signatureHeader(request), secret)) {
    return Response.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const parsed = paymentEventSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Evento inválido.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const duplicate = await prisma.payment.findUnique({
    where: { providerEventId: parsed.data.eventId },
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

  try {
    const result = await handlePaymentEvent(parsed.data);
    return Response.json(result.body, { status: result.status });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json({ ok: true, duplicate: true });
    }
    console.error("Erro no webhook de pagamentos", error);
    return Response.json(
      { error: "Não foi possível processar o evento." },
      { status: 500 },
    );
  }
}
