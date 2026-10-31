import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import {
  Banknote,
  CircleDollarSign,
  Clock3,
  ReceiptText,
  Search,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/auth/session";
import {
  formatCurrency,
  formatDateInZone,
  formatDateTimeInZone,
  toNumber,
} from "@/lib/format";
import { dateRangeInZone, todayInZone } from "@/lib/timezone";
import {
  Badge,
  buttonSecondary,
  EmptyState,
  PageHeader,
  StatCard,
} from "@/components/ui";
import { ManualPaymentForm } from "@/components/platform/ManualPaymentForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pagamentos" };

const PLATFORM_TIMEZONE = "America/Sao_Paulo";
const PAGE_SIZE = 20;

function paymentTone(status: string) {
  return status === "PAID"
    ? ("success" as const)
    : status === "PENDING"
      ? ("warn" as const)
      : status === "REFUNDED"
        ? ("info" as const)
        : ("danger" as const);
}

function paymentLabel(status: string) {
  return status === "PAID"
    ? "Pago"
    : status === "PENDING"
      ? "Pendente"
      : status === "REFUNDED"
        ? "Reembolsado"
        : "Falhou";
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requirePlatformAdmin();
  const params = await searchParams;
  const status =
    params.status === "PAID" ||
    params.status === "PENDING" ||
    params.status === "FAILED" ||
    params.status === "REFUNDED"
      ? params.status
      : "all";
  const page = Math.max(1, Number(params.page) || 1);
  const today = todayInZone(PLATFORM_TIMEZONE);
  const monthStart = dateRangeInZone(`${today.slice(0, 7)}-01`, today, PLATFORM_TIMEZONE).start;

  const where: Prisma.PaymentWhereInput =
    status === "all" ? {} : { status: status as Prisma.PaymentWhereInput["status"] };

  const [payments, total, paidMonth, pendingCount, paidCount, establishments] =
    await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          establishment: { select: { id: true, name: true, slug: true } },
          subscription: { include: { plan: { select: { name: true } } } },
        },
        orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.payment.count({ where }),
      prisma.payment.aggregate({
        where: { status: "PAID", paidAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      prisma.payment.count({ where: { status: "PENDING" } }),
      prisma.payment.count({ where: { status: "PAID" } }),
      prisma.establishment.findMany({
        where: { archivedAt: null, subscription: { isNot: null } },
        include: {
          subscription: { include: { plan: true } },
        },
        orderBy: { name: "asc" },
      }),
    ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const allTimePaid = await prisma.payment.aggregate({
    where: { status: "PAID" },
    _sum: { amount: true },
  });

  const targets = establishments.map((item) => ({
    id: item.id,
    name: item.name,
    planName: item.subscription?.plan.name ?? "Sem plano",
    status: item.subscription?.status ?? "SEM ASSINATURA",
    suggestedAmount: item.subscription
      ? toNumber(
          item.subscription.billingCycle === "YEARLY"
            ? item.subscription.plan.priceYearly
            : item.subscription.plan.priceMonthly,
        )
      : 0,
    currentPeriodEnd: item.subscription?.currentPeriodEnd
      ? formatDateInZone(item.subscription.currentPeriodEnd, PLATFORM_TIMEZONE)
      : null,
  }));

  function statusHref(next: string) {
    const search = new URLSearchParams();
    if (next !== "all") search.set("status", next);
    const query = search.toString();
    return `/admin/pagamentos${query ? `?${query}` : ""}`;
  }

  function pageHref(next: number) {
    const search = new URLSearchParams();
    if (status !== "all") search.set("status", status);
    if (next > 1) search.set("page", String(next));
    const query = search.toString();
    return `/admin/pagamentos${query ? `?${query}` : ""}`;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Plataforma"
        title="Pagamentos"
        description="Registre pagamentos recebidos fora da plataforma e acompanhe o histórico financeiro das assinaturas."
        actions={
          <Link href="/admin/estabelecimentos" className={buttonSecondary}>
            Gerenciar assinaturas
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Recebido no mês"
          value={formatCurrency(paidMonth._sum.amount ?? 0)}
          hint="Pagamentos confirmados"
          accent
        />
        <StatCard
          label="Total confirmado"
          value={formatCurrency(allTimePaid._sum.amount ?? 0)}
          hint={`${paidCount} pagamento(s) na base`}
        />
        <StatCard
          label="Aguardando confirmação"
          value={pendingCount}
          hint="Pagamentos pendentes registrados"
        />
        <StatCard
          label="Estabelecimentos faturáveis"
          value={targets.length}
          hint="Com assinatura vinculada"
        />
      </div>

      <section className="mt-6 rounded-xl border border-line bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-line px-4 py-4 sm:px-5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
            <CircleDollarSign className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">Registrar pagamento manual</h2>
            <p className="text-[11px] text-slate-500">
              O valor é confirmado pela equipe Agendix. A plataforma não processa cobranças.
            </p>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <ManualPaymentForm establishments={targets} />
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-line bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-sm font-semibold text-ink">Histórico de pagamentos</h2>
            <p className="text-[11px] text-slate-500">
              {total} registro(s){status === "all" ? "" : ` com o filtro selecionado`}.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              ["all", "Todos"],
              ["PAID", "Pagos"],
              ["PENDING", "Pendentes"],
              ["FAILED", "Falhas"],
              ["REFUNDED", "Reembolsos"],
            ].map(([value, label]) => (
              <Link
                key={value}
                href={statusHref(value)}
                className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition ${
                  status === value
                    ? "bg-brand text-white"
                    : "border border-line bg-white text-slate-600 hover:bg-paper"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="p-4 sm:p-5">
            <EmptyState
              title="Nenhum pagamento encontrado"
              description="Registre o primeiro pagamento ou ajuste o filtro."
              icon={<ReceiptText className="h-5 w-5" />}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="border-b border-line bg-paper text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-semibold sm:px-5">Estabelecimento</th>
                  <th className="px-4 py-2.5 font-semibold">Plano</th>
                  <th className="px-4 py-2.5 font-semibold">Valor</th>
                  <th className="px-4 py-2.5 font-semibold">Situação</th>
                  <th className="px-4 py-2.5 font-semibold">Pago em</th>
                  <th className="px-4 py-2.5 font-semibold">Período</th>
                  <th className="px-4 py-2.5 font-semibold">Origem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 sm:px-5">
                      <p className="font-semibold text-ink">{payment.establishment.name}</p>
                      <p className="font-mono text-[10px] text-slate-500">
                        /agendar/{payment.establishment.slug}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {payment.subscription?.plan.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={paymentTone(payment.status)}>
                        {paymentLabel(payment.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {payment.paidAt
                        ? formatDateTimeInZone(
                            payment.paidAt,
                            PLATFORM_TIMEZONE,
                            "dd/MM/yyyy",
                          )
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {payment.periodStart && payment.periodEnd
                        ? `${formatDateInZone(payment.periodStart, PLATFORM_TIMEZONE)} – ${formatDateInZone(
                            payment.periodEnd,
                            PLATFORM_TIMEZONE,
                          )}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        {payment.provider === "MANUAL" ? (
                          <Banknote className="h-3.5 w-3.5 text-slate-400" />
                        ) : (
                          <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                        )}
                        {payment.provider}
                      </span>
                      {payment.method && (
                        <p className="text-[10px] text-slate-500">{payment.method}</p>
                      )}
                      {payment.notes && (
                        <p className="max-w-[160px] truncate text-[10px] text-slate-500">
                          {payment.notes}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pageCount > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-xs sm:px-5">
            <p className="text-slate-500">
              Página {page} de {pageCount}
            </p>
            <div className="flex gap-2">
              {page > 1 ? (
                <Link href={pageHref(page - 1)} className={buttonSecondary}>
                  Anterior
                </Link>
              ) : (
                <span className="inline-flex items-center rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-slate-300">
                  Anterior
                </span>
              )}
              {page < pageCount ? (
                <Link href={pageHref(page + 1)} className={buttonSecondary}>
                  Próxima
                </Link>
              ) : (
                <span className="inline-flex items-center rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-slate-300">
                  Próxima
                </span>
              )}
            </div>
          </div>
        )}
      </section>

      <p className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-500">
        <Search className="h-3.5 w-3.5" /> A confirmação de pagamento ativa a assinatura e
        libera a página pública do estabelecimento.
      </p>
    </div>
  );
}
