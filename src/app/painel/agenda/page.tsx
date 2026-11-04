import Link from "next/link";
import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Lock,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePanel } from "@/lib/auth/session";
import { isManagerRole } from "@/lib/permissions";
import { formatDateTimeInZone, formatDuration, minutesToTime } from "@/lib/format";
import {
  addDaysToDate,
  dateRangeInZone,
  getWeekday,
  isValidDateString,
  todayInZone,
  weekDays,
} from "@/lib/timezone";
import { WEEKDAYS } from "@/lib/constants";
import {
  buttonBrand,
  buttonSecondary,
  EmptyState,
  PageHeader,
  StatusBadge,
  TabLink,
} from "@/components/ui";
import { DaySchedule } from "@/components/panel/DaySchedule";
import { AppointmentActions } from "@/components/panel/AppointmentActions";

export const dynamic = "force-dynamic";

function prettyDate(date: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("pt-BR", {
    ...options,
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00.000Z`));
}

function queryString(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter((entry): entry is [string, string] =>
    Boolean(entry[1]),
  );
  return entries.length ? `?${new URLSearchParams(entries).toString()}` : "";
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; visao?: string; profissional?: string }>;
}) {
  const auth = await requirePanel();
  const params = await searchParams;
  const establishment = auth.establishment;
  const isManager = isManagerRole(auth.role);
  const today = todayInZone(establishment.timezone);
  const date = params.data && isValidDateString(params.data) ? params.data : today;
  const view = params.visao === "semana" ? "semana" : "dia";

  const professionals = await prisma.professional.findMany({
    where: {
      establishmentId: establishment.id,
      active: true,
      ...(isManager ? {} : { id: auth.professionalId ?? "__none__" }),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, photoUrl: true },
  });

  const selectedProfessional =
    isManager &&
    params.profissional &&
    params.profissional !== "todos" &&
    professionals.some((professional) => professional.id === params.profissional)
      ? params.profissional
      : null;

  const columns = selectedProfessional
    ? professionals.filter((professional) => professional.id === selectedProfessional)
    : professionals;

  const week = weekDays(date);
  const rangeStart = view === "semana" ? week[0] : date;
  const rangeEnd = view === "semana" ? week[6] : date;
  const range = dateRangeInZone(rangeStart, rangeEnd, establishment.timezone);

  const [appointments, blocks, hours] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        establishmentId: establishment.id,
        startAt: { gte: range.start, lt: range.end },
        ...(selectedProfessional
          ? { professionalId: selectedProfessional }
          : !isManager
            ? { professionalId: auth.professionalId ?? "__none__" }
            : {}),
      },
      include: { customer: { select: { name: true } } },
      orderBy: { startAt: "asc" },
    }),
    prisma.timeBlock.findMany({
      where: {
        establishmentId: establishment.id,
        startsAt: { lt: range.end },
        endsAt: { gt: range.start },
        ...(selectedProfessional
          ? { OR: [{ professionalId: null }, { professionalId: selectedProfessional }] }
          : !isManager
            ? { OR: [{ professionalId: null }, { professionalId: auth.professionalId ?? "__none__" }] }
            : {}),
      },
      orderBy: { startsAt: "asc" },
    }),
    prisma.businessHours.findUnique({
      where: {
        establishmentId_weekday: {
          establishmentId: establishment.id,
          weekday: getWeekday(view === "semana" ? date : date),
        },
      },
    }),
  ]);

  const todayLink = queryString({
    data: today,
    visao: view === "semana" ? "semana" : undefined,
    profissional: selectedProfessional ?? undefined,
  });
  const previousLink = queryString({
    data: addDaysToDate(date, view === "semana" ? -7 : -1),
    visao: view === "semana" ? "semana" : undefined,
    profissional: selectedProfessional ?? undefined,
  });
  const nextLink = queryString({
    data: addDaysToDate(date, view === "semana" ? 7 : 1),
    visao: view === "semana" ? "semana" : undefined,
    profissional: selectedProfessional ?? undefined,
  });

  const dateLabel =
    view === "semana"
      ? `${prettyDate(week[0], { day: "2-digit", month: "short" })} – ${prettyDate(week[6], { day: "2-digit", month: "short", year: "numeric" })}`
      : prettyDate(date, {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        });

  const totalActive = appointments.filter(
    (appointment) => appointment.status !== "CANCELLED",
  ).length;

  return (
    <div>
      <PageHeader
        eyebrow="Agenda"
        title={view === "semana" ? "Visão semanal" : "Visão do dia"}
        description={`${totalActive} atendimento(s) no período · fuso ${establishment.timezone}`}
        actions={
          <>
            <Link href={`/painel/agendamentos?novo=1&data=${date}`} className={buttonBrand}>
              <CalendarPlus className="h-4 w-4" /> Novo agendamento
            </Link>
            <Link href="/painel/configuracoes#bloqueios" className={buttonSecondary}>
              <Lock className="h-4 w-4" /> Bloquear horário
            </Link>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-line bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={`/painel/agenda${previousLink}`}
            aria-label="Período anterior"
            className="grid h-9 w-9 place-items-center rounded-lg border border-line text-slate-500 hover:bg-paper hover:text-ink"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link
            href={`/painel/agenda${todayLink}`}
            className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-paper hover:text-ink"
          >
            Hoje
          </Link>
          <Link
            href={`/painel/agenda${nextLink}`}
            aria-label="Próximo período"
            className="grid h-9 w-9 place-items-center rounded-lg border border-line text-slate-500 hover:bg-paper hover:text-ink"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
          <p className="ml-1 text-sm font-semibold capitalize text-ink">{dateLabel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-paper p-1">
            <TabLink
              href={`/painel/agenda${queryString({ data: date, profissional: selectedProfessional ?? undefined })}`}
              active={view === "dia"}
            >
              Dia
            </TabLink>
            <TabLink
              href={`/painel/agenda${queryString({ data: date, visao: "semana", profissional: selectedProfessional ?? undefined })}`}
              active={view === "semana"}
            >
              Semana
            </TabLink>
          </div>

          {isManager && professionals.length > 0 && (
            <form action="/painel/agenda" className="flex items-center gap-1.5">
              <input type="hidden" name="data" value={date} />
              {view === "semana" && <input type="hidden" name="visao" value="semana" />}
              <label htmlFor="profissional" className="sr-only">
                Filtrar profissional
              </label>
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <select
                id="profissional"
                name="profissional"
                defaultValue={selectedProfessional ?? "todos"}
                className="rounded-lg border border-line bg-white px-2.5 py-2 text-xs font-medium text-ink"
              >
                <option value="todos">Todos os profissionais</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-lg bg-brand px-2.5 py-2 text-xs font-semibold text-white"
              >
                Aplicar
              </button>
            </form>
          )}
        </div>
      </div>

      {view === "dia" ? (
        !hours?.isOpen ? (
          <div className="rounded-xl border border-line bg-white p-8 text-center">
            <CalendarDays className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-ink">
              Estabelecimento fechado neste dia
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {prettyDate(date, { weekday: "long", day: "2-digit", month: "long" })} não
              está marcado como dia de funcionamento.
            </p>
            <Link
              href="/painel/configuracoes#horarios"
              className="mt-4 inline-flex text-xs font-semibold text-ink underline underline-offset-2"
            >
              Revisar horários de funcionamento
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-inset ring-black/10">
                Funcionamento {minutesToTime(hours.openMinute)}–{minutesToTime(hours.closeMinute)}
              </span>
              {hours.breakStartMinute != null && hours.breakEndMinute != null && (
                <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-inset ring-black/10">
                  Pausa {minutesToTime(hours.breakStartMinute)}–{minutesToTime(hours.breakEndMinute)}
                </span>
              )}
              {blocks.length > 0 && (
                <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-inset ring-black/10">
                  {blocks.length} bloqueio(s)
                </span>
              )}
            </div>
            <DaySchedule
              timezone={establishment.timezone}
              openMinute={hours.openMinute}
              closeMinute={hours.closeMinute}
              professionals={columns}
              appointments={appointments}
              blocks={blocks}
            />

            <section className="mt-6 rounded-xl border border-line bg-white shadow-sm">
              <div className="border-b border-line px-4 py-3">
                <h2 className="text-sm font-semibold text-ink">Atendimentos do dia</h2>
              </div>
              {appointments.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    title="Nenhum atendimento neste dia"
                    description="Crie um agendamento manual ou compartilhe a página pública."
                    action={
                      <Link
                        href={`/painel/agendamentos?novo=1&data=${date}`}
                        className={buttonBrand}
                      >
                        <CalendarPlus className="h-4 w-4" /> Novo agendamento
                      </Link>
                    }
                  />
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {appointments.map((appointment) => (
                    <li
                      key={appointment.id}
                      className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-12 shrink-0 text-sm font-bold text-ink">
                          {formatDateTimeInZone(appointment.startAt, establishment.timezone, "HH:mm")}
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-ink">
                              {appointment.customerName}
                            </p>
                            <StatusBadge status={appointment.status} />
                          </div>
                          <p className="text-xs text-slate-500">
                            {appointment.serviceName} · {appointment.professionalName} ·{" "}
                            {formatDuration(appointment.durationMin)}
                          </p>
                        </div>
                      </div>
                      <AppointmentActions
                        appointmentId={appointment.id}
                        status={appointment.status}
                        role={auth.role}
                        returnTo={`/painel/agenda?data=${date}`}
                        compact
                        releasedAt={appointment.releasedAt}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7 xl:gap-2">
          {week.map((day) => {
            const weekday = getWeekday(day);
            const isToday = day === today;
            const items = appointments.filter(
              (appointment) =>
                formatDateTimeInZone(appointment.startAt, establishment.timezone, "yyyy-MM-dd") ===
                day,
            );
            const active = items.filter((item) => item.status !== "CANCELLED");
            return (
              <div
                key={day}
                className={`min-w-0 rounded-xl border bg-white shadow-sm ${
                  isToday ? "border-brand" : "border-line"
                }`}
              >
                <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      {WEEKDAYS[weekday].short}
                    </p>
                    <p className={`text-sm font-semibold ${isToday ? "text-ink" : "text-slate-700"}`}>
                      {prettyDate(day, { day: "2-digit", month: "2-digit" })}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      active.length > 0 ? "bg-brand text-white" : "bg-paper text-slate-500"
                    }`}
                  >
                    {active.length}
                  </span>
                </div>
                <div className="space-y-1.5 p-2">
                  {active.length === 0 ? (
                    <p className="px-1 py-3 text-center text-[10px] text-slate-500">
                      Sem atendimentos
                    </p>
                  ) : (
                    items.map((appointment) => (
                      <Link
                        key={appointment.id}
                        href={`/painel/agendamentos?protocolo=${encodeURIComponent(appointment.publicCode)}`}
                        className={`block rounded-lg border px-2 py-1.5 transition hover:brightness-[0.98] ${
                          appointment.status === "PENDING"
                            ? "border-amber-200 bg-amber-50"
                            : appointment.status === "CONFIRMED"
                              ? "border-green-200 bg-green-50"
                              : appointment.status === "CANCELLED"
                                ? "border-red-200 bg-red-50 opacity-60"
                                : "border-slate-200 bg-paper"
                        }`}
                      >
                        <p className="text-[10px] font-bold text-ink">
                          {formatDateTimeInZone(appointment.startAt, establishment.timezone, "HH:mm")}{" "}
                          · {appointment.customerName.split(" ")[0]}
                        </p>
                        <p className="truncate text-[9px] text-slate-500">
                          {appointment.serviceName}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
