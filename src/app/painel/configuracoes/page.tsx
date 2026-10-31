import Link from "next/link";
import type { Metadata } from "next";
import {
  Bell,
  CalendarDays,
  CalendarOff,
  Clock3,
  ExternalLink,
  Lock,
  Settings2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/auth/session";
import { formatDateTimeInZone } from "@/lib/format";
import { addDaysToDate, todayInZone } from "@/lib/timezone";
import { deleteTimeBlockAction } from "@/lib/actions/settings";
import { deleteScheduleExceptionAction } from "@/lib/actions/branding";
import { isEmailConfigured } from "@/lib/email";
import { buttonSecondary, PageHeader } from "@/components/ui";
import { SettingsForm } from "@/components/panel/SettingsForm";
import { BusinessHoursForm } from "@/components/panel/BusinessHoursForm";
import { TimeBlockForm } from "@/components/panel/TimeBlockForm";
import {
  NotificationSettingsForm,
  ScheduleExceptionForm,
} from "@/components/panel/SettingsExtras";
import { ConfirmButton } from "@/components/ConfirmButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Configurações" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const auth = await requireManager();
  const params = await searchParams;
  const establishment = auth.establishment;
  const now = new Date();
  const today = todayInZone(establishment.timezone);

  const [hours, timeBlocks, professionals, exceptions] = await Promise.all([
    prisma.businessHours.findMany({
      where: { establishmentId: establishment.id },
      orderBy: { weekday: "asc" },
    }),
    prisma.timeBlock.findMany({
      where: {
        establishmentId: establishment.id,
        endsAt: { gte: now },
      },
      include: { professional: { select: { name: true } } },
      orderBy: { startsAt: "asc" },
      take: 12,
    }),
    prisma.professional.findMany({
      where: { establishmentId: establishment.id, active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.scheduleException.findMany({
      where: {
        establishmentId: establishment.id,
        date: { gte: new Date(`${today}T00:00:00.000Z`) },
      },
      include: { professional: { select: { name: true } } },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      take: 20,
    }),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Configurações"
        title="Ajustes do estabelecimento"
        description="Dados públicos, horários de funcionamento e bloqueios de agenda."
        actions={
          <Link
            href={`/agendar/${establishment.slug}`}
            target="_blank"
            className={buttonSecondary}
          >
            <ExternalLink className="h-4 w-4" /> Ver página pública
          </Link>
        }
      />

      {(params.ok || params.erro) && (
        <div
          className={`mb-5 rounded-lg border px-3.5 py-3 text-sm ${
            params.erro
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-green-200 bg-green-50 text-green-900"
          }`}
        >
          {params.erro ?? params.ok}
        </div>
      )}

      <nav
        aria-label="Atalhos de configuração"
        className="mb-5 flex flex-wrap gap-2 text-xs"
      >
        {[
          ["#dados", "Dados do estabelecimento"],
          ["#horarios", "Horários"],
          ["#bloqueios", "Bloqueios"],
          ["#excecoes", "Exceções"],
          ["#notificacoes", "Notificações"],
          ["#privacidade", "Privacidade"],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="rounded-md border border-line bg-white px-2.5 py-1.5 font-semibold text-slate-600 hover:bg-paper"
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="space-y-5">
        <section
          id="dados"
          className="scroll-mt-24 rounded-xl border border-line bg-white shadow-sm"
        >
          <div className="flex items-start gap-3 border-b border-line px-4 py-4 sm:px-5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
              <Settings2 className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-ink">Dados do estabelecimento</h2>
              <p className="text-[11px] text-slate-500">
                Essas informações aparecem na sua página pública e nos comprovantes.
              </p>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <SettingsForm
              establishment={{
                name: establishment.name,
                slug: establishment.slug,
                segment: establishment.segment,
                ownerName: establishment.ownerName,
                phone: establishment.phone,
                whatsapp: establishment.whatsapp,
                email: establishment.email,
                address: establishment.address ?? "",
                description: establishment.description ?? "",
                logoUrl: establishment.logoUrl ?? "",
                brandColor: establishment.brandColor,
                timezone: establishment.timezone,
                autoConfirmBookings: establishment.autoConfirmBookings,
                publicPageEnabled: establishment.publicPageEnabled,
                minAdvanceMinutes: establishment.minAdvanceMinutes,
                maxAdvanceDays: establishment.maxAdvanceDays,
                cancellationNoticeHours: establishment.cancellationNoticeHours,
                defaultServiceMin: establishment.defaultServiceMin,
                slotIntervalMinutes: establishment.slotIntervalMinutes,
                cancellationPolicy: establishment.cancellationPolicy ?? "",
                whatsappMessage: establishment.whatsappMessage ?? "",
              }}
            />
          </div>
        </section>

        <section
          id="horarios"
          className="scroll-mt-24 rounded-xl border border-line bg-white shadow-sm"
        >
          <div className="flex items-start gap-3 border-b border-line px-4 py-4 sm:px-5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
              <Clock3 className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-ink">Horário de funcionamento</h2>
              <p className="text-[11px] text-slate-500">
                Vale para todos os profissionais. A pausa é opcional e bloqueia a agenda no
                intervalo.
              </p>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <BusinessHoursForm
              hours={hours.map((item) => ({
                weekday: item.weekday,
                isOpen: item.isOpen,
                openMinute: item.openMinute,
                closeMinute: item.closeMinute,
                breakStartMinute: item.breakStartMinute,
                breakEndMinute: item.breakEndMinute,
              }))}
            />
          </div>
        </section>

        <section
          id="bloqueios"
          className="scroll-mt-24 rounded-xl border border-line bg-white shadow-sm"
        >
          <div className="flex items-start gap-3 border-b border-line px-4 py-4 sm:px-5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
              <Lock className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-ink">Bloqueios de agenda</h2>
              <p className="text-[11px] text-slate-500">
                Compromissos e intervalos que não devem receber agendamentos.
              </p>
            </div>
          </div>
          <div className="grid gap-6 p-4 sm:p-5 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                Novo bloqueio
              </h3>
              <TimeBlockForm professionals={professionals} defaultDate={today} />
            </div>

            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                Próximos bloqueios
              </h3>
              {timeBlocks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-line bg-paper px-4 py-8 text-center text-sm text-slate-500">
                  Nenhum bloqueio futuro registrado.
                </div>
              ) : (
                <ul className="space-y-2">
                  {timeBlocks.map((block) => (
                    <li
                      key={block.id}
                      className="flex flex-col gap-2 rounded-lg border border-line bg-white px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">
                          {formatDateTimeInZone(
                            block.startsAt,
                            establishment.timezone,
                            "dd/MM/yyyy HH:mm",
                          )}{" "}
                          –{" "}
                          {formatDateTimeInZone(
                            block.endsAt,
                            establishment.timezone,
                            "HH:mm",
                          )}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">
                          {block.professional?.name ?? "Todos os profissionais"}
                          {block.reason ? ` · ${block.reason}` : ""}
                        </p>
                      </div>
                      <form action={deleteTimeBlockAction} className="shrink-0">
                        <input type="hidden" name="id" value={block.id} />
                        <ConfirmButton
                          confirmMessage="Remover este bloqueio de agenda?"
                          className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remover
                        </ConfirmButton>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
                Bloqueios não cancelam agendamentos existentes. Se houver conflito, ajuste ou
                cancele o atendimento na agenda.
              </p>
            </div>
          </div>
        </section>

        <section
          id="excecoes"
          className="scroll-mt-24 rounded-xl border border-line bg-white shadow-sm"
        >
          <div className="flex items-start gap-3 border-b border-line px-4 py-4 sm:px-5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
              <CalendarOff className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-ink">Exceções de funcionamento</h2>
              <p className="text-[11px] text-slate-500">
                Feche um dia específico ou abra em horário diferente. Vale para todos ou para
                um profissional.
              </p>
            </div>
          </div>
          <div className="grid gap-6 p-4 sm:p-5 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                Nova exceção
              </h3>
              <ScheduleExceptionForm professionals={professionals} defaultDate={today} />
            </div>
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                Próximas exceções
              </h3>
              {exceptions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-line bg-paper px-4 py-8 text-center text-sm text-slate-500">
                  Nenhuma exceção futura registrada.
                </div>
              ) : (
                <ul className="space-y-2">
                  {exceptions.map((exception) => {
                    const [year, month, day] = exception.date
                      .toISOString()
                      .slice(0, 10)
                      .split("-");
                    return (
                      <li
                        key={exception.id}
                        className="flex flex-col gap-2 rounded-lg border border-line bg-white px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink">
                            {day}/{month}/{year} ·{" "}
                            {exception.isClosed
                              ? "Fechado"
                              : `${String(Math.floor((exception.openMinute ?? 0) / 60)).padStart(2, "0")}:${String(
                                  (exception.openMinute ?? 0) % 60,
                                ).padStart(2, "0")}–${String(
                                  Math.floor((exception.closeMinute ?? 0) / 60),
                                ).padStart(2, "0")}:${String(
                                  (exception.closeMinute ?? 0) % 60,
                                ).padStart(2, "0")}`}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-slate-500">
                            {exception.professional?.name ?? "Todos os profissionais"}
                            {exception.reason ? ` · ${exception.reason}` : ""}
                          </p>
                        </div>
                        <form action={deleteScheduleExceptionAction} className="shrink-0">
                          <input type="hidden" name="id" value={exception.id} />
                          <ConfirmButton
                            confirmMessage="Remover esta exceção de funcionamento?"
                            className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Remover
                          </ConfirmButton>
                        </form>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section
          id="notificacoes"
          className="scroll-mt-24 rounded-xl border border-line bg-white shadow-sm"
        >
          <div className="flex items-start gap-3 border-b border-line px-4 py-4 sm:px-5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
              <Bell className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-ink">Notificações por e-mail</h2>
              <p className="text-[11px] text-slate-500">
                Confirmações, cancelamentos, remarcações e lembretes para os clientes que
                informaram e-mail.
              </p>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <NotificationSettingsForm
              settings={{
                emailNotifications: establishment.emailNotifications,
                notifyBookingCreated: establishment.notifyBookingCreated,
                notifyBookingCancelled: establishment.notifyBookingCancelled,
                notifyBookingRescheduled: establishment.notifyBookingRescheduled,
                reminderHours: establishment.reminderHours,
              }}
              emailConfigured={isEmailConfigured()}
            />
          </div>
        </section>

        <section
          id="privacidade"
          className="scroll-mt-24 rounded-xl border border-line bg-white shadow-sm"
        >
          <div className="flex items-start gap-3 p-4 sm:p-5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-ink">Privacidade e LGPD</h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600">
                Solicitações de exclusão de dados pessoais podem ser atendidas em Clientes.
                O histórico financeiro é mantido de forma anonimizada. Consulte também a{" "}
                <Link href="/privacidade" className="font-semibold text-brand hover:underline">
                  política de privacidade
                </Link>{" "}
                e os{" "}
                <Link href="/termos" className="font-semibold text-brand hover:underline">
                  termos de uso
                </Link>
                .
              </p>
              <Link
                href="/painel/clientes"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-brand"
              >
                <CalendarDays className="h-3.5 w-3.5" /> Abrir clientes e exclusão de dados
              </Link>
            </div>
          </div>
        </section>
      </div>

      <p className="mt-5 text-[10px] text-slate-600">
        Fuso do estabelecimento: {establishment.timezone} · próximo dia considerado nos
        bloqueios: {addDaysToDate(today, 0)}
      </p>
    </div>
  );
}
