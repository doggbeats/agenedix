import type { BillingCycle, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { checkInfinitePayPayment } from "./infinitepay";
import { addCycle } from "./service";

export type ConfirmInfinitePayResult =
  | { status: "PAID"; paymentId: string; periodEnd: Date }
  | { status: "PENDING"; paymentId: string }
  | { status: "NOT_FOUND" };

function metadataObject(value: Prisma.JsonValue | null): Prisma.InputJsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Prisma.InputJsonObject;
  }
  return {};
}

/**
 * Confirma um pagamento InfinitePay no `/payment_check` e, se aprovado,
 * libera a assinatura por um período. Idempotente: eventos repetidos ou a
 * página de retorno não geram cobrança/ativação duplicada.
 */
export async function confirmInfinitePayPayment(input: {
  orderNsu: string;
  transactionNsu?: string | null;
  slug?: string | null;
}): Promise<ConfirmInfinitePayResult> {
  const payment = await prisma.payment.findUnique({
    where: { providerPaymentId: input.orderNsu },
    include: {
      subscription: { include: { plan: true } },
    },
  });

  if (!payment || payment.provider !== "INFINITEPAY") {
    return { status: "NOT_FOUND" };
  }

  if (payment.status === "PAID") {
    return {
      status: "PAID",
      paymentId: payment.id,
      periodEnd: payment.periodEnd ?? new Date(),
    };
  }

  // Sem os identificadores da fatura não é possível validar o pagamento.
  // O webhook/retorno deve reenviar os dados ou o cliente pode tentar de novo.
  if (!input.transactionNsu || !input.slug) {
    return { status: "PENDING", paymentId: payment.id };
  }

  const check = await checkInfinitePayPayment({
    orderNsu: input.orderNsu,
    transactionNsu: input.transactionNsu,
    slug: input.slug,
  });

  if (!check.success || !check.paid) {
    return { status: "PENDING", paymentId: payment.id };
  }

  // Nunca ativa uma assinatura por um valor menor que o contratado. Se a
  // InfinitePay não informar o valor pago, mantém pendente para conferência.
  const expectedCents = Math.round(Number(payment.amount) * 100);
  const paidCents = check.paidAmountCents ?? check.amountCents;
  if (paidCents === null || paidCents < expectedCents) {
    console.warn("InfinitePay: valor divergente", {
      orderNsu: input.orderNsu,
      expectedCents,
      paidCents,
    });
    return { status: "PENDING", paymentId: payment.id };
  }

  const now = new Date();
  const cycle = (payment.subscription?.billingCycle ?? "MONTHLY") as BillingCycle;
  const periodStart = now;
  const periodEnd = addCycle(periodStart, cycle);
  const metadata: Prisma.InputJsonObject = {
    ...metadataObject(payment.metadata),
    transactionNsu: input.transactionNsu,
    slug: input.slug,
    captureMethod: check.captureMethod,
    installments: check.installments,
    paidAmountCents: check.paidAmountCents,
    source: "infinitepay",
  };

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        method: check.captureMethod ?? "checkout",
        paidAt: now,
        periodStart,
        periodEnd,
        notes: null,
        metadata,
      },
    });

    if (payment.subscriptionId) {
      await tx.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: "ACTIVE",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          trialEndsAt: null,
          cancelAtPeriodEnd: false,
          provider: "INFINITEPAY",
          notes: null,
        },
      });
    }
  });

  await recordAudit({
    establishmentId: payment.establishmentId,
    action: "platform.payment.infinitepay.paid",
    entityType: "Payment",
    entityId: payment.id,
    metadata: {
      orderNsu: input.orderNsu,
      transactionNsu: input.transactionNsu,
      slug: input.slug,
      captureMethod: check.captureMethod,
      amountCents: check.paidAmountCents ?? check.amountCents,
      periodEnd: periodEnd.toISOString(),
    },
  });

  return { status: "PAID", paymentId: payment.id, periodEnd };
}

export type InfinitePayFailureKind = "REFUNDED" | "CANCELED" | "FAILED";

export async function markInfinitePayPaymentFailure(input: {
  orderNsu: string;
  kind: InfinitePayFailureKind;
  transactionNsu?: string | null;
  slug?: string | null;
}): Promise<{ status: string; paymentId: string } | null> {
  const payment = await prisma.payment.findUnique({
    where: { providerPaymentId: input.orderNsu },
    select: {
      id: true,
      establishmentId: true,
      subscriptionId: true,
      provider: true,
      status: true,
      metadata: true,
    },
  });

  if (!payment || payment.provider !== "INFINITEPAY") return null;
  if (payment.status === input.kind) {
    return { status: payment.status, paymentId: payment.id };
  }

  // A InfinitePay não assina o webhook. Um evento forjado de falha não pode
  // derrubar uma assinatura que já foi paga; só um estorno (REFUNDED) pode
  // rebaixar um pagamento aprovado, e apenas após revalidação na InfinitePay.
  if (payment.status === "PAID" && input.kind !== "REFUNDED") {
    return { status: payment.status, paymentId: payment.id };
  }

  if (input.kind === "REFUNDED") {
    if (payment.status !== "PAID") {
      return { status: payment.status, paymentId: payment.id };
    }
    if (!input.transactionNsu || !input.slug) {
      return { status: payment.status, paymentId: payment.id };
    }
    try {
      const check = await checkInfinitePayPayment({
        orderNsu: input.orderNsu,
        transactionNsu: input.transactionNsu,
        slug: input.slug,
      });
      // Se a InfinitePay ainda considera o pagamento aprovado, ignora o evento.
      if (!check.success || check.paid) {
        return { status: payment.status, paymentId: payment.id };
      }
    } catch (error) {
      console.error("InfinitePay: não foi possível revalidar estorno", error);
      return { status: payment.status, paymentId: payment.id };
    }
  }

  const notes =
    input.kind === "REFUNDED"
      ? "Pagamento estornado pela InfinitePay."
      : input.kind === "CANCELED"
        ? "Cobrança cancelada na InfinitePay."
        : "Tentativa de pagamento não aprovada pela InfinitePay.";

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: input.kind,
        notes,
        metadata: {
          ...metadataObject(payment.metadata),
          transactionNsu: input.transactionNsu ?? null,
          slug: input.slug ?? null,
          source: "infinitepay",
        },
      },
    });

    if (input.kind !== "CANCELED" && payment.subscriptionId) {
      const subscription = await tx.subscription.findUnique({
        where: { id: payment.subscriptionId },
        select: { status: true },
      });
      if (subscription && subscription.status !== "PENDING_PAYMENT") {
        await tx.subscription.update({
          where: { id: payment.subscriptionId },
          data: {
            status: "PAST_DUE",
            notes:
              input.kind === "REFUNDED"
                ? "Pagamento reembolsado. Regularize para manter o acesso."
                : "Não foi possível confirmar o pagamento. Tente novamente.",
          },
        });
      }
    }
  });

  await recordAudit({
    establishmentId: payment.establishmentId,
    action: `platform.payment.infinitepay.${input.kind.toLowerCase()}`,
    entityType: "Payment",
    entityId: payment.id,
    metadata: {
      orderNsu: input.orderNsu,
      transactionNsu: input.transactionNsu ?? null,
      slug: input.slug ?? null,
    },
  });

  return { status: input.kind, paymentId: payment.id };
}
