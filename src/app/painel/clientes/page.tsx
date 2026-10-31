import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  MessageCircle,
  Phone,
  Search,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/auth/session";
import { formatCurrency, formatDateTimeInZone, formatPhone } from "@/lib/format";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/constants";
import { customerContactMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import {
  Alert,
  Badge,
  buttonBrand,
  buttonSecondary,
  cardClass,
  EmptyState,
  PageHeader,
  StatCard,
} from "@/components/ui";
import { CustomerAnonymizeForm } from "@/components/panel/CustomerAnonymizeForm";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; cliente?: string; ok?: string; erro?: string }>;
}) {
  const auth = await requireManager();
  const params = await searchParams;
  const establishment = auth.establishment;
  const search = params.busca?.trim() ?? "";

  const customers = await prisma.customer.findMany({
    where: {
      establishmentId: establishment.id,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { phone: { contains: search.replace(/\D/g, "") } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: [{ anonymizedAt: "asc" }, { name: "asc" }],
    take: 100,
  });

  const totals = await prisma.appointment.groupBy({
    by: ["customerId"],
    where: {
      establishmentId: establishment.id,
      customerId: { in: customers.map((customer) => customer.id) },
      status: { not: "CANCELLED" },
    },
    _count: { _all: true },
    _sum: { price: true },
  });
  const totalsByCustomer = new Map(totals.map((item) => [item.customerId, item]));

  const detail = params.cliente
    ? await prisma.customer.findFirst({
        where: { id: params.cliente, establishmentId: establishment.id },
        include: {
          appointments: {
            orderBy: { startAt: "desc" },
            take: 50,
          },
        },
      })
    : null;
  if (params.cliente && !detail) notFound();

  const activeCustomers = customers.filter((customer) => !customer.anonymizedAt).length;
  const detailTotals = detail
    ? detail.appointments
        .filter((appointment) => appointment.status !== "CANCELLED")
        .reduce(
          (acc, appointment) => ({
            count: acc.count + 1,
            revenue: acc.revenue + Number(appointment.price),
          }),
          { count: 0, revenue: 0 },
        )
    : null;

  return (
    <div>
      <PageHeader
        eyebrow="Relacionamento"
        title="Clientes"
        description="Histórico de atendimentos, contato e exclusão de dados pessoais conforme a LGPD."
        actions={
          <Link href="/painel/agendamentos?novo=1" className={buttonBrand}>
            Novo agendamento
          </Link>
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
                href="/painel/clientes"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-ink"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Lista
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-sm font-semibold text-ink">{detail.name}</span>
              {detail.anonymizedAt && <Badge tone="warn">Anonimizado</Badge>}
            </div>
            {!detail.anonymizedAt && (
              <div className="flex flex-wrap gap-2">
                <a
                  href={buildWhatsAppLink(
                    detail.phone,
                    customerContactMessage(establishment.name),
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonBrand}
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
                <a href={`tel:${detail.phone}`} className={buttonSecondary}>
                  <Phone className="h-4 w-4" /> Ligar
                </a>
              </div>
            )}
          </div>

          <div className="grid gap-6 p-4 sm:p-5 xl:grid-cols-[1.5fr_0.9fr]">
            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Telefone
                  </p>
                  <p className="mt-0.5 text-sm text-ink">{formatPhone(detail.phone)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    E-mail
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-ink">
                    <Mail className="h-3.5 w-3.5 text-slate-500" />
                    {detail.email ?? "Não informado"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Cliente desde
                  </p>
                  <p className="mt-0.5 text-sm text-ink">
                    {formatDateTimeInZone(detail.createdAt, establishment.timezone, "dd/MM/yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Total em atendimentos
                  </p>
                  <p className="mt-0.5 text-sm text-ink">
                    {detailTotals?.count ?? 0} · {formatCurrency(detailTotals?.revenue ?? 0)}
                  </p>
                </div>
              </div>
              {detail.notes && (
                <div className="mt-4 rounded-xl bg-paper p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Observações
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{detail.notes}</p>
                </div>
              )}

              <h3 className="mt-5 text-sm font-semibold text-ink">Histórico</h3>
              {detail.appointments.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">Nenhum atendimento registrado.</p>
              ) : (
                <div className="mt-2 overflow-x-auto rounded-xl border border-line">
                  <table className="min-w-full text-xs">
                    <thead className="bg-paper text-left text-[10px] uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Data</th>
                        <th className="px-3 py-2 font-semibold">Serviço</th>
                        <th className="px-3 py-2 font-semibold">Profissional</th>
                        <th className="px-3 py-2 font-semibold">Status</th>
                        <th className="px-3 py-2 text-right font-semibold">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line bg-white">
                      {detail.appointments.map((appointment) => (
                        <tr key={appointment.id}>
                          <td className="whitespace-nowrap px-3 py-2">
                            {formatDateTimeInZone(
                              appointment.startAt,
                              establishment.timezone,
                              "dd/MM/yyyy HH:mm",
                            )}
                          </td>
                          <td className="px-3 py-2">{appointment.serviceName}</td>
                          <td className="px-3 py-2">{appointment.professionalName}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${STATUS_STYLES[appointment.status]}`}
                            >
                              {STATUS_LABELS[appointment.status]}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-right">
                            {formatCurrency(appointment.price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <aside className="space-y-3">
              <div className="rounded-xl border border-line p-4">
                <p className="text-xs font-semibold text-ink">Direitos do titular</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  A exclusão apaga os dados pessoais e mantém o registro financeiro anônimo.
                  Agendamentos futuros precisam ser cancelados antes.
                </p>
              </div>
              {detail.anonymizedAt ? (
                <Alert tone="info">
                  Dados pessoais anonimizados em{" "}
                  {formatDateTimeInZone(detail.anonymizedAt, establishment.timezone)}.
                </Alert>
              ) : (
                <CustomerAnonymizeForm customerId={detail.id} />
              )}
            </aside>
          </div>
        </section>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard label="Clientes cadastrados" value={customers.length} hint="Até 100 por busca" />
        <StatCard label="Com dados ativos" value={activeCustomers} hint="Sem anonimização" />
        <StatCard
          label="Base total"
          value={await prisma.customer.count({ where: { establishmentId: establishment.id } })}
          hint="Inclui anonimizados"
        />
      </div>

      <section className={cardClass}>
        <form method="get" action="/painel/clientes" className="border-b border-line p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                name="busca"
                defaultValue={search}
                placeholder="Buscar por nome, telefone ou e-mail"
                aria-label="Buscar clientes"
                className="w-full rounded-xl border border-line bg-white py-2 pl-9 pr-3 text-sm text-ink"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-white"
            >
              Buscar
            </button>
            {search && (
              <Link
                href="/painel/clientes"
                className="px-2 py-2 text-xs font-semibold text-slate-500 hover:text-ink"
              >
                Limpar
              </Link>
            )}
          </div>
        </form>

        {customers.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={<Users className="h-5 w-5" />}
              title="Nenhum cliente encontrado"
              description={
                search
                  ? "Tente outro nome, telefone ou e-mail."
                  : "Os clientes aparecem aqui quando agendam pela página pública ou pelo painel."
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {customers.map((customer) => {
              const totals = totalsByCustomer.get(customer.id);
              return (
                <li key={customer.id}>
                  <Link
                    href={`/painel/clientes?cliente=${customer.id}`}
                    className="flex flex-col gap-1.5 px-4 py-3 transition hover:bg-paper sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper text-[10px] font-bold text-slate-500">
                        {customer.name
                          .trim()
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((part) => part[0]?.toUpperCase())
                          .join("")}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-ink">
                            {customer.name}
                          </p>
                          {customer.anonymizedAt && <Badge tone="warn">Anonimizado</Badge>}
                        </div>
                        <p className="truncate text-[11px] text-slate-500">
                          {formatPhone(customer.phone)}
                          {customer.email ? ` · ${customer.email}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pl-12 text-[11px] text-slate-500 sm:pl-0">
                      <span>{totals?._count._all ?? 0} atendimento(s)</span>
                      <span className="font-semibold text-ink">
                        {formatCurrency(totals?._sum.price ?? 0)}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
