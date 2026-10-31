import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarPlus,
  CalendarRange,
  Filter,
  MessageCircle,
  Phone,
  Search,
  UserRound,
} from "lucide-react";
import type { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePanel } from "@/lib/auth/session";
import { isManagerRole } from "@/lib/permissions";
import {
  formatCurrency,
  formatDateTimeInZone,
  formatDuration,
  formatPhone,
  toNumber,
} from "@/lib/format";
import { addDaysToDate, dateRangeInZone, isValidDateString, todayInZone } from "@/lib/timezone";
import {
  ORIGIN_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
} from "@/lib/constants";
import { appointmentMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import {
  Alert,
  buttonBrand,
  buttonSecondary,
  cardClass,
  EmptyState,
  PageHeader,
  StatusBadge,
  TabLink,
} from "@/components/ui";
import { AppointmentActions } from "@/components/panel/AppointmentActions";
import { AppointmentCreateForm } from "@/components/panel/AppointmentCreateForm";
import { RescheduleForm } from "@/components/panel/RescheduleForm";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;
const statuses: AppointmentStatus[] = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    ok?: string;
    erro?: string;
    protocolo?: string;
    novo?: string;
    status?: string;
    profissional?: string;
    de?: string;
    ate?: string;
    busca?: string;
    pagina?: string;
  }>;
}) {
  const auth = await requirePanel();
  const params = await searchParams;
  const establishment = auth.establishment;
  const isManager = isManagerRole(auth.role);
  const today = todayInZone(establishment.timezone);
  const maxDate = addDaysToDate(today, establishment.maxAdvanceDays);

  if (params.novo === "1" && isManager) {
    const [services, professionals, professionalServices] = await Promise.all([
      prisma.service.findMany({
        where: { establishmentId: establishment.id, active: true, deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true, price: true, durationMin: true },
      }),
      prisma.professional.findMany({
        where: { establishmentId: establishment.id, active: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true },
      }),
      prisma.professionalService.findMany({
        where: { establishmentId: establishment.id },
        select: { professionalId: true, serviceId: true },
      }),
    ]);

    const links = new Map<string, string[]>();
    for (const link of professionalServices) {
      links.set(link.serviceId, [...(links.get(link.serviceId) ?? []), link.professionalId]);
    }

    return (
      <div>
        <PageHeader
          eyebrow="Agendamentos"
          title="Novo agendamento"
          description="O horário é validado no servidor, incluindo bloqueios, expediente e conflitos."
          actions={
            <Link href="/painel/agendamentos" className={buttonSecondary}>
              <ArrowLeft className="h-4 w-4" /> Voltar para a lista
            </Link>
          }
        />
        {services.length === 0 || professionals.length === 0 ? (
          <EmptyState
            title="Falta configurar a operação"
            description="Cadastre pelo menos um serviço ativo e um profissional ativo para criar um agendamento."
            action={
              <div className="flex gap-2">
                <Link href="/painel/servicos" className={buttonBrand}>
                  Serviços
                </Link>
                <Link href="/painel/profissionais" className={buttonSecondary}>
                  Profissionais
                </Link>
              </div>
            }
          />
        ) : (
          <div className={`${cardClass} p-5`}>
            <AppointmentCreateForm
              services={services.map((service) => ({
                id: service.id,
                name: service.name,
                price: toNumber(service.price),
                durationMin: service.durationMin,
                professionalIds: links.get(service.id) ?? [],
              }))}
              professionals={professionals}
              timezone={establishment.timezone}
              defaultDate={today}
              maxDate={maxDate}
              supportMessage="O sistema não envia mensagens automaticamente: o link abre o WhatsApp com o texto pronto para você conferir e enviar."
            />
          </div>
        )}
      </div>
    );
  }

  const selectedStatus =
    params.status && statuses.includes(params.status as AppointmentStatus)
      ? (params.status as AppointmentStatus)
      : null;
  const selectedProfessional =
    isManager &&
    params.profissional &&
    params.profissional !== "todos"
      ? params.profissional
      : null;
  const from = params.de && isValidDateString(params.de) ? params.de : null;
  const to = params.ate && isValidDateString(params.ate) ? params.ate : null;
  const search = params.busca?.trim() ?? "";
  const page = Math.max(1, Number(params.pagina) || 1);
  const range = from || to ? dateRangeInZone(from ?? "2000-01-01", to ?? "2100-12-31", establishment.timezone) : null;

  const scope = isManager
    ? {}
    : { professionalId: auth.professionalId ?? "__none__" };

  const where = {
    establishmentId: establishment.id,
    ...scope,
    ...(selectedProfessional ? { professionalId: selectedProfessional } : {}),
    ...(selectedStatus ? { status: selectedStatus } : {}),
    ...(range ? { startAt: { gte: from ? range.start : undefined, lt: to ? range.end : undefined } } : {}),
    ...(search
      ? {
          OR: [
            { customerName: { contains: search, mode: "insensitive" as const } },
            { customerPhone: { contains: search.replace(/\D/g, "") } },
            { publicCode: { contains: search.toUpperCase() } },
          ],
        }
      : {}),
  };

  const [appointments, total, professionals] = await Promise.all([
    prisma.appointment.findMany({
      where,
      orderBy: { startAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        publicCode: true,
        startAt: true,
        status: true,
        serviceName: true,
        professionalName: true,
        customerName: true,
        customerPhone: true,
        price: true,
        origin: true,
      },
    }),
    prisma.appointment.count({ where }),
    isManager
      ? prisma.professional.findMany({
          where: { establishmentId: establishment.id },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          select: { id: true, name: true, active: true },
        })
      : Promise.resolve([]),
  ]);

  const detail = params.protocolo
    ? await prisma.appointment.findFirst({
        where: {
          establishmentId: establishment.id,
          publicCode: params.protocolo.toUpperCase(),
          ...(isManager ? {} : { professionalId: auth.professionalId ?? "__none__" }),
        },
        include: {
          customer: true,
          events: { orderBy: { createdAt: "desc" } },
        },
      })
    : null;

  if (params.protocolo && !detail) notFound();

  const servicesForReschedule = detail
    ? await prisma.professionalService.findMany({
        where: {
          establishmentId: establishment.id,
          serviceId: detail.serviceId,
          professional: { active: true },
        },
        select: { professional: { select: { id: true, name: true } } },
        orderBy: { professional: { name: "asc" } },
      })
    : [];

  const filterParams = new URLSearchParams();
  if (selectedStatus) filterParams.set("status", selectedStatus);
  if (selectedProfessional) filterParams.set("profissional", selectedProfessional);
  if (from) filterParams.set("de", from);
  if (to) filterParams.set("ate", to);
  if (search) filterParams.set("busca", search);

  const pageLink = (target: number) => {
    const next = new URLSearchParams(filterParams);
    if (target > 1) next.set("pagina", String(target));
    const query = next.toString();
    return `/painel/agendamentos${query ? `?${query}` : ""}`;
  };

  return (
    <div>
      <PageHeader
        eyebrow="Agendamentos"
        title="Todos os atendimentos"
        description={
          isManager
            ? "Filtre, confirme, reagende e acompanhe o histórico. Tudo isolado por estabelecimento."
            : "Seus atendimentos, com histórico e ações permitidas ao seu perfil."
        }
        actions={
          <>
            <Link href="/painel/agenda" className={buttonSecondary}>
              <CalendarRange className="h-4 w-4" /> Agenda
            </Link>
            {isManager && (
              <Link href="/painel/agendamentos?novo=1" className={buttonBrand}>
                <CalendarPlus className="h-4 w-4" /> Novo agendamento
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

      {detail && (
        <section className={`${cardClass} mb-6 overflow-hidden`}>
          <div className="flex flex-col gap-3 border-b border-line bg-paper px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/painel/agendamentos"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-ink"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Lista
              </Link>
              <span className="text-slate-300">/</span>
              <span className="font-mono text-xs font-bold text-ink">{detail.publicCode}</span>
              <StatusBadge status={detail.status} />
            </div>
            <div className="flex flex-wrap gap-2">
              {detail.customerPhone !== "removido" && (
                <a
                  href={buildWhatsAppLink(
                    detail.customerPhone,
                    appointmentMessage({
                      customerName: detail.customerName,
                      customerPhone: detail.customerPhone,
                      serviceName: detail.serviceName,
                      professionalName: detail.professionalName,
                      startAt: detail.startAt,
                      timezone: establishment.timezone,
                      protocol: detail.publicCode,
                      establishmentName: establishment.name,
                      address: establishment.address,
                      policy: establishment.cancellationPolicy,
                      customTemplate: establishment.whatsappMessage,
                    }),
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonBrand}
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              )}
              <a href={`tel:${detail.customerPhone}`} className={buttonSecondary}>
                <Phone className="h-4 w-4" /> Ligar
              </a>
            </div>
          </div>

          <div className="grid gap-6 p-4 sm:p-5 xl:grid-cols-[1.4fr_0.9fr]">
            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Detail label="Cliente" value={detail.customerName} />
                <Detail label="Telefone" value={formatPhone(detail.customerPhone)} />
                <Detail label="Serviço" value={detail.serviceName} />
                <Detail label="Profissional" value={detail.professionalName} />
                <Detail
                  label="Data e hora"
                  value={formatDateTimeInZone(
                    detail.startAt,
                    establishment.timezone,
                    "EEEE, dd/MM/yyyy 'às' HH:mm",
                  )}
                />
                <Detail
                  label="Duração"
                  value={`${formatDuration(detail.durationMin)}${
                    detail.bufferMin ? ` + ${detail.bufferMin} min de intervalo` : ""
                  }`}
                />
                <Detail label="Valor" value={formatCurrency(detail.price)} />
                <Detail label="Origem" value={ORIGIN_LABELS[detail.origin]} />
                <Detail label="Criado em" value={formatDateTimeInZone(detail.createdAt, establishment.timezone)} />
                <Detail
                  label="Cliente cadastrado"
                  value={detail.customer.anonymizedAt ? "Dados anonimizados" : "Dados ativos"}
                />
              </div>
              {detail.notes && (
                <div className="mt-4 rounded-xl bg-paper p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    Observações internas
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{detail.notes}</p>
                </div>
              )}
              {detail.cancellationReason && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-red-700">
                    Motivo do cancelamento
                  </p>
                  <p className="mt-1 text-sm text-red-800">{detail.cancellationReason}</p>
                </div>
              )}

              <div className="mt-5">
                <h3 className="text-sm font-semibold text-ink">Ações</h3>
                <div className="mt-2">
                  <AppointmentActions
                    appointmentId={detail.id}
                    status={detail.status}
                    role={auth.role}
                    returnTo={`/painel/agendamentos?protocolo=${encodeURIComponent(detail.publicCode)}`}
                  />
                  {(detail.status === "COMPLETED" ||
                    detail.status === "CANCELLED" ||
                    detail.status === "NO_SHOW") && (
                    <p className="text-xs text-slate-500">
                      Este atendimento está encerrado e não aceita novas alterações de status.
                    </p>
                  )}
                </div>
              </div>

              {isManager &&
                (detail.status === "PENDING" || detail.status === "CONFIRMED") && (
                  <div className="mt-5 rounded-xl border border-line p-4">
                    <h3 className="text-sm font-semibold text-ink">Reagendar</h3>
                    <p className="mb-3 mt-1 text-[11px] text-slate-500">
                      O novo horário passa pela mesma validação de conflitos e bloqueios.
                    </p>
                    <RescheduleForm
                      appointmentId={detail.id}
                      serviceId={detail.serviceId}
                      professionals={servicesForReschedule.map((item) => item.professional)}
                      defaultProfessionalId={detail.professionalId}
                      defaultDate={formatDateTimeInZone(
                        detail.startAt,
                        establishment.timezone,
                        "yyyy-MM-dd",
                      )}
                      defaultTime={formatDateTimeInZone(
                        detail.startAt,
                        establishment.timezone,
                        "HH:mm",
                      )}
                      maxDate={maxDate}
                    />
                  </div>
                )}
            </div>

            <aside>
              <h3 className="text-sm font-semibold text-ink">Histórico</h3>
              <ol className="mt-3 space-y-3">
                {detail.events.length === 0 ? (
                  <li className="text-xs text-slate-500">Nenhum evento registrado.</li>
                ) : (
                  detail.events.map((event) => (
                    <li key={event.id} className="relative border-l border-line pl-4">
                      <span className="absolute -left-1 top-1.5 h-2 w-2 rounded-full bg-brand ring-2 ring-white" />
                      <p className="text-xs font-semibold text-ink">
                        {event.type === "CREATED"
                          ? "Criado"
                          : event.type === "RESCHEDULED"
                            ? "Reagendado"
                            : event.type === "CONFIRMED"
                              ? "Confirmado"
                              : event.type === "CANCELLED"
                                ? "Cancelado"
                                : event.type === "COMPLETED"
                                  ? "Concluído"
                                  : event.type === "NO_SHOW"
                                    ? "Não compareceu"
                                    : "Atualizado"}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {formatDateTimeInZone(event.createdAt, establishment.timezone)} ·{" "}
                        {event.actorLabel ?? "Sistema"}
                      </p>
                    </li>
                  ))
                )}
              </ol>
            </aside>
          </div>
        </section>
      )}

      <section className={cardClass}>
        <form method="get" action="/painel/agendamentos" className="border-b border-line p-3 sm:p-4">
          <div className="flex flex-wrap items-end gap-2.5">
            <div className="min-w-[180px] flex-1">
              <label htmlFor="busca" className="sr-only">
                Buscar
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  id="busca"
                  name="busca"
                  defaultValue={search}
                  placeholder="Buscar por cliente, telefone ou protocolo"
                  className="w-full rounded-xl border border-line bg-white py-2 pl-9 pr-3 text-sm text-ink"
                />
              </div>
            </div>
            <div>
              <label htmlFor="status" className="sr-only">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={selectedStatus ?? ""}
                className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-medium text-ink"
              >
                <option value="">Todos os status</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
            {isManager && (
              <div>
                <label htmlFor="profissional" className="sr-only">
                  Profissional
                </label>
                <select
                  id="profissional"
                  name="profissional"
                  defaultValue={selectedProfessional ?? "todos"}
                  className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-medium text-ink"
                >
                  <option value="todos">Todos os profissionais</option>
                  {professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>
                      {professional.name}
                      {professional.active ? "" : " (inativo)"}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="de" className="mb-0.5 block text-[10px] font-semibold text-slate-500">
                De
              </label>
              <input
                id="de"
                name="de"
                type="date"
                defaultValue={from ?? ""}
                className="rounded-xl border border-line bg-white px-2.5 py-2 text-xs text-ink"
              />
            </div>
            <div>
              <label htmlFor="ate" className="mb-0.5 block text-[10px] font-semibold text-slate-500">
                Até
              </label>
              <input
                id="ate"
                name="ate"
                type="date"
                defaultValue={to ?? ""}
                className="rounded-xl border border-line bg-white px-2.5 py-2 text-xs text-ink"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-white"
            >
              <Filter className="h-3.5 w-3.5" /> Filtrar
            </button>
            {(selectedStatus || selectedProfessional || from || to || search) && (
              <Link
                href="/painel/agendamentos"
                className="px-2 py-2 text-xs font-semibold text-slate-500 hover:text-ink"
              >
                Limpar
              </Link>
            )}
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2 text-[11px] text-slate-500">
          <span>
            {total} resultado(s)
            {from || to ? " no período" : ""}
          </span>
          <span>
            Página {page} de {Math.max(1, Math.ceil(total / PAGE_SIZE))}
          </span>
        </div>

        {appointments.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="Nenhum agendamento encontrado"
              description={
                selectedStatus || selectedProfessional || from || to || search
                  ? "Ajuste os filtros para ver outros resultados."
                  : isManager
                    ? "Crie um agendamento manual ou compartilhe sua página pública."
                    : "Quando você tiver atendimentos, eles aparecem aqui."
              }
              action={
                isManager && !selectedStatus && !search ? (
                  <Link href="/painel/agendamentos?novo=1" className={buttonBrand}>
                    <CalendarPlus className="h-4 w-4" /> Novo agendamento
                  </Link>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-paper text-left text-[10px] uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Data</th>
                    <th className="px-4 py-2.5 font-semibold">Cliente</th>
                    <th className="px-4 py-2.5 font-semibold">Serviço</th>
                    <th className="px-4 py-2.5 font-semibold">Profissional</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Valor</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-paper/60">
                      <td className="whitespace-nowrap px-4 py-3">
                        <p className="text-xs font-semibold text-ink">
                          {formatDateTimeInZone(appointment.startAt, establishment.timezone, "dd/MM/yyyy")}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {formatDateTimeInZone(appointment.startAt, establishment.timezone, "HH:mm")}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-ink">{appointment.customerName}</p>
                        <p className="text-[11px] text-slate-500">
                          {formatPhone(appointment.customerPhone)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{appointment.serviceName}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <UserRound className="h-3 w-3 text-slate-500" />
                          {appointment.professionalName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${STATUS_STYLES[appointment.status]}`}
                        >
                          {STATUS_LABELS[appointment.status]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-ink">
                        {formatCurrency(appointment.price)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/painel/agendamentos?protocolo=${encodeURIComponent(appointment.publicCode)}`}
                          className="text-[11px] font-semibold text-ink underline underline-offset-2"
                        >
                          Detalhes
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-line px-4 py-3">
              {page > 1 ? (
                <Link href={pageLink(page - 1)} className="text-xs font-semibold text-slate-600 hover:text-ink">
                  ← Anterior
                </Link>
              ) : (
                <span />
              )}
              {page * PAGE_SIZE < total ? (
                <Link href={pageLink(page + 1)} className="text-xs font-semibold text-slate-600 hover:text-ink">
                  Próxima →
                </Link>
              ) : (
                <span />
              )}
            </div>
          </>
        )}
      </section>

      <div className="mt-4 flex flex-wrap gap-2">
        <TabLink href={`/painel/agendamentos?de=${today}&ate=${today}`} active={false}>
          Hoje
        </TabLink>
        <TabLink href="/painel/agendamentos?status=PENDING" active={false}>
          Pendentes
        </TabLink>
        <TabLink href="/painel/agendamentos?status=CONFIRMED" active={false}>
          Confirmados
        </TabLink>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm text-ink">{value}</p>
    </div>
  );
}
