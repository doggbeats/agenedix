import Link from "next/link";
import type { Metadata } from "next";
import {
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  Download,
  Percent,
  Scissors,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/auth/session";
import {
  formatCurrency,
  formatDateInZone,
  toNumber,
} from "@/lib/format";
import {
  addDaysToDate,
  dateRangeInZone,
  isValidDateString,
  todayInZone,
} from "@/lib/timezone";
import { STATUS_LABELS } from "@/lib/constants";
import {
  buttonSecondary,
  EmptyState,
  PageHeader,
  StatCard,
} from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Relatórios" };

type StatusKey = keyof typeof STATUS_LABELS;

const STATUS_DOT: Record<StatusKey, string> = {
  PENDING: "bg-amber-500",
  CONFIRMED: "bg-green-600",
  COMPLETED: "bg-slate-500",
  CANCELLED: "bg-red-500",
  NO_SHOW: "bg-orange-500",
};

function shortDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00.000Z`));
}

function percent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string }>;
}) {
  const auth = await requireManager();
  const establishment = auth.establishment;
  const params = await searchParams;
  const today = todayInZone(establishment.timezone);
  const monthStart = `${today.slice(0, 7)}-01`;

  let from = params.de && isValidDateString(params.de) ? params.de : monthStart;
  let to = params.ate && isValidDateString(params.ate) ? params.ate : today;
  if (from > to) {
    const swap = from;
    from = to;
    to = swap;
  }

  const range = dateRangeInZone(from, to, establishment.timezone);
  const appointments = await prisma.appointment.findMany({
    where: {
      establishmentId: establishment.id,
      startAt: { gte: range.start, lt: range.end },
    },
    orderBy: { startAt: "asc" },
    select: {
      id: true,
      publicCode: true,
      startAt: true,
      durationMin: true,
      price: true,
      status: true,
      serviceName: true,
      professionalName: true,
    },
  });

  const total = appointments.length;
  const active = appointments.filter((item) => item.status !== "CANCELLED");
  const completed = appointments.filter((item) => item.status === "COMPLETED");
  const scheduled = appointments.filter(
    (item) => item.status === "PENDING" || item.status === "CONFIRMED",
  );
  const cancelled = appointments.filter((item) => item.status === "CANCELLED");
  const noShow = appointments.filter((item) => item.status === "NO_SHOW");

  const revenueCompleted = completed.reduce((sum, item) => sum + toNumber(item.price), 0);
  const revenueScheduled = scheduled.reduce((sum, item) => sum + toNumber(item.price), 0);
  const revenueLost = [...cancelled, ...noShow].reduce(
    (sum, item) => sum + toNumber(item.price),
    0,
  );
  const ticket = completed.length > 0 ? revenueCompleted / completed.length : 0;
  const finalized = completed.length + cancelled.length + noShow.length;
  const completionRate = percent(completed.length, finalized);

  const byStatus = (Object.keys(STATUS_LABELS) as StatusKey[]).map((status) => ({
    status,
    count: appointments.filter((item) => item.status === status).length,
  }));

  const serviceMap = new Map<
    string,
    { name: string; count: number; revenue: number }
  >();
  const professionalMap = new Map<
    string,
    { name: string; count: number; revenue: number }
  >();

  for (const item of active) {
    const service = serviceMap.get(item.serviceName) ?? {
      name: item.serviceName,
      count: 0,
      revenue: 0,
    };
    service.count += 1;
    if (item.status === "COMPLETED") service.revenue += toNumber(item.price);
    serviceMap.set(item.serviceName, service);

    const professional = professionalMap.get(item.professionalName) ?? {
      name: item.professionalName,
      count: 0,
      revenue: 0,
    };
    professional.count += 1;
    if (item.status === "COMPLETED") professional.revenue += toNumber(item.price);
    professionalMap.set(item.professionalName, professional);
  }

  const topServices = [...serviceMap.values()]
    .sort((a, b) => b.count - a.count || b.revenue - a.revenue)
    .slice(0, 6);
  const topProfessionals = [...professionalMap.values()]
    .sort((a, b) => b.count - a.count || b.revenue - a.revenue)
    .slice(0, 6);

  const dayMap = new Map<
    string,
    { date: string; count: number; completed: number; revenue: number }
  >();
  for (const item of active) {
    const date = formatDateInZone(item.startAt, establishment.timezone, "yyyy-MM-dd");
    const day = dayMap.get(date) ?? {
      date,
      count: 0,
      completed: 0,
      revenue: 0,
    };
    day.count += 1;
    if (item.status === "COMPLETED") {
      day.completed += 1;
      day.revenue += toNumber(item.price);
    }
    dayMap.set(date, day);
  }
  const daily = [...dayMap.values()].sort((a, b) => a.date.localeCompare(b.date));
  const maxDaily = Math.max(1, ...daily.map((day) => day.count));

  const exportHref = `/api/painel/relatorios/export?de=${from}&ate=${to}`;
  const maxServiceCount = Math.max(1, ...topServices.map((item) => item.count));
  const maxProfessionalCount = Math.max(1, ...topProfessionals.map((item) => item.count));

  return (
    <div>
      <PageHeader
        eyebrow="Relatórios"
        title="Resultados do período"
        description={`${from.split("-").reverse().join("/")} a ${to
          .split("-")
          .reverse()
          .join("/")} · fuso ${establishment.timezone}`}
        actions={
          <a href={exportHref} className={buttonSecondary} download>
            <Download className="h-4 w-4" /> Exportar CSV
          </a>
        }
      />

      <section className="rounded-xl border border-line bg-white p-4 shadow-sm">
        <form
          method="get"
          action="/painel/relatorios"
          className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div>
              <label
                htmlFor="report-from"
                className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500"
              >
                De
              </label>
              <input
                id="report-from"
                name="de"
                type="date"
                defaultValue={from}
                className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label
                htmlFor="report-to"
                className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500"
              >
                Até
              </label>
              <input
                id="report-to"
                name="ate"
                type="date"
                defaultValue={to}
                className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
            >
              Aplicar período
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link
              href={`/painel/relatorios?de=${monthStart}&ate=${today}`}
              className="rounded-md border border-line bg-white px-2.5 py-1.5 font-semibold text-slate-600 hover:bg-paper"
            >
              Mês atual
            </Link>
            <Link
              href={`/painel/relatorios?de=${addDaysToDate(today, -29)}&ate=${today}`}
              className="rounded-md border border-line bg-white px-2.5 py-1.5 font-semibold text-slate-600 hover:bg-paper"
            >
              Últimos 30 dias
            </Link>
            <Link
              href={`/painel/relatorios?de=${today.slice(0, 4)}-01-01&ate=${today}`}
              className="rounded-md border border-line bg-white px-2.5 py-1.5 font-semibold text-slate-600 hover:bg-paper"
            >
              Ano atual
            </Link>
          </div>
        </form>
      </section>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Receita concluída"
          value={formatCurrency(revenueCompleted)}
          hint={`${completed.length} atendimento(s) concluído(s)`}
          accent
        />
        <StatCard
          label="Receita a realizar"
          value={formatCurrency(revenueScheduled)}
          hint={`${scheduled.length} agendamento(s) pendente(s)/confirmado(s)`}
        />
        <StatCard
          label="Ticket médio"
          value={formatCurrency(ticket)}
          hint="Somente atendimentos concluídos"
        />
        <StatCard
          label="Taxa de conclusão"
          value={`${completionRate}%`}
          hint={`${finalized} atendimento(s) finalizado(s) no período`}
        />
      </div>

      {total === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Nenhum agendamento no período"
            description="Ajuste as datas ou compartilhe sua página pública para receber novos horários."
            action={
              <Link href="/painel/agenda" className={buttonSecondary}>
                <CalendarDays className="h-4 w-4" /> Abrir agenda
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-ink">Movimento por dia</h2>
                  <p className="text-[11px] text-slate-500">
                    Atendimentos não cancelados. A barra inferior indica os concluídos.
                  </p>
                </div>
                <BarChart3 className="h-4 w-4 text-slate-500" />
              </div>
              <div className="mt-5 overflow-x-auto pb-1">
                <div className="flex h-40 min-w-full items-end gap-2">
                  {daily.map((day) => {
                    const height = Math.max(6, Math.round((day.count / maxDaily) * 128));
                    const completedHeight =
                      day.count > 0 ? Math.round((day.completed / day.count) * height) : 0;
                    return (
                      <div
                        key={day.date}
                        className="flex min-w-[34px] flex-1 flex-col items-center gap-1"
                        title={`${shortDate(day.date)}: ${day.count} agendamento(s), ${day.completed} concluído(s), ${formatCurrency(day.revenue)}`}
                      >
                        <span className="text-[9px] font-semibold text-slate-500">
                          {day.count}
                        </span>
                        <div
                          className="relative w-full max-w-[30px] overflow-hidden rounded-t-md bg-brand/15"
                          style={{ height: `${height}px` }}
                        >
                          <div
                            className="absolute inset-x-0 bottom-0 rounded-t-md bg-brand"
                            style={{ height: `${completedHeight}px` }}
                          />
                        </div>
                        <span className="whitespace-nowrap text-[9px] text-slate-500">
                          {shortDate(day.date)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 border-t border-line pt-3 text-[10px] text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-brand" /> Concluídos
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-brand/15" /> Demais status
                </span>
              </div>
            </section>

            <section className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
              <h2 className="text-sm font-semibold text-ink">Status dos agendamentos</h2>
              <p className="text-[11px] text-slate-500">
                {total} registro(s) no período selecionado.
              </p>
              <div className="mt-4 space-y-3">
                {byStatus.map((item) => {
                  const share = percent(item.count, total);
                  return (
                    <div key={item.status}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-2 text-slate-600">
                          <span
                            className={`h-2 w-2 rounded-full ${STATUS_DOT[item.status]}`}
                          />
                          {STATUS_LABELS[item.status]}
                        </span>
                        <span className="font-semibold text-ink">
                          {item.count}
                          <span className="ml-1 font-normal text-slate-500">({share}%)</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${STATUS_DOT[item.status]}`}
                          style={{ width: `${share}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-3 text-xs">
                <div>
                  <p className="text-slate-500">Receita perdida</p>
                  <p className="font-semibold text-red-600">{formatCurrency(revenueLost)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Cancelamentos</p>
                  <p className="font-semibold text-ink">{cancelled.length}</p>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <section className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-ink">Serviços</h2>
                  <p className="text-[11px] text-slate-500">
                    Mais agendados no período. Receita considera concluídos.
                  </p>
                </div>
                <Scissors className="h-4 w-4 text-slate-500" />
              </div>
              {topServices.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">Nenhum serviço no período.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {topServices.map((item) => (
                    <div key={item.name}>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="truncate font-medium text-slate-700">{item.name}</span>
                        <span className="shrink-0 text-slate-500">
                          {item.count} · {formatCurrency(item.revenue)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{
                            width: `${Math.max(4, percent(item.count, maxServiceCount))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-ink">Profissionais</h2>
                  <p className="text-[11px] text-slate-500">
                    Volume e receita concluída por profissional.
                  </p>
                </div>
                <UserRound className="h-4 w-4 text-slate-500" />
              </div>
              {topProfessionals.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">Nenhum profissional no período.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {topProfessionals.map((item) => (
                    <div key={item.name}>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="truncate font-medium text-slate-700">{item.name}</span>
                        <span className="shrink-0 text-slate-500">
                          {item.count} · {formatCurrency(item.revenue)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-500"
                          style={{
                            width: `${Math.max(4, percent(item.count, maxProfessionalCount))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="mt-4 rounded-xl border border-line bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
              <div>
                <h2 className="text-sm font-semibold text-ink">Detalhamento diário</h2>
                <p className="text-[11px] text-slate-500">
                  Conferência dos números apresentados acima.
                </p>
              </div>
              <TrendingUp className="h-4 w-4 text-slate-500" />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-paper text-left text-[10px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Dia</th>
                    <th className="px-4 py-2 text-right font-semibold">Agendados</th>
                    <th className="px-4 py-2 text-right font-semibold">Concluídos</th>
                    <th className="px-4 py-2 text-right font-semibold">Receita concluída</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {daily.map((day) => (
                    <tr key={day.date} className="bg-white">
                      <td className="px-4 py-2.5 text-xs font-medium text-slate-700">
                        {shortDate(day.date)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-slate-600">
                        {day.count}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-slate-600">
                        {day.completed}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs font-semibold text-ink">
                        {formatCurrency(day.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-paper">
                  <tr>
                    <td className="px-4 py-2.5 text-xs font-semibold text-ink">Total</td>
                    <td className="px-4 py-2.5 text-right text-xs font-semibold text-ink">
                      {active.length}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs font-semibold text-ink">
                      {completed.length}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs font-semibold text-ink">
                      {formatCurrency(revenueCompleted)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </>
      )}

      <div className="mt-5 grid gap-3 rounded-xl border border-line bg-white p-4 text-xs leading-relaxed text-slate-500 sm:grid-cols-3">
        <p className="flex items-start gap-2">
          <CircleDollarSign className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          Os valores usam o preço registrado no agendamento. Não há emissão fiscal nem
          conciliação automática de pagamentos.
        </p>
        <p className="flex items-start gap-2">
          <Percent className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          Receita concluída considera apenas status Concluído. Receita a realizar considera
          Pendente e Confirmado.
        </p>
        <p className="flex items-start gap-2">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          O período é interpretado no fuso do estabelecimento ({establishment.timezone}).
          Exportação em CSV inclui todos os status.
        </p>
      </div>
    </div>
  );
}
