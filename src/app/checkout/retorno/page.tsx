import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, Clock, Receipt } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth/session";
import { confirmInfinitePayPayment } from "@/lib/payments/infinitepay-service";
import { formatCurrency, toNumber } from "@/lib/format";
import { Logo } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pagamento InfinitePay" };

export default async function InfinitePayReturnPage({
  searchParams,
}: {
  searchParams: Promise<{
    order_nsu?: string;
    slug?: string;
    transaction_nsu?: string;
    capture_method?: string;
    receipt_url?: string;
  }>;
}) {
  const params = await searchParams;
  const orderNsu = params.order_nsu?.trim();
  const slug = params.slug?.trim();
  const transactionNsu = params.transaction_nsu?.trim();
  const receiptUrl = params.receipt_url?.trim();

  const auth = await getAuthContext();
  if (!auth?.establishment) redirect("/login");
  if (!orderNsu) redirect("/checkout");

  const payment = await prisma.payment.findUnique({
    where: { providerPaymentId: orderNsu },
    select: {
      id: true,
      establishmentId: true,
      status: true,
      amount: true,
      periodEnd: true,
      provider: true,
    },
  });

  if (
    !payment ||
    payment.provider !== "INFINITEPAY" ||
    payment.establishmentId !== auth.establishment.id
  ) {
    redirect("/checkout");
  }

  let status = payment.status;
  if (status !== "PAID" && slug && transactionNsu) {
    try {
      const result = await confirmInfinitePayPayment({
        orderNsu,
        transactionNsu,
        slug,
      });
      if (result.status === "PAID") status = "PAID";
    } catch (error) {
      console.error("Não foi possível confirmar o pagamento InfinitePay", error);
    }
  }

  const paid = status === "PAID";

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-10 text-ink">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <Logo />
        <div className="mt-6 flex items-start gap-3">
          <span
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
              paid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            {paid ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Clock className="h-5 w-5" />
            )}
          </span>
          <div>
            <h1 className="text-xl font-semibold">
              {paid ? "Pagamento confirmado!" : "Pagamento em processamento"}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {paid
                ? "O painel foi liberado e o novo período já está ativo."
                : "A InfinitePay ainda não confirmou o pagamento. Se você acabou de pagar, aguarde alguns instantes e atualize esta página."}
            </p>
          </div>
        </div>

        <dl className="mt-5 space-y-2 rounded-xl border border-line bg-paper px-4 py-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">Plano</dt>
            <dd className="font-medium">{formatCurrency(toNumber(payment.amount))}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">Pedido</dt>
            <dd className="font-mono text-[11px] text-slate-600">{orderNsu}</dd>
          </div>
          {payment.periodEnd && (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Válido até</dt>
              <dd className="font-medium">
                {payment.periodEnd.toLocaleDateString("pt-BR")}
              </dd>
            </div>
          )}
        </dl>

        {receiptUrl && (
          <a
            href={receiptUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-brand-hover hover:underline"
          >
            <Receipt className="h-3.5 w-3.5" /> Ver comprovante da InfinitePay
          </a>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href={paid ? "/painel" : "/checkout"}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {paid ? "Ir para o painel" : "Voltar ao checkout"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
