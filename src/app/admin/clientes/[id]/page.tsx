import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Building2,
  CalendarClock,
  CircleDollarSign,
  CreditCard,
  ExternalLink,
  LogIn,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  ScrollText,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  UserRound,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/auth/session";
import {
  formatCurrency,
  formatDateInZone,
  formatDateTimeInZone,
  formatPhone,
  toNumber,
} from "@/lib/format";
import { dateRangeInZone, todayInZone } from "@/lib/timezone";
import {
  ROLE_LABELS,
  SUBSCRIPTION_LABELS,
} from "@/lib/constants";
import { toggleEstablishmentStatusAction, startImpersonationAction, archiveEstablishmentAction, verifyUserEmailAction } from "@/lib/actions/admin";
import {
  Alert,
  Badge,
  buttonPrimary,
  buttonSecondary,
  EmptyState,
  PageHeader,
  StatCard,
  SubscriptionBadge,
} from "@/components/ui";
import { ConfirmButton } from "@/components/ConfirmButton";
import { AdminSubscriptionForm } from "@/components/platform/AdminSubscriptionForm";
import { ManualPaymentForm } from "@/components/platform/ManualPaymentForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ficha do cliente" };

const PLATFORM_TIMEZONE = "America/Sao_Paulo";

const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Login realizado",
  "establishment.created": "Estabelecimento criado",
  "establishment.settings.updated": "Configurações atualizadas",
  "establishment.hours.updated": "Horários atualizados",
  "platform.establishment.active": "Estabelecimento reativado",
  "platform.establishment.suspended": "Estabelecimento suspenso",
  "platform.establishment.archived": "Estabelecimento apagado",
  "platform.establishment.restored": "Estabelecimento restaurado",
  "platform.establishment.deleted": "Estabelecimento excluído definitivamente",
  "platform.subscription.created": "Assinatura criada",
  "platform.subscription.updated": "Assinatura atualizada",
  "platform.payment.registered": "Pagamento registrado",
  "platform.impersonation.started": "Acesso ao painel do cliente",
  "platform.impersonation.stopped": "Retorno ao admin",
  "platform.user.email.verified": "E-mail verificado manualmente",
  "subscription.change_requested": "Troca de plano solicitada",
};

function actionLabel(action: string): string {
  return (
    ACTION_LABELS[action] ??
    action
      .replaceAll(".", " · ")
      .replaceAll("_", " ")
      .replace(/^\w/, (letter) => letter.toUpperCase())
  );
}

function providerLabel(provider: string): string {
  if (provider === "PAGARME") return "Pagar.me";
  if (provider === "INFINITEPAY") return "InfinitePay";
  if (provider === "MANUAL") return "Cobrança manual";
  return provider;
}

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

function roleTone(role: string) {
  return role === "OWNER" ? ("brand" as const) : role === "ADMIN" ? ("info" as const) : ("neutral" as const);
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 break-words text-xs text-slate-700">{children}</dd>
    </div>
  );
}

