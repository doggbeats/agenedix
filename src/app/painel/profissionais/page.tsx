import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  EyeOff,
  Mail,
  Pencil,
  Plus,
  UserRound,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/auth/session";
import { minutesToTime } from "@/lib/format";
import { toggleProfessionalActiveAction } from "@/lib/actions/professionals";
import { WEEKDAYS } from "@/lib/constants";
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
import { ProfessionalForm } from "@/components/panel/ProfessionalForm";

export const dynamic = "force-dynamic";

export default async function ProfessionalsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string; novo?: string; editar?: string }>;
}) {
  const auth = await requireManager();
  const params = await searchParams;
  const establishment = auth.establishment;

  const [professionals, services] = await Promise.all([
    prisma.professional.findMany({
      where: { establishmentId: establishment.id },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        services: { select: { serviceId: true } },
        availability: { orderBy: { weekday: "asc" } },
        memberships: {
          include: { user: { select: { name: true, email: true } } },
        },
        _count: { select: { appointments: true } },
      },
    }),
    prisma.service.findMany({
      where: { establishmentId: establishment.id, active: true, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  const editing = params.editar
    ? professionals.find((professional) => professional.id === params.editar)
    : null;
  if (params.editar && !editing) notFound();

  const showForm = params.novo === "1" || Boolean(editing);
  const activeCount = professionals.filter((professional) => professional.active).length;

  function scheduleFor(professional: (typeof professionals)[number]) {
    const working = professional.availability.filter((item) => item.isWorking);
    if (working.length === 0) return null;
    const base = working[0];
    return {
      workdays: working.map((item) => item.weekday),
      startTime: minutesToTime(base.startMinute),
      endTime: minutesToTime(base.endMinute),
      breakStart:
        base.breakStartMinute != null ? minutesToTime(base.breakStartMinute) : "",
      breakEnd: base.breakEndMinute != null ? minutesToTime(base.breakEndMinute) : "",
    };
  }

  return (
    <div>
      <PageHeader
        eyebrow="Equipe"
        title="Profissionais"
        description="Quem atende, quais serviços realiza e em quais dias aparece na agenda."
        actions={
          <>
            <Link href="/painel/agendamentos?novo=1" className={buttonSecondary}>
              <CalendarPlus className="h-4 w-4" /> Novo agendamento
            </Link>
            {!showForm && (
              <Link href="/painel/profissionais?novo=1" className={buttonBrand}>
                <Plus className="h-4 w-4" /> Novo profissional
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
          {activeCount} ativo(s)
        </span>
        <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-inset ring-black/10">
          {professionals.length} no total
        </span>
      </div>

      {showForm && (
        <section className={`${cardClass} mb-6`}>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">
                {editing ? `Editar ${editing.name}` : "Novo profissional"}
              </h2>
              <p className="text-[11px] text-slate-500">
                O expediente abaixo vale para todos os dias marcados.
              </p>
            </div>
            <Link
              href="/painel/profissionais"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Fechar
            </Link>
          </div>
          <div className="p-4 sm:p-5">
            <ProfessionalForm
              mode={editing ? "edit" : "create"}
              services={services}
              professional={
                editing
                  ? {
                      id: editing.id,
                      name: editing.name,
                      bio: editing.bio ?? "",
                      photoUrl: editing.photoUrl ?? "",
                      specialties: editing.specialties ?? "",
                      active: editing.active,
                      serviceIds: editing.services.map((item) => item.serviceId),
                      ...(scheduleFor(editing) ?? {
                        workdays: [1, 2, 3, 4, 5],
                        startTime: "09:00",
                        endTime: "18:00",
                        breakStart: "",
                        breakEnd: "",
                      }),
                    }
                  : undefined
              }
            />
          </div>
        </section>
      )}

      {professionals.length === 0 ? (
        <EmptyState
          title="Nenhum profissional cadastrado"
          description="Cadastre a equipe para que os serviços possam ser agendados online."
          action={
            <Link href="/painel/profissionais?novo=1" className={buttonBrand}>
              <Plus className="h-4 w-4" /> Cadastrar profissional
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {professionals.map((professional) => {
            const schedule = scheduleFor(professional);
            const linkedServices = professional.services
              .map((link) => services.find((service) => service.id === link.serviceId)?.name)
              .filter(Boolean);
            const access = professional.memberships[0]?.user;
            return (
              <article key={professional.id} className={`${cardClass} p-4`}>
                <div className="flex items-start gap-3">
                  {professional.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={professional.photoUrl}
                      alt=""
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-paper text-sm font-bold text-slate-500">
                      {professional.name
                        .trim()
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => part[0]?.toUpperCase())
                        .join("")}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h2 className="text-sm font-semibold text-ink">{professional.name}</h2>
                      {professional.active ? (
                        <Badge tone="brand">Ativo</Badge>
                      ) : (
                        <Badge tone="danger">Inativo</Badge>
                      )}
                      {access && (
                        <Badge tone="info">
                          <BadgeCheck className="mr-1 h-3 w-3" /> Acesso próprio
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {professional.specialties || "Sem especialidades informadas"} ·{" "}
                      {professional._count.appointments} atendimento(s)
                    </p>
                  </div>
                </div>

                {professional.bio && (
                  <p className="mt-3 line-clamp-2 text-xs text-slate-600">{professional.bio}</p>
                )}

                <div className="mt-3 space-y-1.5 text-[11px] text-slate-600">
                  <p className="flex items-start gap-1.5">
                    <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                    {schedule ? (
                      <span>
                        {schedule.workdays
                          .map((weekday) => WEEKDAYS[weekday].short)
                          .join(", ")}{" "}
                        · {schedule.startTime}–{schedule.endTime}
                        {schedule.breakStart && schedule.breakEnd
                          ? ` · pausa ${schedule.breakStart}–${schedule.breakEnd}`
                          : ""}
                      </span>
                    ) : (
                      <span className="text-amber-700">
                        Sem dias de trabalho definidos — não aparece na agenda
                      </span>
                    )}
                  </p>
                  <p className="flex items-start gap-1.5">
                    <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                    <span>
                      Serviços:{" "}
                      {linkedServices.length > 0 ? linkedServices.join(", ") : "nenhum vinculado"}
                    </span>
                  </p>
                  {access && (
                    <p className="flex items-start gap-1.5">
                      <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                      <span>Login: {access.email}</span>
                    </p>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
                  <Link
                    href={`/painel/profissionais?editar=${professional.id}`}
                    className={buttonSmall}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Link>
                  <form action={toggleProfessionalActiveAction}>
                    <input type="hidden" name="id" value={professional.id} />
                    <button type="submit" className={buttonSmall}>
                      {professional.active ? (
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
                  <Link
                    href={`/painel/agenda?profissional=${professional.id}`}
                    className={buttonSmall}
                  >
                    Ver agenda
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
