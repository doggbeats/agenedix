import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CircleAlert,
  CreditCard,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  formatDateTimeInZone,
  formatCurrency,
  toNumber,
} from "@/lib/format";
import {
  addDaysToDate,
  dateRangeInZone,
  todayInZone,
} from "@/lib/timezone";
import { requirePlatformAdmin } from "@/lib/auth/session";
import {
  Badge,
  buttonSecondary,
  PageHeader,
  StatCard,
  StatusBadge,
  SubscriptionBadge,
} from "@/components/ui";

export const dynamic = "force-dynamic";

const PLATFORM_TIMEZONE = "America/Sao_Paulo";

const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Login realizado",
  "auth.logout": "Sessão encerrada",
  "establishment.created": "Estabelecimento criado",
  "establishment.settings.updated": "Configurações atualizadas",
  "establishment.hours.updated": "Horários atualizados",
  "appointment.created": "Agendamento criado",
  "appointment.updated": "Agendamento atualizado",
  "appointment.cancelled": "Agendamento cancelado",
  "customer.anonymized": "Dados de cliente anonimizados",
  "platform.establishment.active": "Estabelecimento reativado",
  "platform.establishment.suspended": "Estabelecimento suspenso",
  "platform.subscription.updated": "Assinatura atualizada",
  "platform.plan.created": "Plano criado",
  "platform.plan.updated": "Plano atualizado",
  "platform.plan.toggled": "Plano ativado/desativado",
  "subscription.change_requested": "Troca de plano solicitada",
};

function actionLabel(action: string): string {
  return (
    ACTION_LABELS[action] ??
    action.replaceAll(".", " · ").replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase())
  );
}

