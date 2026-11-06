import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import {
  ArchiveRestore,
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { formatDateInZone, formatPhone } from "@/lib/format";
import {
  archiveEstablishmentAction,
  deleteEstablishmentAction,
  restoreEstablishmentAction,
  toggleEstablishmentStatusAction,
} from "@/lib/actions/admin";
import { SUBSCRIPTION_LABELS } from "@/lib/constants";
import {
  Badge,
  buttonSecondary,
  EmptyState,
  PageHeader,
  SubscriptionBadge,
} from "@/components/ui";
import { ConfirmButton } from "@/components/ConfirmButton";
import { AdminSubscriptionForm } from "@/components/platform/AdminSubscriptionForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Estabelecimentos" };

const PAGE_SIZE = 12;
const PLATFORM_TIMEZONE = "America/Sao_Paulo";

function pageHref(params: { q: string; status: string; page: number }): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  if (params.page > 1) search.set("page", String(params.page));
  const query = search.toString();
  return `/admin/estabelecimentos${query ? `?${query}` : ""}`;
}

export default async function AdminEstablishmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; ok?: string; erro?: string }>;
}) {
  await requirePlatformAdmin();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status =
    params.status === "active" ||
    params.status === "suspended" ||
    params.status === "archived"
      ? params.status
      : "all";
  const page = Math.max(1, Number(params.page) || 1);

  const where: Prisma.EstablishmentWhereInput = {
    ...(status === "archived"
      ? { archivedAt: { not: null } }
      : { archivedAt: null }),
    ...(status === "active" ? { status: "ACTIVE" as const } : {}),
    ...(status === "suspended" ? { status: "SUSPENDED" as const } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { ownerName: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total, plans] = await Promise.all([
    prisma.establishment.findMany({
      where,
      include: {
        subscription: { include: { plan: true } },
        _count: {
          select: {
            professionals: { where: { active: true } },
            services: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.establishment.count({ where }),
    prisma.subscriptionPlan.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, active: true },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        eyebrow="Plataforma"
        title="Estabelecimentos"
        description={`${total} registro(s) encontrado(s). Suspender bloqueia a página pública e novos agendamentos. Apagar arquiva o cliente: ele sai das listas e do painel, e pode ser restaurado ou excluído em Arquivados.`}
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

      <form
        method="get"
        action="/admin/estabelecimentos"
        className="mb-5 flex flex-col gap-3 rounded-xl border border-line bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="admin-search"
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500"
            >
              Buscar
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="admin-search"
                name="q"
                defaultValue={q}
                placeholder="Nome, endereço público, responsável ou e-mail"
                className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-slate-500 focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>
          <div className="sm:w-44">
            <label
              htmlFor="admin-status"
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500"
            >
              Situação
            </label>
            <select
              id="admin-status"
              name="status"
              defaultValue={status}
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              <option value="all">Todas</option>
              <option value="active">Ativos</option>
              <option value="suspended">Suspensos</option>
              <option value="archived">Arquivados</option>
            </select>
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
          >
            Filtrar
          </button>
        </div>
        {(q || status !== "all") && (
          <Link href="/admin/estabelecimentos" className={buttonSecondary}>
            Limpar
          </Link>
        )}
      </form>

      {items.length === 0 ? (
        <EmptyState
          title="Nenhum estabelecimento encontrado"
          description="Ajuste a busca ou o filtro de situação."
          action={
            <Link href="/admin/estabelecimentos" className={buttonSecondary}>
              Ver todos
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-line bg-white shadow-sm"
            >
              <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-semibold text-ink">{item.name}</h2>
                    {item.archivedAt ? (
                      <Badge tone="danger">Arquivado</Badge>
                    ) : item.status === "SUSPENDED" ? (
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
                    {item.segment} · desde{" "}
                    {formatDateInZone(item.createdAt, PLATFORM_TIMEZONE)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {item.subscription ? (
                    <SubscriptionBadge status={item.subscription.status} />
                  ) : (
                    <Badge tone="neutral">Sem plano</Badge>
                  )}
                  <Link
                    href={`/admin/clientes/${item.id}`}
                    className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-paper"
                  >
                    Ficha
                  </Link>
                  {!item.archivedAt && (
                    <Link
                      href={`/agendar/${item.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-paper"
                    >
                      Página <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>

              <div className="grid gap-4 px-4 py-4 text-xs sm:grid-cols-2 sm:px-5">
                <div className="space-y-2">
                  <p className="font-semibold text-slate-700">Responsável</p>
                  <p className="text-slate-600">{item.ownerName}</p>
                  <p className="break-all text-slate-500">{item.email}</p>
                  <p className="text-slate-500">{formatPhone(item.phone)}</p>
                  {item.address && (
                    <p className="flex items-start gap-1.5 text-slate-500">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {item.address}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-slate-700">Operação</p>
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <Users className="h-3.5 w-3.5" /> {item._count.professionals} profissional(is)
                    ativo(s)
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <Building2 className="h-3.5 w-3.5" /> {item._count.services} serviço(s)
                    cadastrado(s)
                  </p>
                  {item.subscription ? (
                    <div className="rounded-lg bg-paper px-3 py-2">
                      <p className="font-medium text-slate-700">
                        {item.subscription.plan.name} ·{" "}
                        {item.subscription.billingCycle === "YEARLY" ? "anual" : "mensal"}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {SUBSCRIPTION_LABELS[item.subscription.status]}
                        {item.subscription.status === "TRIALING" &&
                        item.subscription.trialEndsAt
                          ? ` · teste até ${formatDateInZone(
                              item.subscription.trialEndsAt,
                              PLATFORM_TIMEZONE,
                            )}`
                          : ""}
                        {item.subscription.currentPeriodEnd
                          ? ` · período até ${formatDateInZone(
                              item.subscription.currentPeriodEnd,
                              PLATFORM_TIMEZONE,
                            )}`
                          : ""}
                      </p>
                    </div>
                  ) : item.archivedAt ? (
                    <p className="rounded-lg bg-paper px-3 py-2 text-[10px] text-slate-500">
                      Estabelecimento arquivado. Restaure para voltar a gerenciar a assinatura.
                    </p>
                  ) : (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] text-amber-800">
                      Nenhuma assinatura vinculada. Use o formulário abaixo para escolher um
                      plano e liberar o acesso.
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-line px-4 py-3 sm:px-5">
                {item.archivedAt ? (
                  <>
                    <form action={restoreEstablishmentAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <ConfirmButton
                        confirmMessage={`Restaurar ${item.name}? A página pública e o painel dos donos voltam a funcionar.`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-green-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-green-700 hover:bg-green-50"
                      >
                        <ArchiveRestore className="h-3.5 w-3.5" /> Restaurar
                      </ConfirmButton>
                    </form>

                    <details className="mt-3 border-t border-line pt-3">
                      <summary className="cursor-pointer text-[11px] font-semibold text-red-700 hover:text-red-800">
                        Excluir definitivamente
                      </summary>
                      <form
                        action={deleteEstablishmentAction}
                        className="mt-3 space-y-2 rounded-lg border border-red-200 bg-red-50 p-3"
                      >
                        <input type="hidden" name="id" value={item.id} />
                        <p className="text-[10px] leading-relaxed text-red-800">
                          Remove agendamentos, clientes, serviços, equipe, assinatura e
                          pagamentos. Não é possível desfazer. Digite{" "}
                          <strong>{item.name}</strong> para confirmar.
                        </p>
                        <input
                          name="confirmName"
                          autoComplete="off"
                          placeholder="Nome do estabelecimento"
                          className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-xs text-ink outline-none placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-200"
                        />
                        <ConfirmButton
                          confirmMessage={`Excluir definitivamente ${item.name}? Todos os dados operacionais serão removidos e não poderão ser recuperados.`}
                          className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Excluir definitivamente
                        </ConfirmButton>
                      </form>
                    </details>
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={toggleEstablishmentStatusAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <ConfirmButton
                          confirmMessage={
                            item.status === "ACTIVE"
                              ? "Suspender este estabelecimento? A página pública e novos agendamentos serão bloqueados."
                              : "Reativar este estabelecimento? A página pública volta a aceitar agendamentos se a assinatura estiver em dia."
                          }
                          className={
                            item.status === "ACTIVE"
                              ? "inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-50"
                              : "inline-flex items-center gap-1.5 rounded-md border border-green-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-green-700 hover:bg-green-50"
                          }
                        >
                          {item.status === "ACTIVE" ? "Suspender" : "Reativar"}
                        </ConfirmButton>
                      </form>
                      <form action={archiveEstablishmentAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input
                          type="hidden"
                          name="redirectTo"
                          value="/admin/estabelecimentos"
                        />
                        <ConfirmButton
                          confirmMessage={`Apagar ${item.name}? O estabelecimento sai das listas, do ar e do painel dos donos. Você poderá restaurar depois em Arquivados.`}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-paper"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Apagar
                        </ConfirmButton>
                      </form>
                    </div>

                    <details className="w-full border-t border-line pt-3">
                      <summary className="cursor-pointer text-[11px] font-semibold text-slate-600 hover:text-brand">
                        {item.subscription
                          ? "Gerenciar assinatura e datas"
                          : "Vincular plano e criar assinatura"}
                      </summary>
                      <div className="mt-3">
                        <AdminSubscriptionForm
                          establishmentId={item.id}
                          plans={plans}
                          subscription={
                            item.subscription
                              ? {
                                  planId: item.subscription.planId,
                                  status: item.subscription.status,
                                  billingCycle: item.subscription.billingCycle,
                                  trialEndsAt: item.subscription.trialEndsAt
                                    ? item.subscription.trialEndsAt.toISOString().slice(0, 10)
                                    : null,
                                  currentPeriodEnd: item.subscription.currentPeriodEnd
                                    ? item.subscription.currentPeriodEnd.toISOString().slice(0, 10)
                                    : null,
                                  notes: item.subscription.notes,
                                }
                              : null
                          }
                        />
                      </div>
                    </details>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 text-xs">
          <p className="text-slate-500">
            Página {page} de {pageCount}
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
    </div>
  );
}
