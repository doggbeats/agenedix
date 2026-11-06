import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Search,
  Sparkles,
  TriangleAlert,
  UserPlus,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/auth/session";
import {
  formatDateInZone,
  formatDateTimeInZone,
  formatPhone,
  toNumber,
} from "@/lib/format";
import { dateRangeInZone, todayInZone } from "@/lib/timezone";
import { SUBSCRIPTION_LABELS } from "@/lib/constants";
import {
  Badge,
  buttonSecondary,
  EmptyState,
  PageHeader,
  StatCard,
  SubscriptionBadge,
} from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Clientes" };

const PAGE_SIZE = 12;
const PLATFORM_TIMEZONE = "America/Sao_Paulo";

type ClientFilter =
  | "all"
  | "active"
  | "suspended"
  | "trial"
  | "active_plan"
  | "past_due"
  | "no_plan";

const FILTERS: Array<{ value: ClientFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Estabelecimento ativo" },
  { value: "suspended", label: "Suspensos" },
  { value: "trial", label: "Em teste" },
  { value: "active_plan", label: "Assinatura ativa" },
  { value: "past_due", label: "Pagamento atrasado" },
  { value: "no_plan", label: "Sem plano" },
];

function normalizeFilter(value: string | undefined): ClientFilter {
  const match = FILTERS.find((item) => item.value === value);
  return match?.value ?? "all";
}

function pageHref(params: { q: string; status: ClientFilter; page: number }): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.status !== "all") search.set("status", params.status);
  if (params.page > 1) search.set("page", String(params.page));
  const query = search.toString();
  return `/admin/clientes${query ? `?${query}` : ""}`;
}