export default async function AdminDashboardPage() {
  await requirePlatformAdmin();
  const now = new Date();
  const today = todayInZone(PLATFORM_TIMEZONE);
  const monthStart = dateRangeInZone(`${today.slice(0, 7)}-01`, today, PLATFORM_TIMEZONE).start;
  const weekEnd = new Date(now.getTime() + 7 * 86400000);
  const trialWindow = addDaysToDate(today, 7);

  const [establishments, auditLogs, upcomingAppointments, upcomingCount] =
    await Promise.all([
      prisma.establishment.findMany({
        where: { archivedAt: null },
        include: {
          subscription: { include: { plan: true } },
          _count: {
            select: {
              professionals: true,
              services: true,
              appointments: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.findMany({
        include: {
          actor: { select: { name: true, email: true } },
          establishment: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.appointment.findMany({
        where: {
          startAt: { gte: now },
          status: { in: ["PENDING", "CONFIRMED"] },
          establishment: { archivedAt: null },
        },
        include: { establishment: { select: { name: true, slug: true } } },
        orderBy: { startAt: "asc" },
        take: 5,
      }),
      prisma.appointment.count({
        where: {
          startAt: { gte: now, lt: weekEnd },
          status: { in: ["PENDING", "CONFIRMED"] },
          establishment: { archivedAt: null },
        },
      }),
    ]);

  const total = establishments.length;
  const activeEstablishments = establishments.filter((item) => item.status === "ACTIVE");
  const suspended = establishments.filter((item) => item.status === "SUSPENDED");
  const activeSubscriptions = establishments.filter(
    (item) => item.subscription?.status === "ACTIVE",
  );
  const trialing = establishments.filter((item) => item.subscription?.status === "TRIALING");
  const pastDue = establishments.filter((item) => item.subscription?.status === "PAST_DUE");
  const withoutSubscription = establishments.filter((item) => !item.subscription);
  const publicPages = activeEstablishments.filter((item) => item.publicPageEnabled);
  const newThisMonth = establishments.filter((item) => item.createdAt >= monthStart);

  const mrr = activeSubscriptions.reduce((sum, item) => {
    if (!item.subscription) return sum;
    const value =
      item.subscription.billingCycle === "YEARLY"
        ? toNumber(item.subscription.plan.priceYearly) / 12
        : toNumber(item.subscription.plan.priceMonthly);
    return sum + value;
  }, 0);

  const trialsEnding = trialing.filter((item) => {
    const end = item.subscription?.trialEndsAt;
    if (!end) return false;
    return (
      end.getTime() >= now.getTime() &&
      end.toISOString().slice(0, 10) <= trialWindow
    );
  });

  const planCounts = new Map<string, { name: string; count: number }>();
  for (const item of establishments) {
    const key = item.subscription?.plan.name ?? "Sem assinatura";
    const entry = planCounts.get(key) ?? { name: key, count: 0 };
    entry.count += 1;
    planCounts.set(key, entry);
  }
  const planDistribution = [...planCounts.values()].sort((a, b) => b.count - a.count);
  const maxPlanCount = Math.max(1, ...planDistribution.map((item) => item.count));

  const attention = establishments
    .flatMap((item) => {
      const reasons: Array<{
        id: string;
        name: string;
        label: string;
        detail: string;
        tone: "danger" | "warn" | "info" | "neutral";
      }> = [];
      if (item.status === "SUSPENDED") {
        reasons.push({
          id: `${item.id}-suspended`,
          name: item.name,
          label: "Estabelecimento suspenso",
          detail: "A página pública e novos agendamentos estão bloqueados.",
          tone: "danger",
        });
      }
      if (item.subscription?.status === "PAST_DUE") {
        reasons.push({
          id: `${item.id}-past-due`,
          name: item.name,
          label: "Pagamento pendente",
          detail: `Plano ${item.subscription.plan.name} com pagamento a confirmar.`,
          tone: "warn",
        });
      }
      if (item.subscription?.status === "TRIALING") {
        const end = item.subscription.trialEndsAt;
        if (end && end.toISOString().slice(0, 10) <= trialWindow) {
          reasons.push({
            id: `${item.id}-trial`,
            name: item.name,
            label: "Teste terminando",
            detail: `Período de teste até ${formatDateTimeInZone(
              end,
              PLATFORM_TIMEZONE,
              "dd/MM/yyyy",
            )}.`,
            tone: "info",
          });
        }
      }
      if (!item.subscription) {
        reasons.push({
          id: `${item.id}-no-plan`,
          name: item.name,
          label: "Sem assinatura",
          detail: "Vincule um plano para liberar a operação.",
          tone: "neutral",
        });
      }
      return reasons;
    })
    .slice(0, 6);

  return (
    <div>
      <PageHeader
        eyebrow="Administração da plataforma"
        title="Visão geral"
        description="Acompanhe estabelecimentos, assinaturas e a operação sem acessar dados de clientes."
        actions={
          <>
            <Link href="/admin/estabelecimentos" className={buttonSecondary}>
              <Building2 className="h-4 w-4" /> Estabelecimentos
            </Link>
            <Link
              href="/admin/planos"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
            >
              <CreditCard className="h-4 w-4" /> Planos
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Estabelecimentos"
          value={total}
          hint={`${activeEstablishments.length} ativo(s) · ${suspended.length} suspenso(s)`}
          accent
        />
        <StatCard
          label="Assinaturas ativas"
          value={activeSubscriptions.length}
          hint={`${trialing.length} em teste · ${pastDue.length} com pendência`}
        />
        <StatCard
          label="Receita recorrente"
          value={formatCurrency(mrr)}
          hint="Soma mensal dos planos ativos (anual dividido por 12)"
        />
        <StatCard
          label="Novos no mês"
          value={newThisMonth.length}
          hint={`${publicPages.length} página(s) pública(s) ativa(s)`}
        />
      </div>

      <section className="mt-4 grid gap-3 rounded-xl border border-line bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: Sparkles,
            label: "Testes terminando",
            value: trialsEnding.length,
            hint: "Próximos 7 dias",
          },
          {
            icon: CalendarClock,
            label: "Agendamentos futuros",
            value: upcomingCount,
            hint: "Próximos 7 dias",
          },
          {
            icon: CircleAlert,
            label: "Sem assinatura",
            value: withoutSubscription.length,
            hint: "Precisam de vínculo",
          },
          {
            icon: TrendingUp,
            label: "Profissionais ativos",
            value: establishments.reduce(
              (sum, item) => sum + item._count.professionals,
              0,
            ),
            hint: "Em todos os estabelecimentos",
          },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
              <item.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                {item.label}
              </p>
              <p className="text-lg font-semibold leading-tight text-ink">{item.value}</p>
              <p className="truncate text-[10px] text-slate-500">{item.hint}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <section className="rounded-xl border border-line bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
            <div>
              <h2 className="text-sm font-semibold text-ink">Estabelecimentos recentes</h2>
              <p className="text-[11px] text-slate-500">
                Últimos cadastros e situação atual.
              </p>
            </div>
            <Link
              href="/admin/estabelecimentos"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-brand"
            >
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {establishments.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">
              Nenhum estabelecimento cadastrado.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {establishments.slice(0, 6).map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                      {item.status === "SUSPENDED" ? (
                        <Badge tone="danger">Suspenso</Badge>
                      ) : (
                        <Badge tone="success">Ativo</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      {item.segment} · {item.email} · {item._count.professionals} profissional(is)
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {item.subscription ? (
                      <SubscriptionBadge status={item.subscription.status} />
                    ) : (
                      <Badge tone="neutral">Sem plano</Badge>
                    )}
                    <Link
                      href={`/admin/estabelecimentos?q=${encodeURIComponent(item.name)}`}
                      className="rounded-md border border-line bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-paper"
                    >
                      Gerenciar
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-line bg-white shadow-sm">
          <div className="border-b border-line px-4 py-3.5 sm:px-5">
            <h2 className="text-sm font-semibold text-ink">Precisa de atenção</h2>
            <p className="text-[11px] text-slate-500">
              Pendências de assinatura e estabelecimentos bloqueados.
            </p>
          </div>
          {attention.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              Nenhuma pendência no momento.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {attention.map((item) => (
                <li key={item.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                  <Badge tone={item.tone}>{item.label}</Badge>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-ink">{item.name}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">
                      {item.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-line px-4 py-3 sm:px-5">
            <Link
              href="/admin/estabelecimentos"
              className="text-xs font-semibold text-slate-600 hover:text-brand"
            >
              Revisar assinaturas
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-xl border border-line bg-white shadow-sm">
          <div className="border-b border-line px-4 py-3.5 sm:px-5">
            <h2 className="text-sm font-semibold text-ink">Distribuição por plano</h2>
            <p className="text-[11px] text-slate-500">
              Todos os estabelecimentos, inclusive teste e suspensos.
            </p>
          </div>
          <div className="space-y-3 p-4 sm:p-5">
            {planDistribution.map((item) => (
              <div key={item.name}>
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate font-medium text-slate-700">{item.name}</span>
                  <span className="font-semibold text-ink">{item.count}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{
                      width: `${Math.max(4, Math.round((item.count / maxPlanCount) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {planDistribution.length === 0 && (
              <p className="text-sm text-slate-500">Nenhum dado disponível.</p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-line bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
            <div>
              <h2 className="text-sm font-semibold text-ink">Próximos agendamentos</h2>
              <p className="text-[11px] text-slate-500">
                Visão operacional sem exibir telefone ou dados sensíveis.
              </p>
            </div>
            <CalendarClock className="h-4 w-4 text-slate-500" />
          </div>
          {upcomingAppointments.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              Nenhum agendamento futuro registrado.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {upcomingAppointments.map((appointment) => (
                <li
                  key={appointment.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-ink">
                      {appointment.establishment.name} · {appointment.serviceName}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {formatDateTimeInZone(
                        appointment.startAt,
                        PLATFORM_TIMEZONE,
                        "dd/MM 'às' HH:mm",
                      )}{" "}
                      · {appointment.professionalName}
                    </p>
                  </div>
                  <StatusBadge status={appointment.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-4 rounded-xl border border-line bg-white shadow-sm">
        <div className="border-b border-line px-4 py-3.5 sm:px-5">
          <h2 className="text-sm font-semibold text-ink">Auditoria recente</h2>
          <p className="text-[11px] text-slate-500">
            Ações administrativas e operacionais registradas na plataforma.
          </p>
        </div>
        {auditLogs.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            Nenhum registro de auditoria.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {auditLogs.map((log) => (
              <li
                key={log.id}
                className="flex flex-col gap-1 px-4 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-700">
                    {actionLabel(log.action)}
                  </p>
                  <p className="truncate text-[10px] text-slate-500">
                    {log.actor?.name ?? "Sistema"}
                    {log.establishment ? ` · ${log.establishment.name}` : ""}
                    {log.entityType ? ` · ${log.entityType}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] text-slate-500">
                  {formatDateTimeInZone(log.createdAt, PLATFORM_TIMEZONE, "dd/MM/yyyy HH:mm")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
