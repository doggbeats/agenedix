import Link from "next/link";
import {
  ArrowRight,
  CalendarPlus,
  Clock3,
  ExternalLink,
  Scissors,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePanel } from "@/lib/auth/session";
import { isManagerRole } from "@/lib/permissions";
import { appointmentMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import { publicBookingUrl } from "@/lib/urls";
import { formatCurrency, formatDateTimeInZone, formatDuration } from "@/lib/format";
import { addDaysToDate, dateRangeInZone, todayInZone } from "@/lib/timezone";
import {
  Alert,
  buttonBrand,
  buttonSecondary,
  EmptyState,
  PageHeader,
  StatCard,
  StatusBadge,
} from "@/components/ui";
import { AppointmentActions } from "@/components/panel/AppointmentActions";

export const dynamic = "force-dynamic";

export default async function PanelDashboard({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string; "boas-vindas"?: string }>;
}) {
  const auth = await requirePanel();
  const params = await searchParams;
  const establishment = auth.establishment;
  const isManager = isManagerRole(auth.role);
  const today = todayInZone(establishment.timezone);
  const todayRange = dateRangeInZone(today, today, establishment.timezone);
  const monthRange = dateRangeInZone(
    `${today.slice(0, 7)}-01`,
    `${today.slice(0, 7)}-01`,
    establishment.timezone,
  );
  const monthEnd = dateRangeInZone(
    addDaysToDate(`${today.slice(0, 7)}-01`, 31),
    addDaysToDate(`${today.slice(0, 7)}-01`, 31),
    establishment.timezone,
  ).end;
  const now = new Date();
  const scope = isManager
    ? { establishmentId: establishment.id }
    : { establishmentId: establishment.id, professionalId: auth.professionalId ?? "__none__" };

  const [
    todayAppointments,
    nextAppointment,
    monthAggregate,
    todayRevenue,
    servicesCount,
    professionalsCount,
    customersCount,
    pendingCount,
  ] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        ...scope,
        startAt: { gte: todayRange.start, lt: todayRange.end },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        professional: { select: { name: true } },
      },
      orderBy: { startAt: "asc" },
    }),
    prisma.appointment.findFirst({
      where: {
        ...scope,
        startAt: { gte: now },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      include: { professional: { select: { name: true } } },
      orderBy: { startAt: "asc" },
    }),
    prisma.appointment.aggregate({
      where: {
        ...scope,
        startAt: { gte: monthRange.start, lt: monthEnd },
        status: { not: "CANCELLED" },
      },
      _count: { _all: true },
      _sum: { price: true },
    }),
    prisma.appointment.aggregate({
      where: {
        ...scope,
        startAt: { gte: todayRange.start, lt: todayRange.end },
        status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
      },
      _sum: { price: true },
    }),
    prisma.service.count({
      where: { establishmentId: establishment.id, deletedAt: null },
    }),
    prisma.professional.count({
      where: { establishmentId: establishment.id, active: true },
    }),
    isManager
      ? prisma.customer.count({
          where: { establishmentId: establishment.id, anonymizedAt: null },
        })
      : Promise.resolve(0),
    prisma.appointment.count({
      where: {
        ...scope,
        status: "PENDING",
        startAt: { gte: now },
      },
    }),
  ]);

  const todayActive = todayAppointments.filter(
    (appointment) => appointment.status !== "CANCELLED",
  );
  const confirmedToday = todayAppointments.filter(
    (appointment) => appointment.status === "CONFIRMED",
  );
  const monthCount = monthAggregate._count._all;

  const greeting = now.getHours() < 12 ? "Bom dia" : now.getHours() < 18 ? "Boa tarde" : "Boa noite";
  const firstName = auth.user.name.split(" ")[0];

  const shareMessage = `Olá! Agende seu horário na ${establishment.name}: ${publicBookingUrl(establishment.slug)}`;

  return (
    <div>
      <PageHeader
        eyebrow={isManager ? "Visão geral" : "Sua agenda"}
        title={`${greeting}, ${firstName}.`}
        description={
          isManager
            ? "O pulso do seu negócio hoje, sem planilhas."
            : "Seus atendimentos e o que precisa de atenção."
        }
        actions={
          <>
            <Link href="/painel/agenda" className={buttonSecondary}>
              Ver agenda
            </Link>
            {isManager && (
              <Link href="/painel/agendamentos?novo=1" className={buttonBrand}>
                <CalendarPlus className="h-4 w-4" /> Novo agendamento
              </Link>
            )}
          </>
        }
      />

      {(params["boas-vindas"] || params.ok) && (
        <div className="mb-5">
          <Alert tone="success">
            {params.ok ?? "Tudo pronto! Configure seus serviços e horários para começar a receber agendamentos."}
          </Alert>
        </div>
      )}
      {params.erro && (
        <div className="mb-5">
          <Alert tone="error">{params.erro}</Alert>
        </div>
      )}

      {!establishment.onboardingCompletedAt && isManager && (
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-brand/25 bg-brand/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Falta pouco para sua agenda ficar pronta</p>
            <p className="mt-0.5 text-xs text-slate-600">
              Cadastre serviços, equipe e horários para começar a receber agendamentos.
            </p>
          </div>
          <Link
            href="/painel/onboarding"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-xs font-semibold text-white hover:bg-black"
          >
            Abrir primeiros passos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Hoje"
          value={todayActive.length}
          hint={`${confirmedToday.length} confirmado(s) · ${pendingCount} pendente(s) no total`}
          accent
        />
        <StatCard
          label="Previsão de hoje"
          value={formatCurrency(todayRevenue._sum.price ?? 0)}
          hint="Agendamentos não cancelados"
        />
        <StatCard
          label="No mês"
          value={monthCount}
          hint={`${formatCurrency(monthAggregate._sum.price ?? 0)} em atendimentos`}
        />
        <StatCard
          label="Próximo horário"
          value={
            nextAppointment
              ? formatDateTimeInZone(nextAppointment.startAt, establishment.timezone, "HH:mm")
              : "—"
          }
          hint={
            nextAppointment
              ? `${nextAppointment.customerName} · ${formatDateTimeInZone(nextAppointment.startAt, establishment.timezone, "dd/MM")}`
              : "Nenhum horário futuro"
          }
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <section className="rounded-xl border border-line bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
            <div>
              <h2 className="text-sm font-semibold text-ink">
                {isManager ? "Agenda de hoje" : "Seus atendimentos de hoje"}
              </h2>
              <p className="text-[11px] text-slate-500">
                {formatDateTimeInZone(todayRange.start, establishment.timezone, "EEEE, dd 'de' MMMM")}
              </p>
            </div>
            <Link
              href="/painel/agenda"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-ink"
            >
              Abrir agenda <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="p-4 sm:p-5">
              <EmptyState
                title="Nenhum agendamento para hoje"
                description={
                  isManager
                    ? "Compartilhe sua página ou crie um agendamento manual para preencher a agenda."
                    : "Quando houver atendimentos seus, eles aparecem aqui."
                }
                action={
                  isManager ? (
                    <Link href="/painel/agendamentos?novo=1" className={buttonBrand}>
                      <CalendarPlus className="h-4 w-4" /> Criar agendamento
                    </Link>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {todayAppointments.map((appointment) => (
                <li
                  key={appointment.id}
                  className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="w-12 shrink-0 rounded-lg bg-paper py-1.5 text-center">
                      <p className="text-sm font-bold text-ink">
                        {formatDateTimeInZone(appointment.startAt, establishment.timezone, "HH:mm")}
                      </p>
                      <p className="text-[9px] uppercase text-slate-500">
                        {formatDuration(appointment.durationMin)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-ink">
                          {appointment.customerName}
                        </p>
                        <StatusBadge status={appointment.status} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {appointment.serviceName} · {appointment.professionalName} ·{" "}
                        {formatCurrency(appointment.price)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 pl-15 sm:pl-0">
                    {appointment.status !== "CANCELLED" && (
                      <a
                        href={buildWhatsAppLink(
                          appointment.customerPhone,
                          appointmentMessage({
                            customerName: appointment.customerName,
                            customerPhone: appointment.customerPhone,
                            serviceName: appointment.serviceName,
                            professionalName: appointment.professionalName,
                            startAt: appointment.startAt,
                            timezone: establishment.timezone,
                            protocol: appointment.publicCode,
                            establishmentName: establishment.name,
                            address: establishment.address,
                            policy: establishment.cancellationPolicy,
                            customTemplate: establishment.whatsappMessage,
                          }),
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-line px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-paper"
                      >
                        WhatsApp
                      </a>
                    )}
                    <AppointmentActions
                      appointmentId={appointment.id}
                      status={appointment.status}
                      role={auth.role}
                      returnTo="/painel"
                      compact
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-4">
          <section className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-semibold text-ink">Sua página pública</h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Compartilhe o link e deixe o cliente escolher o horário.
            </p>
            <div className="mt-3 rounded-lg border border-line bg-paper px-3 py-2 font-mono text-[10px] text-slate-600 break-all">
              /agendar/{establishment.slug}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={buildWhatsAppLink(establishment.whatsapp, shareMessage)}
                target="_blank"
                rel="noreferrer"
                className={buttonBrand}
              >
                Compartilhar no WhatsApp
              </a>
              <Link
                href={`/agendar/${establishment.slug}`}
                target="_blank"
                className={buttonSecondary}
              >
                <ExternalLink className="h-4 w-4" /> Abrir
              </Link>
            </div>
          </section>

          <section className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-semibold text-ink">Resumo da operação</h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Um retrato rápido do catálogo e dos atendimentos.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-line bg-paper p-3">
                <Scissors className="h-3.5 w-3.5 text-brand" />
                <p className="mt-2 text-lg font-semibold text-ink">{servicesCount}</p>
                <p className="text-[10px] text-slate-500">serviços cadastrados</p>
              </div>
              <div className="rounded-lg border border-line bg-paper p-3">
                <UserRound className="h-3.5 w-3.5 text-brand" />
                <p className="mt-2 text-lg font-semibold text-ink">{professionalsCount}</p>
                <p className="text-[10px] text-slate-500">profissionais ativos</p>
              </div>
              <div className="rounded-lg border border-line bg-paper p-3">
                <TrendingUp className="h-3.5 w-3.5 text-brand" />
                <p className="mt-2 text-lg font-semibold text-ink">{monthCount}</p>
                <p className="text-[10px] text-slate-500">atendimentos no mês</p>
              </div>
              {isManager ? (
                <div className="rounded-lg border border-line bg-paper p-3">
                  <Users className="h-3.5 w-3.5 text-brand" />
                  <p className="mt-2 text-lg font-semibold text-ink">{customersCount}</p>
                  <p className="text-[10px] text-slate-500">clientes ativos</p>
                </div>
              ) : null}
            </div>
            {isManager && (
              <Link
                href="/painel/relatorios"
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-ink"
              >
                Ver relatórios <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </section>

          <section className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-semibold text-ink">Atalhos</h2>
            <div className="mt-3 grid gap-2">
              {isManager ? (
                <>
                  <QuickLink href="/painel/servicos" label="Cadastrar serviço" detail="Preço, duração e profissionais" />
                  <QuickLink href="/painel/profissionais" label="Equipe" detail="Escalas e especialidades" />
                  <QuickLink href="/painel/relatorios" label="Relatórios" detail="Faturamento e ocupação" />
                </>
              ) : (
                <>
                  <QuickLink href="/painel/agenda" label="Minha agenda" detail="Veja o dia e a semana" />
                  <QuickLink href="/painel/agendamentos" label="Meus agendamentos" detail="Histórico e status" />
                </>
              )}
            </div>
          </section>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/20">
            <Clock3 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Lembrete de operação</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              A confirmação ao cliente é feita por você. Os botões de WhatsApp abrem a
              conversa com a mensagem pronta; o sistema não envia mensagens automáticas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  label,
  detail,
}: {
  href: string;
  label: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-line px-3 py-2.5 transition hover:bg-paper"
    >
      <span>
        <span className="block text-xs font-semibold text-ink">{label}</span>
        <span className="block text-[10px] text-slate-500">{detail}</span>
      </span>
      <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
    </Link>
  );
}