function Usage({
  label,
  used,
  max,
}: {
  label: string;
  used: number;
  max: number | null;
}) {
  if (!max) {
    return (
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold text-slate-700">{used} · ilimitado</span>
      </div>
    );
  }

  const ratio = Math.min(100, Math.round((used / max) * 100));
  const atLimit = used >= max;

  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="text-slate-500">{label}</span>
        <span className={atLimit ? "font-semibold text-amber-700" : "font-semibold text-slate-700"}>
          {used}/{max}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${atLimit ? "bg-amber-500" : "bg-brand"}`}
          style={{ width: `${Math.max(4, ratio)}%` }}
        />
      </div>
    </div>
  );
}

export default async function AdminClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  await requirePlatformAdmin();
  const { id } = await params;
  const query = await searchParams;
  const today = todayInZone(PLATFORM_TIMEZONE);
  const monthStart = dateRangeInZone(`${today.slice(0, 7)}-01`, today, PLATFORM_TIMEZONE).start;
  const monthEnd = dateRangeInZone(today, today, PLATFORM_TIMEZONE).end;

  const [establishment, plans, paidAggregate] = await Promise.all([
    prisma.establishment.findUnique({
      where: { id },
      include: {
        subscription: { include: { plan: true } },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                lastLoginAt: true,
                emailVerifiedAt: true,
                createdAt: true,
              },
            },
            professional: { select: { name: true, active: true } },
          },
          orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        },
        payments: {
          orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
          take: 10,
        },
        auditLogs: {
          include: { actor: { select: { name: true, email: true } } },
          orderBy: { createdAt: "desc" },
          take: 12,
        },
        _count: {
          select: {
            professionals: { where: { active: true } },
            services: { where: { deletedAt: null } },
            customers: true,
            memberships: true,
            units: { where: { active: true } },
            appointments: {
              where: {
                startAt: { gte: monthStart, lt: monthEnd },
                status: { not: "CANCELLED" },
              },
            },
          },
        },
      },
    }),
    prisma.subscriptionPlan.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, active: true },
    }),
    prisma.payment.aggregate({
      where: { establishmentId: id, status: "PAID" },
      _sum: { amount: true },
    }),
  ]);

  if (!establishment) notFound();

  const subscription = establishment.subscription;
  const plan = subscription?.plan ?? null;
  const owner = establishment.memberships.find((member) => member.role === "OWNER") ?? null;
  const monthlyValue = subscription
    ? toNumber(
        subscription.billingCycle === "YEARLY"
          ? subscription.plan.priceYearly
          : subscription.plan.priceMonthly,
      ) / (subscription.billingCycle === "YEARLY" ? 12 : 1)
    : 0;
  const trialEnds = subscription?.trialEndsAt
    ? formatDateInZone(subscription.trialEndsAt, PLATFORM_TIMEZONE)
    : null;
  const periodEnds = subscription?.currentPeriodEnd
    ? formatDateInZone(subscription.currentPeriodEnd, PLATFORM_TIMEZONE)
    : null;
  const paymentTarget = {
    id: establishment.id,
    name: establishment.name,
    planName: plan?.name ?? "Sem plano",
    status: subscription ? SUBSCRIPTION_LABELS[subscription.status] : "Sem assinatura",
    suggestedAmount: subscription
      ? toNumber(
          subscription.billingCycle === "YEARLY"
            ? subscription.plan.priceYearly
            : subscription.plan.priceMonthly,
        )
      : 0,
    currentPeriodEnd: periodEnds,
  };

  return (
    <div>
      <PageHeader
        eyebrow="Cliente"
        title={establishment.name}
        description={`${establishment.segment} · cadastrado em ${formatDateInZone(
          establishment.createdAt,
          PLATFORM_TIMEZONE,
        )}. Ficha completa com contato, assinatura, uso, equipe e auditoria.`}
        actions={
          <>
            <Link href="/admin/clientes" className={buttonSecondary}>
              <ArrowLeft className="h-4 w-4" /> Clientes
            </Link>
            <Link
              href={`/agendar/${establishment.slug}`}
              target="_blank"
              className={buttonSecondary}
            >
              Página pública <ExternalLink className="h-4 w-4" />
            </Link>
            {!establishment.archivedAt && (
              <form action={startImpersonationAction}>
                <input type="hidden" name="establishmentId" value={establishment.id} />
                <ConfirmButton
                  confirmMessage={`Acessar o painel de ${establishment.name} como administrador? Suas ações ficam registradas em auditoria.`}
                  className={buttonPrimary}
                >
                  <LogIn className="h-4 w-4" /> Acessar painel
                </ConfirmButton>
              </form>
            )}
          </>
        }
      />

      <div className="-mt-2 mb-5 flex flex-wrap items-center gap-2">
        {establishment.status === "SUSPENDED" ? (
          <Badge tone="danger">Estabelecimento suspenso</Badge>
        ) : (
          <Badge tone="success">Estabelecimento ativo</Badge>
        )}
        {establishment.publicPageEnabled ? (
          <Badge tone="info">Página pública ligada</Badge>
        ) : (
          <Badge tone="warn">Página pública desligada</Badge>
        )}
        {subscription ? (
          <SubscriptionBadge status={subscription.status} />
        ) : (
          <Badge tone="neutral">Sem plano</Badge>
        )}
        {establishment.archivedAt && <Badge tone="danger">Arquivado</Badge>}
        <span className="font-mono text-[11px] text-slate-500">/agendar/{establishment.slug}</span>
      </div>

      {(query.ok || query.erro) && (
        <div className="mb-5">
          <Alert tone={query.erro ? "error" : "success"}>{query.erro ?? query.ok}</Alert>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Plano atual"
          value={plan?.name ?? "Sem plano"}
          hint={
            subscription
              ? `${subscription.billingCycle === "YEARLY" ? "Anual" : "Mensal"} · ${providerLabel(
                  subscription.provider,
                )}`
              : "Vincule um plano na assinatura abaixo"
          }
          accent
        />
        <StatCard
          label="Situação da assinatura"
          value={subscription ? <SubscriptionBadge status={subscription.status} /> : "—"}
          hint={
            subscription?.status === "TRIALING" && trialEnds
              ? `Teste até ${trialEnds}`
              : periodEnds
                ? `Período até ${periodEnds}`
                : "Sem data de renovação"
          }
        />
        <StatCard
          label="Investimento mensal"
          value={subscription ? formatCurrency(monthlyValue) : "—"}
          hint={
            subscription?.billingCycle === "YEARLY"
              ? `Anual: ${formatCurrency(subscription.plan.priceYearly)}`
              : "Valor mensal do plano"
          }
        />
        <StatCard
          label="Agendamentos no mês"
          value={establishment._count.appointments}
          hint={`${establishment._count.customers} cliente(s) final(is) na base`}
        />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
        <div className="space-y-4">
          <section className="rounded-xl border border-line bg-white shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
              <div>
                <h2 className="text-sm font-semibold text-ink">Dados do cliente</h2>
                <p className="text-[11px] text-slate-500">
                  Cadastro, contato e configuração do estabelecimento.
                </p>
              </div>
              <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
            </div>
            <dl className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
              <Detail label="Responsável">{establishment.ownerName}</Detail>
              <Detail label="E-mail">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                  <span className="break-all">{establishment.email}</span>
                </span>
              </Detail>
              <Detail label="Telefone">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                  {formatPhone(establishment.phone)}
                </span>
              </Detail>
              <Detail label="WhatsApp">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                  {formatPhone(establishment.whatsapp)}
                </span>
              </Detail>
              <Detail label="Endereço">
                {establishment.address ? (
                  <span className="inline-flex items-start gap-1.5">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                    {establishment.address}
                  </span>
                ) : (
                  "Não informado"
                )}
              </Detail>
              <Detail label="Endereço público">
                <Link
                  href={`/agendar/${establishment.slug}`}
                  target="_blank"
                  className="font-mono text-brand hover:underline"
                >
                  /agendar/{establishment.slug}
                </Link>
              </Detail>
              <Detail label="Fuso horário">{establishment.timezone}</Detail>
              <Detail label="Cadastro">
                {formatDateTimeInZone(
                  establishment.createdAt,
                  PLATFORM_TIMEZONE,
                  "dd/MM/yyyy 'às' HH:mm",
                )}
              </Detail>
              <Detail label="Último acesso do responsável">
                {owner?.user.lastLoginAt
                  ? formatDateTimeInZone(
                      owner.user.lastLoginAt,
                      PLATFORM_TIMEZONE,
                      "dd/MM/yyyy 'às' HH:mm",
                    )
                  : "Ainda não acessou o painel"}
              </Detail>
              <Detail label="Onboarding">
                {establishment.onboardingCompletedAt
                  ? `Concluído em ${formatDateInZone(
                      establishment.onboardingCompletedAt,
                      PLATFORM_TIMEZONE,
                    )}`
                  : "Não concluído"}
              </Detail>
            </dl>
            <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3 text-[11px] sm:px-5">
              <Link
                href={`/agendar/${establishment.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-brand"
              >
                Abrir página pública <ExternalLink className="h-3 w-3" />
              </Link>
              <Link
                href={`/admin/auditoria?estabelecimento=${establishment.id}`}
                className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-brand"
              >
                Ver auditoria completa <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </section>

          <section className="rounded-xl border border-line bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
              <div>
                <h2 className="text-sm font-semibold text-ink">Assinatura e plano</h2>
                <p className="text-[11px] text-slate-500">
                  Controle manual do plano, ciclo, teste e período de cobrança.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {subscription ? (
                  <SubscriptionBadge status={subscription.status} />
                ) : (
                  <Badge tone="neutral">Sem plano</Badge>
                )}
                <CreditCard className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="p-4 sm:p-5">
              {subscription ? (
                <>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <Detail label="Plano">
                      <span className="font-semibold text-ink">{subscription.plan.name}</span>
                    </Detail>
                    <Detail label="Situação">{SUBSCRIPTION_LABELS[subscription.status]}</Detail>
                    <Detail label="Ciclo">
                      {subscription.billingCycle === "YEARLY" ? "Anual" : "Mensal"}
                    </Detail>
                    <Detail label="Forma de cobrança">
                      {providerLabel(subscription.provider)}
                    </Detail>
                    <Detail label="Início do período">
                      {subscription.currentPeriodStart
                        ? formatDateInZone(
                            subscription.currentPeriodStart,
                            PLATFORM_TIMEZONE,
                          )
                        : "—"}
                    </Detail>
                    <Detail label="Fim do período">
                      {periodEnds ?? "—"}
                    </Detail>
                    <Detail label="Fim do teste">{trialEnds ?? "—"}</Detail>
                    <Detail label="Renovação automática">
                      {subscription.cancelAtPeriodEnd ? "Cancelada no fim do período" : "Ativa"}
                    </Detail>
                    <Detail label="Observação interna">
                      {subscription.notes ?? "Nenhuma observação registrada."}
                    </Detail>
                    <Detail label="Atualizada em">
                      {formatDateTimeInZone(
                        subscription.updatedAt,
                        PLATFORM_TIMEZONE,
                        "dd/MM/yyyy 'às' HH:mm",
                      )}
                    </Detail>
                  </dl>
                  <div className="mt-4 grid gap-2 rounded-lg border border-line bg-paper px-3.5 py-3 text-[11px] sm:grid-cols-2">
                    <p className="text-slate-600">
                      Valor mensal:{" "}
                      <span className="font-semibold text-ink">
                        {formatCurrency(monthlyValue)}
                      </span>
                    </p>
                    <p className="text-slate-600">
                      Valor do ciclo:{" "}
                      <span className="font-semibold text-ink">
                        {formatCurrency(
                          subscription.billingCycle === "YEARLY"
                            ? subscription.plan.priceYearly
                            : subscription.plan.priceMonthly,
                        )}
                      </span>
                    </p>
                  </div>
                </>
              ) : (
                <Alert tone="warning">
                  Este cliente ainda não tem assinatura. Escolha um plano abaixo para liberar o
                  painel e a página pública conforme a situação definida.
                </Alert>
              )}

              <details className="mt-4 rounded-lg border border-line" open={!subscription}>
                <summary className="cursor-pointer px-3.5 py-3 text-xs font-semibold text-slate-700 hover:text-brand">
                  {subscription ? "Editar assinatura e datas" : "Criar assinatura"}
                </summary>
                <div className="border-t border-line p-3.5">
                  <AdminSubscriptionForm
                    establishmentId={establishment.id}
                    plans={plans}
                    subscription={
                      subscription
                        ? {
                            planId: subscription.planId,
                            status: subscription.status,
                            billingCycle: subscription.billingCycle,
                            trialEndsAt: subscription.trialEndsAt
                              ? subscription.trialEndsAt.toISOString().slice(0, 10)
                              : null,
                            currentPeriodEnd: subscription.currentPeriodEnd
                              ? subscription.currentPeriodEnd.toISOString().slice(0, 10)
                              : null,
                            notes: subscription.notes,
                          }
                        : null
                    }
                  />
                </div>
              </details>
            </div>
          </section>

          <section className="rounded-xl border border-line bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
              <div>
                <h2 className="text-sm font-semibold text-ink">Histórico de pagamentos</h2>
                <p className="text-[11px] text-slate-500">
                  Total confirmado: {formatCurrency(paidAggregate._sum.amount ?? 0)}.
                </p>
              </div>
              <Link
                href="/admin/pagamentos"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-brand"
              >
                Ver todos <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {establishment.payments.length === 0 ? (
              <div className="p-4 sm:p-5">
                <EmptyState
                  title="Nenhum pagamento registrado"
                  description="Registre um pagamento manual ao lado para liberar ou estender a assinatura."
                  icon={<ReceiptText className="h-5 w-5" />}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-xs">
                  <thead className="border-b border-line bg-paper text-[10px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold sm:px-5">Data</th>
                      <th className="px-4 py-2.5 font-semibold">Valor</th>
                      <th className="px-4 py-2.5 font-semibold">Situação</th>
                      <th className="px-4 py-2.5 font-semibold">Período</th>
                      <th className="px-4 py-2.5 font-semibold">Origem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {establishment.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 sm:px-5">
                          {payment.paidAt
                            ? formatDateTimeInZone(
                                payment.paidAt,
                                PLATFORM_TIMEZONE,
                                "dd/MM/yyyy",
                              )
                            : "—"}
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
                          {payment.periodStart && payment.periodEnd
                            ? `${formatDateInZone(
                                payment.periodStart,
                                PLATFORM_TIMEZONE,
                              )} – ${formatDateInZone(
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
                              <CircleDollarSign className="h-3.5 w-3.5 text-slate-400" />
                            )}
                            {payment.provider}
                          </span>
                          {payment.method && (
                            <p className="text-[10px] text-slate-500">{payment.method}</p>
                          )}
                          {payment.notes && (
                            <p className="max-w-[180px] truncate text-[10px] text-slate-500">
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
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-line bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
              <div>
                <h2 className="text-sm font-semibold text-ink">Uso do plano</h2>
                <p className="text-[11px] text-slate-500">
                  Consumo atual em relação aos limites contratados.
                </p>
              </div>
              <CalendarClock className="h-4 w-4 text-slate-400" />
            </div>
            <div className="space-y-3 p-4 sm:p-5">
              {plan ? (
                <>
                  <Usage
                    label="Profissionais ativos"
                    used={establishment._count.professionals}
                    max={plan.maxProfessionals}
                  />
                  <Usage
                    label="Serviços cadastrados"
                    used={establishment._count.services}
                    max={plan.maxServices}
                  />
                  <Usage
                    label="Unidades ativas"
                    used={establishment._count.units}
                    max={plan.maxUnits}
                  />
                  <Usage
                    label="Acessos ao painel"
                    used={establishment._count.memberships}
                    max={plan.maxUsers}
                  />
                  <Usage
                    label="Agendamentos no mês"
                    used={establishment._count.appointments}
                    max={plan.maxAppointmentsMonth}
                  />
                  <p className="border-t border-line pt-3 text-[10px] leading-relaxed text-slate-500">
                    {establishment._count.customers} cliente(s) final(is) e{" "}
                    {establishment._count.memberships} acesso(s) de equipe no total. Os limites
                    são aplicados pelo servidor.
                  </p>
                </>
              ) : (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800">
                  Sem plano vinculado, os limites de uso ainda não estão definidos. Crie a
                  assinatura para acompanhar o consumo.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-line bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
              <div>
                <h2 className="text-sm font-semibold text-ink">Equipe e acessos</h2>
                <p className="text-[11px] text-slate-500">
                  {establishment.memberships.length} vínculo(s) de usuário com o painel.
                </p>
              </div>
              <Users className="h-4 w-4 text-slate-400" />
            </div>
            {establishment.memberships.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-slate-500">
                Nenhum usuário vinculado ao estabelecimento.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {establishment.memberships.map((member) => (
                  <li
                    key={member.id}
                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <UserRound className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <p className="truncate text-xs font-semibold text-ink">
                          {member.user.name}
                        </p>
                      </div>
                      <p className="break-all text-[10px] text-slate-500">
                        {member.user.email}
                      </p>
                      {member.professional && (
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          Profissional: {member.professional.name}
                          {!member.professional.active ? " (inativo)" : ""}
                        </p>
                      )}
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {member.user.lastLoginAt
                          ? `Último acesso em ${formatDateTimeInZone(
                              member.user.lastLoginAt,
                              PLATFORM_TIMEZONE,
                              "dd/MM/yyyy 'às' HH:mm",
                            )}`
                          : "Ainda não acessou o painel"}
                      </p>
                      {!member.user.emailVerifiedAt && (
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <p className="text-[10px] font-medium text-amber-700">
                            E-mail não verificado
                          </p>
                          <form action={verifyUserEmailAction}>
                            <input type="hidden" name="userId" value={member.user.id} />
                            <input
                              type="hidden"
                              name="establishmentId"
                              value={establishment.id}
                            />
                            <ConfirmButton
                              confirmMessage={`Marcar o e-mail de ${member.user.name} como verificado manualmente? Use apenas quando a confirmação por e-mail não chegar.`}
                              className="rounded-md border border-amber-300 bg-white px-2 py-1 text-[10px] font-semibold text-amber-800 hover:bg-amber-100"
                            >
                              Marcar verificado
                            </ConfirmButton>
                          </form>
                        </div>
                      )}
                    </div>
                    <Badge tone={roleTone(member.role)}>{ROLE_LABELS[member.role]}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-line bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-line px-4 py-4 sm:px-5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                <CircleDollarSign className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-ink">Registrar pagamento</h2>
                <p className="text-[11px] text-slate-500">
                  Confirmação manual de valores recebidos fora da plataforma.
                </p>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              {subscription ? (
                <ManualPaymentForm establishments={[paymentTarget]} />
              ) : (
                <Alert tone="warning">
                  Crie a assinatura deste cliente acima antes de registrar um pagamento.
                </Alert>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-line bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
              <div>
                <h2 className="text-sm font-semibold text-ink">Auditoria do cliente</h2>
                <p className="text-[11px] text-slate-500">Últimas ações registradas.</p>
              </div>
              <ScrollText className="h-4 w-4 text-slate-400" />
            </div>
            {establishment.auditLogs.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-slate-500">
                Nenhum evento de auditoria registrado.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {establishment.auditLogs.map((log) => (
                  <li key={log.id} className="px-4 py-2.5 sm:px-5">
                    <p className="text-[11px] font-semibold text-slate-700">
                      {actionLabel(log.action)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      {log.actor?.name ?? "Sistema"}
                      {log.entityType ? ` · ${log.entityType}` : ""} ·{" "}
                      {formatDateTimeInZone(
                        log.createdAt,
                        PLATFORM_TIMEZONE,
                        "dd/MM/yyyy HH:mm",
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-line px-4 py-3 sm:px-5">
              <Link
                href={`/admin/auditoria?estabelecimento=${establishment.id}`}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-brand"
              >
                Ver auditoria completa <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </section>

          <section className="rounded-xl border border-line bg-white shadow-sm">
            <div className="border-b border-line px-4 py-3.5 sm:px-5">
              <h2 className="text-sm font-semibold text-ink">Ações administrativas</h2>
              <p className="text-[11px] text-slate-500">
                Suspender bloqueia a página pública e novos agendamentos.
              </p>
            </div>
            <div className="space-y-3 p-4 sm:p-5">
              {establishment.archivedAt ? (
                <>
                  <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] leading-relaxed text-red-800">
                    <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Este cliente está arquivado. A página pública e o painel dos donos estão
                    bloqueados. Restaure ou exclua definitivamente em Estabelecimentos &gt;
                    Arquivados.
                  </p>
                  <Link
                    href="/admin/estabelecimentos?status=archived"
                    className={buttonSecondary}
                  >
                    Ver arquivados
                  </Link>
                </>
              ) : (
                <>
                  {establishment.status === "SUSPENDED" && (
                    <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] leading-relaxed text-red-800">
                      <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Este estabelecimento está suspenso. A página pública e novos agendamentos
                      permanecem bloqueados até a reativação.
                    </p>
                  )}
                  <form action={toggleEstablishmentStatusAction}>
                    <input type="hidden" name="id" value={establishment.id} />
                    <input
                      type="hidden"
                      name="redirectTo"
                      value={`/admin/clientes/${establishment.id}`}
                    />
                    <ConfirmButton
                      confirmMessage={
                        establishment.status === "ACTIVE"
                          ? "Suspender este cliente? A página pública e novos agendamentos serão bloqueados."
                          : "Reativar este cliente? A página pública volta a aceitar agendamentos se a assinatura estiver em dia."
                      }
                      className={
                        establishment.status === "ACTIVE"
                          ? "inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                          : "inline-flex items-center justify-center gap-2 rounded-lg border border-green-200 bg-white px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-50"
                      }
                    >
                      {establishment.status === "ACTIVE"
                        ? "Suspender cliente"
                        : "Reativar cliente"}
                    </ConfirmButton>
                  </form>
                  <form action={archiveEstablishmentAction}>
                    <input type="hidden" name="id" value={establishment.id} />
                    <input
                      type="hidden"
                      name="redirectTo"
                      value={`/admin/clientes/${establishment.id}`}
                    />
                    <ConfirmButton
                      confirmMessage={`Apagar ${establishment.name}? O cliente sai das listas, do ar e do painel dos donos. Você poderá restaurar depois em Estabelecimentos > Arquivados.`}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-paper"
                    >
                      <Trash2 className="h-4 w-4" /> Apagar cliente
                    </ConfirmButton>
                  </form>
                </>
              )}
              <p className="flex items-start gap-1.5 border-t border-line pt-3 text-[10px] leading-relaxed text-slate-500">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Toda ação administrativa é registrada em auditoria. A assinatura não é alterada
                automaticamente ao suspender o estabelecimento.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
