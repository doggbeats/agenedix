import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Check,
  CreditCard,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth/session";
import { getSubscriptionOverview, isSubscriptionUsable, planFeatures } from "@/lib/subscription";
import { formatCurrency, formatDateInZone, formatDateTimeInZone, toNumber } from "@/lib/format";
import {
  Badge,
  buttonSecondary,
  EmptyState,
  PageHeader,
  StatCard,
  SubscriptionBadge,
} from "@/components/ui";
import { PlanRequestForm } from "@/components/panel/PlanRequestForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Plano e cobrança" };

function daysUntil(date: Date): number {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86_400_000));
}

export default async function PlanPage() {
  const auth = await requireOwner();
  const establishment = auth.establishment;
  const timezone = establishment.timezone;

  const [{ subscription, plans }, payments, professionals, services, memberships] =
    await Promise.all([
      getSubscriptionOverview(establishment.id),
      prisma.payment.findMany({
        where: { establishmentId: establishment.id },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      prisma.professional.count({
        where: { establishmentId: establishment.id, active: true },
      }),
      prisma.service.count({
        where: { establishmentId: establishment.id, deletedAt: null },
      }),
      prisma.membership.count({ where: { establishmentId: establishment.id } }),
    ]);

  const usable = isSubscriptionUsable(subscription);
  const plan = subscription?.plan ?? null;
  const trialDaysLeft =
    subscription?.status === "TRIALING" && subscription.trialEndsAt
      ? daysUntil(subscription.trialEndsAt)
      : null;
  const paidTotal = payments
    .filter((payment) => payment.status === "PAID")
    .reduce((sum, payment) => sum + toNumber(payment.amount), 0);

  return (
    <div>
      <PageHeader
        eyebrow="Plano e cobrança"
        title="Seu plano na Agendix"
        description="Acompanhe o período de teste, os limites do plano e o histórico de pagamentos. A cobrança é combinada diretamente com a equipe Agendix."
        actions={
          <>
            <Link href="/painel/equipe" className={buttonSecondary}>
              <Users className="h-4 w-4" /> Equipe e acessos
            </Link>
            <Link href="/painel/configuracoes" className={buttonSecondary}>
              Configurações
            </Link>
          </>
        }
      />

      {!usable && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <p className="text-sm font-semibold text-amber-900">
            A página pública está pausada
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
            {subscription
              ? "O período de teste terminou ou a assinatura precisa de atenção. Regularize o pagamento para voltar a receber agendamentos online."
              : "Nenhum plano está vinculado a este estabelecimento. Escolha um plano abaixo para liberar a página pública."}{" "}
            O painel continua funcionando normalmente.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Plano atual"
          value={plan?.name ?? "Sem plano"}
          hint={
            subscription
              ? `${subscription.billingCycle === "YEARLY" ? "Anual" : "Mensal"} · ${subscription.provider === "MANUAL" ? "cobrança manual" : subscription.provider}`
              : "Escolha um plano para começar"
          }
          accent
        />
        <StatCard
          label="Situação"
          value={subscription ? <SubscriptionBadge status={subscription.status} /> : "—"}
          hint={
            trialDaysLeft != null
              ? `${trialDaysLeft} dia(s) restante(s) de teste`
              : subscription?.currentPeriodEnd
                ? `Período até ${formatDateInZone(subscription.currentPeriodEnd, timezone)}`
                : "Sem data de renovação"
          }
        />
        <StatCard
          label="Investimento mensal"
          value={
            plan
              ? formatCurrency(
                  subscription?.billingCycle === "YEARLY"
                    ? toNumber(plan.priceYearly) / 12
                    : plan.priceMonthly,
                )
              : "—"
          }
          hint={
            subscription?.billingCycle === "YEARLY"
              ? `Anual: ${formatCurrency(plan?.priceYearly ?? 0)}`
              : "Valor mensal do plano"
          }
        />
        <StatCard
          label="Pagamentos confirmados"
          value={formatCurrency(paidTotal)}
          hint={`${payments.filter((payment) => payment.status === "PAID").length} registro(s)`}
        />
      </div>

      {plan && (
        <section className="mt-6 rounded-xl border border-line bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-ink">{plan.name}</h2>
                {plan.highlight && <Badge tone="brand">Recomendado</Badge>}
                {subscription && <SubscriptionBadge status={subscription.status} />}
              </div>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500">
                {plan.description}
              </p>
            </div>
            <p className="shrink-0 text-2xl font-semibold text-ink">
              {formatCurrency(plan.priceMonthly)}
              <span className="text-xs font-normal text-slate-500">/mês</span>
            </p>
          </div>

          <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Uso do plano
              </p>
              <div className="mt-3 space-y-3">
                <Usage
                  label="Profissionais ativos"
                  used={professionals}
                  max={plan.maxProfessionals}
                />
                <Usage label="Serviços cadastrados" used={services} max={plan.maxServices} />
                <Usage label="Acessos ao painel" used={memberships} max={plan.maxUsers} />
                <Usage
                  label="Unidades"
                  used={1}
                  max={plan.maxUnits}
                  hint="A gestão de unidades é feita com a equipe Agendix."
                />
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                O que está incluído
              </p>
              <ul className="mt-3 space-y-2 text-xs text-slate-600">
                {planFeatures(plan).map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                    {feature}
                  </li>
                ))}
                {planFeatures(plan).length === 0 && (
                  <li className="text-slate-500">Recursos detalhados com a equipe.</li>
                )}
              </ul>
            </div>

            <div className="rounded-lg border border-line bg-paper p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Datas importantes
              </p>
              <dl className="mt-3 space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-slate-500">Início do período</dt>
                  <dd className="text-right font-medium text-slate-700">
                    {subscription?.currentPeriodStart
                      ? formatDateInZone(subscription.currentPeriodStart, timezone)
                      : "—"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-slate-500">
                    {subscription?.status === "TRIALING" ? "Fim do teste" : "Próxima renovação"}
                  </dt>
                  <dd className="text-right font-medium text-slate-700">
                    {subscription?.status === "TRIALING" && subscription.trialEndsAt
                      ? formatDateInZone(subscription.trialEndsAt, timezone)
                      : subscription?.currentPeriodEnd
                        ? formatDateInZone(subscription.currentPeriodEnd, timezone)
                        : "—"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-slate-500">Ciclo</dt>
                  <dd className="text-right font-medium text-slate-700">
                    {subscription?.billingCycle === "YEARLY" ? "Anual" : "Mensal"}
                  </dd>
                </div>
              </dl>
              {subscription?.notes && (
                <p className="mt-3 border-t border-line pt-3 text-[10px] leading-relaxed text-slate-500">
                  Observação: {subscription.notes}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-ink">Planos disponíveis</h2>
            <p className="text-[11px] text-slate-500">
              Ao solicitar um plano, a equipe Agendix confirma o pagamento antes de ativar a
              mudança. Nada é cobrado automaticamente.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-brand" /> 7 dias de teste em todos os planos
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((item) => {
            const current = item.id === plan?.id;
            return (
              <article
                key={item.id}
                className={`flex flex-col rounded-xl border bg-white shadow-sm ${
                  current ? "border-brand/40" : "border-line"
                }`}
              >
                <div className="border-b border-line px-4 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-ink">{item.name}</h3>
                    {item.highlight && <Badge tone="brand">Mais escolhido</Badge>}
                  </div>
                  <p className="mt-1 min-h-[32px] text-[11px] leading-relaxed text-slate-500">
                    {item.description}
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-ink">
                    {formatCurrency(item.priceMonthly)}
                    <span className="text-xs font-normal text-slate-500">/mês</span>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    ou {formatCurrency(item.priceYearly)}/ano
                  </p>
                </div>

                <ul className="flex-1 space-y-2 px-4 py-4 text-xs text-slate-600">
                  {planFeatures(item).map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                      {feature}
                    </li>
                  ))}
                  <li className="flex gap-2">
                    <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                    Até {item.maxUsers} acesso(s) ao painel
                  </li>
                  <li className="flex gap-2">
                    <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                    {item.maxAppointmentsMonth
                      ? `${item.maxAppointmentsMonth} agendamentos/mês`
                      : "Agendamentos ilimitados"}
                  </li>
                </ul>

                <div className="border-t border-line p-4">
                  <PlanRequestForm planId={item.id} planName={item.name} current={current} />
                  {!current && plan && (
                    <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                      <ArrowRight className="h-3 w-3" /> Mudança de {plan.name} para {item.name}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-line bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
          <div>
            <h2 className="text-sm font-semibold text-ink">Histórico de pagamentos</h2>
            <p className="text-[11px] text-slate-500">
              Registros confirmados pela equipe Agendix. Nenhuma cobrança é feita pela
              plataforma.
            </p>
          </div>
          <ReceiptText className="h-4 w-4 text-slate-400" />
        </div>

        {payments.length === 0 ? (
          <div className="p-4 sm:p-5">
            <EmptyState
              title="Nenhum pagamento registrado"
              description="Quando a equipe confirmar um pagamento, ele aparece aqui com data e período."
              icon={<CreditCard className="h-5 w-5" />}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="border-b border-line bg-paper text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-semibold sm:px-5">Data</th>
                  <th className="px-4 py-2.5 font-semibold">Valor</th>
                  <th className="px-4 py-2.5 font-semibold">Situação</th>
                  <th className="px-4 py-2.5 font-semibold">Período</th>
                  <th className="px-4 py-2.5 font-semibold">Forma</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 text-slate-600 sm:px-5">
                      {formatDateTimeInZone(
                        payment.paidAt ?? payment.createdAt,
                        timezone,
                        "dd/MM/yyyy",
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          payment.status === "PAID"
                            ? "success"
                            : payment.status === "PENDING"
                              ? "warn"
                              : payment.status === "REFUNDED"
                                ? "info"
                                : "danger"
                        }
                      >
                        {payment.status === "PAID"
                          ? "Pago"
                          : payment.status === "PENDING"
                            ? "Pendente"
                            : payment.status === "REFUNDED"
                              ? "Reembolsado"
                              : "Falhou"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {payment.periodStart && payment.periodEnd
                        ? `${formatDateInZone(payment.periodStart, timezone)} – ${formatDateInZone(
                            payment.periodEnd,
                            timezone,
                          )}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {payment.method ?? "Manual"}
                      {payment.notes ? ` · ${payment.notes}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-5 flex items-start gap-3 rounded-xl border border-line bg-white p-4 text-xs leading-relaxed text-slate-500">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <p className="font-semibold text-ink">Precisa de outro formato?</p>
          <p className="mt-0.5">
            Fale com a equipe Agendix para condições especiais, mais unidades ou migração de
            dados. Os limites de profissionais, serviços e acessos são aplicados pelo servidor.
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
            <BadgeCheck className="h-3.5 w-3.5 text-brand" /> Valores e limites podem ser
            atualizados pela administração da plataforma.
          </p>
        </div>
      </div>
    </div>
  );
}

function Usage({
  label,
  used,
  max,
  hint,
}: {
  label: string;
  used: number;
  max: number;
  hint?: string;
}) {
  const ratio = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const atLimit = used >= max;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="text-slate-600">{label}</span>
        <span className={atLimit ? "font-semibold text-amber-700" : "font-semibold text-ink"}>
          {used}/{max}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${atLimit ? "bg-amber-500" : "bg-brand"}`}
          style={{ width: `${Math.max(4, ratio)}%` }}
        />
      </div>
      {hint && <p className="mt-1 text-[10px] text-slate-500">{hint}</p>}
    </div>
  );
}
