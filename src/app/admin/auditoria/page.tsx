import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { Filter, ScrollText, Search, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { formatDateTimeInZone } from "@/lib/format";
import {
  Badge,
  buttonSecondary,
  EmptyState,
  PageHeader,
  StatCard,
} from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Auditoria" };

const PLATFORM_TIMEZONE = "America/Sao_Paulo";
const PAGE_SIZE = 30;

function pageHref(params: {
  action: string;
  establishment: string;
  page: number;
}): string {
  const search = new URLSearchParams();
  if (params.action) search.set("acao", params.action);
  if (params.establishment) search.set("estabelecimento", params.establishment);
  if (params.page > 1) search.set("page", String(params.page));
  const query = search.toString();
  return `/admin/auditoria${query ? `?${query}` : ""}`;
}

function metadataPreview(metadata: Prisma.JsonValue): string {
  if (!metadata) return "—";
  try {
    const text = JSON.stringify(metadata);
    return text.length > 160 ? `${text.slice(0, 157)}...` : text;
  } catch {
    return "—";
  }
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    acao?: string;
    estabelecimento?: string;
    page?: string;
  }>;
}) {
  await requirePlatformAdmin();
  const params = await searchParams;
  const action = params.acao?.trim() ?? "";
  const establishmentId = params.estabelecimento?.trim() ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  const where: Prisma.AuditLogWhereInput = {
    ...(action ? { action: { contains: action, mode: "insensitive" as const } } : {}),
    ...(establishmentId ? { establishmentId } : {}),
  };

  const [logs, total, actions, establishments, todayCount, failedNotifications] =
    await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: { select: { name: true, email: true } },
          establishment: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        select: { action: true },
        distinct: ["action"],
        orderBy: { action: "asc" },
        take: 200,
      }),
      prisma.establishment.findMany({
        where: { archivedAt: null },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.auditLog.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.notification.count({ where: { status: "FAILED" } }),
    ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeFilters = Boolean(action || establishmentId);

  return (
    <div>
      <PageHeader
        eyebrow="Plataforma"
        title="Auditoria"
        description="Rastreie ações administrativas, alterações de assinatura, pagamentos e eventos operacionais dos estabelecimentos."
        actions={
          <Link href="/admin/auditoria" className={buttonSecondary}>
            Limpar filtros
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Registros no filtro"
          value={total}
          hint={activeFilters ? "Com os filtros aplicados" : "Base completa de auditoria"}
          accent
        />
        <StatCard
          label="Eventos hoje"
          value={todayCount}
          hint="Desde 00:00 no fuso da plataforma"
        />
        <StatCard
          label="Tipos de ação"
          value={actions.length}
          hint="Ações distintas registradas"
        />
        <StatCard
          label="Notificações com falha"
          value={failedNotifications}
          hint="E-mails que precisam de atenção"
        />
      </div>

      <section className="mt-6 rounded-xl border border-line bg-white shadow-sm">
        <form
          method="get"
          action="/admin/auditoria"
          className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:px-5 lg:flex-row lg:items-end"
        >
          <div className="flex-1">
            <label
              htmlFor="audit-action"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-600"
            >
              Ação
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="audit-action"
                name="acao"
                defaultValue={action}
                list="audit-actions"
                placeholder="Ex.: platform.payment, appointment.status"
                className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-slate-500 focus:border-brand focus:ring-2 focus:ring-brand/15"
              />
              <datalist id="audit-actions">
                {actions.map((item) => (
                  <option key={item.action} value={item.action} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="flex-1">
            <label
              htmlFor="audit-establishment"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-600"
            >
              Estabelecimento
            </label>
            <select
              id="audit-establishment"
              name="estabelecimento"
              defaultValue={establishmentId}
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
            >
              <option value="">Todos os estabelecimentos</option>
              {establishments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={buttonSecondary}>
            <Filter className="h-4 w-4" /> Filtrar
          </button>
        </form>

        {logs.length === 0 ? (
          <div className="p-4 sm:p-5">
            <EmptyState
              title="Nenhum registro encontrado"
              description="Ajuste os filtros ou execute uma ação no painel para gerar auditoria."
              icon={<ScrollText className="h-5 w-5" />}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-xs">
              <thead className="border-b border-line bg-paper text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-semibold sm:px-5">Quando</th>
                  <th className="px-4 py-2.5 font-semibold">Ação</th>
                  <th className="px-4 py-2.5 font-semibold">Responsável</th>
                  <th className="px-4 py-2.5 font-semibold">Estabelecimento</th>
                  <th className="px-4 py-2.5 font-semibold">Entidade</th>
                  <th className="px-4 py-2.5 font-semibold">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {logs.map((log) => (
                  <tr key={log.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600 sm:px-5">
                      {formatDateTimeInZone(
                        log.createdAt,
                        PLATFORM_TIMEZONE,
                        "dd/MM/yyyy HH:mm",
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={log.action.startsWith("platform.") ? "brand" : "neutral"}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {log.actor ? (
                        <>
                          <p className="font-medium text-ink">{log.actor.name}</p>
                          <p className="text-[10px] text-slate-500">{log.actor.email}</p>
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <ShieldCheck className="h-3.5 w-3.5" /> Sistema / público
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {log.establishment ? (
                        <>
                          <p className="font-medium text-ink">{log.establishment.name}</p>
                          <p className="font-mono text-[10px] text-slate-500">
                            /agendar/{log.establishment.slug}
                          </p>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>{log.entityType}</p>
                      {log.entityId && (
                        <p className="max-w-[140px] truncate font-mono text-[10px] text-slate-500">
                          {log.entityId}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-[260px] break-all font-mono text-[10px] leading-relaxed text-slate-500">
                        {metadataPreview(log.metadata)}
                      </p>
                      {(log.ip || log.userAgent) && (
                        <p className="mt-1 max-w-[220px] truncate text-[10px] text-slate-400">
                          {[log.ip, log.userAgent].filter(Boolean).join(" · ")}
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
              Página {page} de {pageCount} · {total} registro(s)
            </p>
            <div className="flex gap-2">
              {page > 1 ? (
                <Link
                  href={pageHref({ action, establishment: establishmentId, page: page - 1 })}
                  className={buttonSecondary}
                >
                  Anterior
                </Link>
              ) : (
                <span className="inline-flex items-center rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-slate-300">
                  Anterior
                </span>
              )}
              {page < pageCount ? (
                <Link
                  href={pageHref({ action, establishment: establishmentId, page: page + 1 })}
                  className={buttonSecondary}
                >
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
        <ShieldCheck className="h-3.5 w-3.5" /> A auditoria não armazena senhas nem tokens.
        Metadados sensíveis são registrados apenas como identificadores internos.
      </p>
    </div>
  );
}