function amountForSubscription(subscription: {
  billingCycle: "MONTHLY" | "YEARLY";
  plan: { priceMonthly: unknown; priceYearly: unknown };
} | null): number {
  if (!subscription) return 0;
  return subscription.billingCycle === "YEARLY"
    ? toNumber(subscription.plan.priceYearly) / 12
    : toNumber(subscription.plan.priceMonthly);
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
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${atLimit ? "bg-amber-500" : "bg-brand"}`}
          style={{ width: `${Math.max(4, ratio)}%` }}
        />
      </div>
    </div>
  );
}

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await requirePlatformAdmin();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = normalizeFilter(params.status);
  const page = Math.max(1, Number(params.page) || 1);
  const today = todayInZone(PLATFORM_TIMEZONE);
  const monthStart = dateRangeInZone(`${today.slice(0, 7)}-01`, today, PLATFORM_TIMEZONE).start;
  const monthEnd = dateRangeInZone(today, today, PLATFORM_TIMEZONE).end;

  const phoneQuery = q.replace(/\D/g, "");
  const searchFilters: Prisma.EstablishmentWhereInput[] = [
    { name: { contains: q, mode: "insensitive" } },
    { slug: { contains: q, mode: "insensitive" } },
    { email: { contains: q, mode: "insensitive" } },
    { ownerName: { contains: q, mode: "insensitive" } },
    {
      memberships: {
        some: {
          user: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
        },
      },
    },
  ];
  if (phoneQuery.length >= 3) {
    searchFilters.push(
      { phone: { contains: phoneQuery } },
      { whatsapp: { contains: phoneQuery } },
    );
  }

  const where: Prisma.EstablishmentWhereInput = {
    archivedAt: null,
    ...(q ? { OR: searchFilters } : {}),
    ...(status === "active" ? { status: "ACTIVE" as const } : {}),
    ...(status === "suspended" ? { status: "SUSPENDED" as const } : {}),
    ...(status === "trial" ? { subscription: { is: { status: "TRIALING" as const } } } : {}),
    ...(status === "active_plan"
      ? { subscription: { is: { status: "ACTIVE" as const } } }
      : {}),
    ...(status === "past_due"
      ? { subscription: { is: { status: "PAST_DUE" as const } } }
      : {}),
    ...(status === "no_plan" ? { subscription: { is: null } } : {}),
  };

  const [
    items,
    total,
    totalClients,
    activeClients,
    suspendedClients,
    newThisMonth,
    trialClients,
    pastDueClients,
    noPlanClients,
    activeSubscriptions,
  ] = await Promise.all([
    prisma.establishment.findMany({
      where,
      include: {
        subscription: { include: { plan: true } },
        memberships: {
          where: { role: "OWNER" },
          include: {
            user: {
              select: {
                name: true,
                email: true,
                lastLoginAt: true,
                emailVerifiedAt: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
        _count: {
          select: {
            professionals: { where: { active: true } },
            services: { where: { deletedAt: null } },
            customers: true,
            memberships: true,
            appointments: {
              where: {
                startAt: { gte: monthStart, lt: monthEnd },
                status: { not: "CANCELLED" },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.establishment.count({ where }),
    prisma.establishment.count({ where: { archivedAt: null } }),
    prisma.establishment.count({ where: { archivedAt: null, status: "ACTIVE" } }),
    prisma.establishment.count({ where: { archivedAt: null, status: "SUSPENDED" } }),
    prisma.establishment.count({ where: { archivedAt: null, createdAt: { gte: monthStart } } }),
    prisma.establishment.count({
      where: { archivedAt: null, subscription: { is: { status: "TRIALING" } } },
    }),
    prisma.establishment.count({
      where: { archivedAt: null, subscription: { is: { status: "PAST_DUE" } } },
    }),
    prisma.establishment.count({
      where: { archivedAt: null, subscription: { is: null } },
    }),
    prisma.subscription.findMany({
      where: { status: "ACTIVE", establishment: { archivedAt: null } },
      include: { plan: true },
    }),
  ]);

  const mrr = activeSubscriptions.reduce(
    (sum, subscription) => sum + amountForSubscription(subscription),
    0,
  );
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = Boolean(q) || status !== "all";

  return (
    <div>
      <PageHeader
        eyebrow="Plataforma"
        title="Clientes"
        description={`${totalClients} cliente(s) cadastrado(s). Acompanhe o responsável, o plano contratado e o uso de cada conta.`}
        actions={
          <>
            <Link href="/admin/planos" className={buttonSecondary}>
              <CreditCard className="h-4 w-4" /> Gerenciar planos
            </Link>
            <Link href="/admin/pagamentos" className={buttonSecondary}>
              Pagamentos
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Clientes cadastrados"
          value={totalClients}
          hint={`${activeClients} ativo(s) · ${suspendedClients} suspenso(s)`}
          accent
        />
        <StatCard
          label="Novos no mês"
          value={newThisMonth}
          hint="Cadastros desde o primeiro dia do mês"
        />
        <StatCard
          label="Em teste"
          value={trialClients}
          hint={`${pastDueClients} com pagamento atrasado`}
        />
        <StatCard
          label="Receita recorrente"
          value={mrr.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          hint={`${activeSubscriptions.length} assinatura(s) ativa(s) · anual dividido por 12`}
        />
      </div>

      {noPlanClients > 0 && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {noPlanClients} cliente(s) sem plano vinculado
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
              Abra a ficha do cliente para criar a assinatura e liberar o painel e a página
              pública.
            </p>
            <Link
              href="/admin/clientes?status=no_plan"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-900 hover:underline"
            >
              Ver clientes sem plano <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      <form
        method="get"
        action="/admin/clientes"
        className="mt-5 flex flex-col gap-3 rounded-xl border border-line bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="clients-search"
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500"
            >
              Buscar cliente
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="clients-search"
                name="q"
                defaultValue={q}
                placeholder="Nome, responsável, e-mail, telefone ou endereço público"
                className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-slate-500 focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>
          <div className="sm:w-56">
            <label
              htmlFor="clients-status"
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500"
            >
              Situação
            </label>
            <select
              id="clients-status"
              name="status"
              defaultValue={status}
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              {FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
          >
            Filtrar
          </button>
        </div>
        {hasFilters && (
          <Link href="/admin/clientes" className={buttonSecondary}>
            Limpar
          </Link>
        )}
      </form>

      {items.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title="Nenhum cliente encontrado"
            description="Ajuste a busca ou o filtro de situação. Novos cadastros aparecem aqui automaticamente."
            icon={<Users className="h-5 w-5" />}
            action={
              hasFilters ? (
                <Link href="/admin/clientes" className={buttonSecondary}>
                  Ver todos os clientes
                </Link>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {items.map((item) => {
            const owner = item.memberships[0]?.user ?? null;
            const subscription = item.subscription;
            const plan = subscription?.plan ?? null;
            const monthlyValue = amountForSubscription(subscription);
            const trialEnds = subscription?.trialEndsAt
              ? formatDateInZone(subscription.trialEndsAt, PLATFORM_TIMEZONE)
              : null;
            const periodEnds = subscription?.currentPeriodEnd
              ? formatDateInZone(subscription.currentPeriodEnd, PLATFORM_TIMEZONE)
              : null;

            return (
              <article
                key={item.id}
                className="flex flex-col rounded-xl border border-line bg-white shadow-sm"
              >
                <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-base font-semibold text-ink">{item.name}</h2>
                      {item.status === "SUSPENDED" ? (
                        <Badge tone="danger">Suspenso</Badge>
                      ) : (
                        <Badge tone="success">Ativo</Badge>
                      )}
                      {!item.publicPageEnabled && <Badge tone="warn">Página desligada</Badge>}
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-slate-500">
                      /agendar/{item.slug}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.segment} · cadastrado em{" "}
                      {formatDateInZone(item.createdAt, PLATFORM_TIMEZONE)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
                    {subscription ? (
                      <SubscriptionBadge status={subscription.status} />
                    ) : (
                      <Badge tone="neutral">Sem plano</Badge>
                    )}
                    <p className="text-sm font-semibold text-ink">
                      {monthlyValue > 0
                        ? `${monthlyValue.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}/mês`
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="grid flex-1 gap-4 px-4 py-4 text-xs sm:grid-cols-2 sm:px-5">
                  <div className="space-y-1.5">
                    <p className="font-semibold text-slate-700">Responsável</p>
                    <p className="text-slate-700">{owner?.name ?? item.ownerName}</p>
                    <p className="break-all text-slate-500">{owner?.email ?? item.email}</p>
                    <p className="text-slate-500">{formatPhone(item.phone)}</p>
                    <p className="text-[10px] text-slate-500">
                      {owner?.lastLoginAt
                        ? `Último acesso em ${formatDateTimeInZone(
                            owner.lastLoginAt,
                            PLATFORM_TIMEZONE,
                            "dd/MM/yyyy 'às' HH:mm",
                          )}`
                        : "Ainda não acessou o painel"}
                    </p>
                    {owner && !owner.emailVerifiedAt && (
                      <p className="text-[10px] font-medium text-amber-700">
                        E-mail ainda não verificado
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="rounded-lg bg-paper px-3 py-2">
                      <p className="font-medium text-slate-700">
                        {plan ? plan.name : "Nenhum plano vinculado"}
                        {subscription ? ` · ${subscription.billingCycle === "YEARLY" ? "anual" : "mensal"}` : ""}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {subscription
                          ? SUBSCRIPTION_LABELS[subscription.status]
                          : "Crie a assinatura na ficha do cliente"}
                        {subscription?.status === "TRIALING" && trialEnds
                          ? ` · teste até ${trialEnds}`
                          : ""}
                        {periodEnds ? ` · período até ${periodEnds}` : ""}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Usage
                        label="Profissionais"
                        used={item._count.professionals}
                        max={plan?.maxProfessionals ?? null}
                      />
                      <Usage
                        label="Serviços"
                        used={item._count.services}
                        max={plan?.maxServices ?? null}
                      />
                      <Usage
                        label="Acessos ao painel"
                        used={item._count.memberships}
                        max={plan?.maxUsers ?? null}
                      />
                      <Usage
                        label="Agendamentos no mês"
                        used={item._count.appointments}
                        max={plan?.maxAppointmentsMonth ?? null}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 sm:px-5">
                  <p className="text-[10px] text-slate-500">
                    {item._count.customers} cliente(s) final(is) ·{" "}
                    {item._count.memberships} acesso(s) à equipe
                  </p>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/agendar/${item.slug}`}
                      target="_blank"
                      className="text-[11px] font-semibold text-slate-500 hover:text-brand"
                    >
                      Página pública
                    </Link>
                    <Link
                      href={`/admin/clientes/${item.id}`}
                      className="inline-flex items-center gap-1 rounded-md bg-ink px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-slate-800"
                    >
                      Abrir ficha <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {pageCount > 1 && (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 text-xs">
          <p className="text-slate-500">
            Página {page} de {pageCount} · {total} cliente(s) no filtro
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={pageHref({ q, status, page: page - 1 })}
                className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2.5 py-1.5 font-semibold text-slate-600 hover:bg-paper"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Anterior
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-slate-300">
                <ChevronLeft className="h-3.5 w-3.5" /> Anterior
              </span>
            )}
            {page < pageCount ? (
              <Link
                href={pageHref({ q, status, page: page + 1 })}
                className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2.5 py-1.5 font-semibold text-slate-600 hover:bg-paper"
              >
                Próxima <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-slate-300">
                Próxima <ChevronRight className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3 rounded-xl border border-line bg-white p-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <UserPlus className="h-3.5 w-3.5 text-brand" /> Novos cadastros entram
          automaticamente nesta lista.
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-brand" /> A ficha do cliente concentra plano,
          pagamentos, equipe e auditoria.
        </span>
      </div>
    </div>
  );
}
