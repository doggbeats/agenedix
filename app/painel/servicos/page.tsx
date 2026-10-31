import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarPlus,
  CheckCircle2,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Scissors,
  Trash2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/auth/session";
import { toNumber, formatCurrency, formatDuration } from "@/lib/format";
import {
  deleteServiceAction,
  toggleServiceActiveAction,
  toggleServiceOnlineAction,
} from "@/lib/actions/services";
import {
  Alert,
  Badge,
  buttonBrand,
  buttonSecondary,
  buttonSmall,
  cardClass,
  EmptyState,
  PageHeader,
} from "@/components/ui";
import { ServiceForm } from "@/components/panel/ServiceForm";
import { ConfirmButton } from "@/components/ConfirmButton";

export const dynamic = "force-dynamic";

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string; novo?: string; editar?: string }>;
}) {
  const auth = await requireManager();
  const params = await searchParams;
  const establishment = auth.establishment;

  const [services, professionals] = await Promise.all([
    prisma.service.findMany({
      where: { establishmentId: establishment.id, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        professionals: { select: { professionalId: true } },
        _count: { select: { appointments: true } },
      },
    }),
    prisma.professional.findMany({
      where: { establishmentId: establishment.id },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, active: true },
    }),
  ]);

  const editing = params.editar
    ? services.find((service) => service.id === params.editar)
    : null;
  if (params.editar && !editing) notFound();

  const showForm = params.novo === "1" || Boolean(editing);

  return (
    <div>
      <PageHeader
        eyebrow="Catálogo"
        title="Serviços"
        description="Preço, duração e vínculo com profissionais. A página pública mostra apenas serviços ativos e liberados online."
        actions={
          <>
            <Link href="/painel/agendamentos?novo=1" className={buttonSecondary}>
              <CalendarPlus className="h-4 w-4" /> Novo agendamento
            </Link>
            {!showForm && (
              <Link href="/painel/servicos?novo=1" className={buttonBrand}>
                <Plus className="h-4 w-4" /> Novo serviço
              </Link>
            )}
          </>
        }
      />

      {params.ok && (
        <div className="mb-4">
          <Alert tone="success">{params.ok}</Alert>
        </div>
      )}
      {params.erro && (
        <div className="mb-4">
          <Alert tone="error">{params.erro}</Alert>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
        <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-inset ring-black/10">
          {services.filter((service) => service.active).length} ativo(s)
        </span>
        <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-inset ring-black/10">
          {services.filter((service) => service.active && service.onlineEnabled).length}{" "}
          liberado(s) online
        </span>
        <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-inset ring-black/10">
          {services.length} no total
        </span>
      </div>

      {showForm && (
        <section className={`${cardClass} mb-6`}>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">
                {editing ? `Editar ${editing.name}` : "Novo serviço"}
              </h2>
              <p className="text-[11px] text-slate-500">
                Alterações em preço e duração valem para novos agendamentos.
              </p>
            </div>
            <Link
              href="/painel/servicos"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Fechar
            </Link>
          </div>
          <div className="p-4 sm:p-5">
            <ServiceForm
              mode={editing ? "edit" : "create"}
              professionals={professionals.map((professional) => ({
                id: professional.id,
                name: `${professional.name}${professional.active ? "" : " (inativo)"}`,
              }))}
              service={
                editing
                  ? {
                      id: editing.id,
                      name: editing.name,
                      description: editing.description ?? "",
                      category: editing.category ?? "",
                      price: toNumber(editing.price),
                      durationMin: editing.durationMin,
                      bufferMin: editing.bufferMin,
                      imageUrl: editing.imageUrl ?? "",
                      onlineEnabled: editing.onlineEnabled,
                      active: editing.active,
                      professionalIds: editing.professionals.map(
                        (item) => item.professionalId,
                      ),
                    }
                  : undefined
              }
            />
          </div>
        </section>
      )}

      {services.length === 0 ? (
        <EmptyState
          title="Nenhum serviço cadastrado"
          description="Comece com os serviços que você mais vende. O cliente só consegue agendar o que estiver ativo e online."
          action={
            <Link href="/painel/servicos?novo=1" className={buttonBrand}>
              <Plus className="h-4 w-4" /> Criar primeiro serviço
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {services.map((service) => {
            const linked = service.professionals
              .map(
                (link) =>
                  professionals.find((professional) => professional.id === link.professionalId)
                    ?.name,
              )
              .filter(Boolean);
            return (
              <article key={service.id} className={`${cardClass} p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/20 text-ink">
                      <Scissors className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h2 className="text-sm font-semibold text-ink">{service.name}</h2>
                        {!service.active && <Badge tone="danger">Inativo</Badge>}
                        {service.active && service.onlineEnabled && (
                          <Badge tone="brand">Online</Badge>
                        )}
                        {service.active && !service.onlineEnabled && (
                          <Badge tone="warn">Somente painel</Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {service.category || "Sem categoria"} ·{" "}
                        {formatDuration(service.durationMin)}
                        {service.bufferMin > 0 ? ` + ${service.bufferMin} min` : ""} ·{" "}
                        {service._count.appointments} atendimento(s)
                      </p>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-ink">
                    {formatCurrency(service.price)}
                  </p>
                </div>

                {service.description && (
                  <p className="mt-3 line-clamp-2 text-xs text-slate-600">
                    {service.description}
                  </p>
                )}
                <p className="mt-2 text-[11px] text-slate-500">
                  Profissionais:{" "}
                  {linked.length > 0 ? linked.join(", ") : "nenhum vinculado"}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
                  <Link href={`/painel/servicos?editar=${service.id}`} className={buttonSmall}>
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Link>
                  <form action={toggleServiceActiveAction}>
                    <input type="hidden" name="id" value={service.id} />
                    <button type="submit" className={buttonSmall}>
                      {service.active ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" /> Desativar
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Ativar
                        </>
                      )}
                    </button>
                  </form>
                  {service.active && (
                    <form action={toggleServiceOnlineAction}>
                      <input type="hidden" name="id" value={service.id} />
                      <button type="submit" className={buttonSmall}>
                        {service.onlineEnabled ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5" /> Ocultar online
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5" /> Liberar online
                          </>
                        )}
                      </button>
                    </form>
                  )}
                  <form action={deleteServiceAction}>
                    <input type="hidden" name="id" value={service.id} />
                    <ConfirmButton
                      className={`${buttonSmall} border-red-200 text-red-700 hover:bg-red-50`}
                      confirmMessage={`Remover "${service.name}"? O histórico de atendimentos é mantido, mas o serviço deixa de aparecer na agenda.`}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remover
                    </ConfirmButton>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
