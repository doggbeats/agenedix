import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getInfinitePayConfig,
  normalizeInfinitePayEvent,
} from "@/lib/payments/infinitepay";

describe("infinitepay", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("normaliza o payload de pagamento aprovado", () => {
    const event = normalizeInfinitePayEvent({
      invoice_slug: "inv-123",
      amount: 1000,
      paid_amount: 1010,
      transaction_nsu: "tx-123",
      order_nsu: "order-123",
      capture_method: "pix",
      receipt_url: "https://comprovante/123",
    });

    expect(event).toMatchObject({
      kind: "PAID",
      orderNsu: "order-123",
      transactionNsu: "tx-123",
      slug: "inv-123",
      captureMethod: "pix",
      amountCents: 1000,
      paidAmountCents: 1010,
      receiptUrl: "https://comprovante/123",
    });
  });

  it("mapeia os demais eventos do webhook", () => {
    expect(
      normalizeInfinitePayEvent({ event: "settled", order_nsu: "o" })?.kind,
    ).toBe("PAID");
    expect(
      normalizeInfinitePayEvent({ event: "refunded", order_nsu: "o" })?.kind,
    ).toBe("REFUNDED");
    expect(
      normalizeInfinitePayEvent({ event: "canceled", order_nsu: "o" })?.kind,
    ).toBe("CANCELED");
    expect(
      normalizeInfinitePayEvent({ event: "payment_failed", order_nsu: "o" })?.kind,
    ).toBe("FAILED");
    expect(
      normalizeInfinitePayEvent({ event: "created", order_nsu: "o" })?.kind,
    ).toBe("PENDING");
  });

  it("ignora evento desconhecido e payload sem order_nsu", () => {
    expect(
      normalizeInfinitePayEvent({ event: "algo-novo", order_nsu: "o" })?.kind,
    ).toBe("IGNORED");
    expect(normalizeInfinitePayEvent({ event: "paid" })).toBeNull();
    expect(normalizeInfinitePayEvent(null)).toBeNull();
  });

  it("lê a handle sem o cifrão e considera a InfinitePay configurada", () => {
    vi.stubEnv("INFINITEPAY_HANDLE", " $minha-loja ");
    vi.stubEnv("INFINITEPAY_API_KEY", "inchk_teste");

    expect(getInfinitePayConfig()).toEqual({
      handle: "minha-loja",
      apiKey: "inchk_teste",
      configured: true,
    });
  });

  it("fica desconfigurada sem handle", () => {
    vi.stubEnv("INFINITEPAY_HANDLE", "");
    vi.stubEnv("INFINITEPAY_API_KEY", "inchk_teste");

    expect(getInfinitePayConfig().configured).toBe(false);
  });
});
