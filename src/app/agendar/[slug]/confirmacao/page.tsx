import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageCircle,
  Phone,
  ReceiptText,
  Scissors,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getPublicAppointment } from "@/lib/booking";
import { formatCurrency, formatDateTimeInZone, formatPhone } from "@/lib/format";
import { buildWhatsAppLink, customerContactMessage } from "@/lib/whatsapp";
import { StatusBadge } from "@/components/ui";
import { CancelBookingForm } from "@/components/public/CancelBookingForm";
import {
  brandingCssVars,
  resolveBranding,
  type BrandingView,
} from "@/lib/branding";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Seu agendamento" };

const buttonTenant =
  "inline-flex items-center justify-center gap-2 rounded-[var(--brand-radius,0.5rem)] bg-[var(--brand-button)] px-4 py-2.5 text-sm font-semibold text-[var(--brand-button-text)] shadow-sm transition hover:brightness-95";
const buttonTenantOutline =
  "inline-flex items-center justify-center gap-2 rounded-[var(--brand-radius,0.5rem)] border border-[var(--brand-line)] bg-[var(--brand-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--brand-text)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]";

function googleCalendarUrl(input: {
  title: string;
  details: string;
  location: string;
  startAt: Date;
  endAt: Date;
}) {
  const format = (date: Date) =>
    date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    details: input.details,
    location: input.location,
    dates: `${format(input.startAt)}/${format(input.endAt)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function TenantHeader({
  slug,
  name,
  logoUrl,
  branding,
}: {
  slug: string;
  name: string;
  logoUrl: string | null;
  branding: BrandingView;
}) {
  return (
    <header className="border-b border-[var(--brand-line)] bg-[var(--brand-bg)]">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href={`/agendar/${slug}`} className="flex min-w-0 items-center gap-2.5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-9 w-9 rounded-lg object-cover" />
          ) : (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--brand)] text-xs font-bold text-white">
              {name.slice(0, 2).toUpperCase()}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate font-display text-sm font-semibold">
              {name}
            </span>
            <span className="block text-[10px] uppercase tracking-wide text-[var(--muted)]">
              {branding.tagline ?? "Agendamento online"}
            </span>
          </span>
        </Link>
        <Link
          href={`/agendar/${slug}`}
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--brand)]"
        >
          <ArrowLeft className="h-4 w-4" /> Nova reserva
        </Link>
      </div>
    </header>
  );
}

export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ protocolo?: string; token?: string }>;
}) {
  const { slug } = await params;
  const { protocolo, token } = await searchParams;
  const establishment = await prisma.establishment.findFirst({
    where: { slug, archivedAt: null },
    select: {
      name: true,
      slug: true,
      brandColor: true,
      logoUrl: true,
      whatsapp: true,
      phone: true,
      address: true,
      cancellationPolicy: true,
      cancellationNoticeHours: true,
      timezone: true,
      branding: true,
    },
  });
  if (!establishment) notFound();

  const branding = resolveBranding(establishment.branding, establishment.brandColor);
  const cssVars = brandingCssVars(branding) as React.CSSProperties;
  const data =
    protocolo && token ? await getPublicAppointment(slug, protocolo, token) : null;

  if (!data) {
    return (
      <div
        className="flex min-h-screen flex-col bg-[var(--brand-bg)] text-[var(--brand-text)]"
        style={cssVars}
      >
        <TenantHeader
          slug={establishment.slug}
          name={establishment.name}
          logoUrl={establishment.logoUrl}
          branding={branding}
        />
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-5 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-xl border border-[var(--brand-line)] bg-[var(--brand-surface)]">
            <ReceiptText className="h-6 w-6 text-[var(--brand)]" />
          </span>
          <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight">
            Não encontramos este agendamento
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            O link pode estar incompleto, expirado ou o protocolo não corresponde a{" "}
            {establishment.name}. Use o link enviado na confirmação ou fale com o
            estabelecimento.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href={`/agendar/${establishment.slug}`} className={buttonTenant}>
              <CalendarDays className="h-4 w-4" /> Abrir a agenda
            </Link>
            {establishment.whatsapp && (
              <a
                href={buildWhatsAppLink(
                  establishment.whatsapp,
                  customerContactMessage(establishment.name, protocolo),
                )}
                target="_blank"
                rel="noreferrer"
                className={buttonTenantOutline}
              >
                <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
              </a>
            )}
          </div>
        </main>
      </div>
    );
  }

  const { appointment, canCancel, cancellationDeadline } = data;
  const timezone = appointment.establishment.timezone;
  const isCancelled = appointment.status === "CANCELLED";
  const isPending = appointment.status === "PENDING";
  const whatsappUrl = buildWhatsAppLink(
    appointment.establishment.whatsapp,
    customerContactMessage(appointment.establishment.name, appointment.publicCode),
  );
  const calendarUrl = googleCalendarUrl({
    title: `${appointment.serviceName} — ${appointment.establishment.name}`,
    details: `Protocolo ${appointment.publicCode}. Profissional: ${appointment.professionalName}.`,
    location: appointment.establishment.address ?? "",
    startAt: appointment.startAt,
    endAt: appointment.endAt,
  });
  const icsUrl = `/api/public/${encodeURIComponent(slug)}/calendar?${new URLSearchParams({
    protocolo: appointment.publicCode,
    token: token ?? "",
  }).toString()}`;

  return (
    <div
      className="min-h-screen bg-[var(--brand-bg)] text-[var(--brand-text)]"
      style={cssVars}
    >
      <TenantHeader
        slug={establishment.slug}
        name={establishment.name}
        logoUrl={establishment.logoUrl}
        branding={branding}
      />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="animate-rise">
          <div className="flex items-start gap-3">
            <span
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                isCancelled
                  ? "bg-red-50 text-red-600"
                  : isPending
                    ? "bg-amber-50 text-amber-700"
                    : "bg-green-50 text-green-700"
              }`}
            >
              {isCancelled ? (
                <XCircle className="h-5 w-5" />
              ) : isPending ? (
                <Clock3 className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand)]">
                {appointment.establishment.name}
              </p>
              <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {isCancelled
                  ? "Agendamento cancelado"
                  : isPending
                    ? "Horário reservado, aguardando confirmação"
                    : "Agendamento confirmado"}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={appointment.status} />
                <span className="rounded-md border border-[var(--brand-line)] bg-[var(--brand-surface)] px-2.5 py-1 font-mono text-[11px] text-[var(--muted)]">
                  {appointment.publicCode}
                </span>
              </div>
            </div>
          </div>

          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
            {isCancelled
              ? "Este horário foi liberado. Se precisar de um novo atendimento, você pode fazer outra reserva."
              : isPending
                ? "O estabelecimento recebeu sua solicitação. Ele pode confirmar pelo WhatsApp. Não enviamos mensagens automáticas em seu nome."
                : "Seu horário está reservado. Chegue com alguns minutos de antecedência. Em caso de imprevisto, fale com o estabelecimento."}
          </p>

          <div className="mt-7 rounded-xl border border-[var(--brand-line)] bg-[var(--brand-bg)] p-5 shadow-sm">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[var(--brand-surface)]">
                  <CalendarDays className="h-4 w-4 text-[var(--brand)]" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Data e horário
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {formatDateTimeInZone(appointment.startAt, timezone)}
                  </p>
                  <p className="text-[11px] text-[var(--muted)]">
                    até {formatDateTimeInZone(appointment.endAt, timezone, "HH:mm")}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[var(--brand-surface)]">
                  <Scissors className="h-4 w-4 text-[var(--brand)]" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Serviço
                  </p>
                  <p className="mt-1 text-sm font-semibold">{appointment.serviceName}</p>
                  <p className="text-[11px] text-[var(--muted)]">
                    {appointment.durationMin} min · {formatCurrency(appointment.price)}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[var(--brand-surface)]">
                  <UserRound className="h-4 w-4 text-[var(--brand)]" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Profissional
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {appointment.professionalName}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[var(--brand-surface)]">
                  <MapPin className="h-4 w-4 text-[var(--brand)]" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Local
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {appointment.establishment.address ?? appointment.establishment.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-2 border-t border-[var(--brand-line)] pt-5 text-xs text-[var(--muted)] sm:grid-cols-2">
              <p>
                Cliente:{" "}
                <span className="text-[var(--brand-text)]">{appointment.customerName}</span>
              </p>
              <p>
                WhatsApp:{" "}
                <span className="text-[var(--brand-text)]">
                  {formatPhone(appointment.customerPhone)}
                </span>
              </p>
            </div>
          </div>

          {!isCancelled && (
            <div className="mt-5 flex flex-wrap gap-2">
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className={buttonTenant}>
                  <MessageCircle className="h-4 w-4" /> Enviar no WhatsApp
                </a>
              )}
              <a href={icsUrl} className={buttonTenantOutline}>
                <CalendarPlus className="h-4 w-4" /> Baixar .ics
              </a>
              <a
                href={calendarUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonTenantOutline}
              >
                <CalendarDays className="h-4 w-4" /> Google Agenda
              </a>
              {appointment.establishment.phone && (
                <a
                  href={`tel:${appointment.establishment.phone}`}
                  className={buttonTenantOutline}
                >
                  <Phone className="h-4 w-4" /> Ligar
                </a>
              )}
            </div>
          )}

          {!isCancelled && canCancel && (
            <div className="mt-6">
              <CancelBookingForm
                slug={establishment.slug}
                protocol={appointment.publicCode}
                token={token ?? ""}
                cancellationNoticeHours={establishment.cancellationNoticeHours}
              />
            </div>
          )}

          {!isCancelled && !canCancel && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
              O prazo para cancelar online terminou em{" "}
              {formatDateTimeInZone(cancellationDeadline, timezone)}. Fale diretamente com
              o estabelecimento pelo WhatsApp.
            </div>
          )}

          {isCancelled && appointment.cancellationReason && (
            <p className="mt-5 rounded-lg border border-[var(--brand-line)] bg-[var(--brand-bg)] px-4 py-3 text-xs text-[var(--muted)]">
              Motivo registrado: {appointment.cancellationReason}
            </p>
          )}

          <div className="mt-8 rounded-lg border border-[var(--brand-line)] bg-[var(--brand-surface)] p-4">
            <div className="flex items-start gap-2 text-xs leading-relaxed text-[var(--muted)]">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand)]" />
              <div>
                <p>
                  Guarde este link para consultar ou cancelar o agendamento. Ele contém um
                  código de acesso individual — não o compartilhe publicamente.
                </p>
                {appointment.establishment.cancellationPolicy && (
                  <p className="mt-2">{appointment.establishment.cancellationPolicy}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--brand-line)] bg-[var(--brand-surface)]">
        <div className="mx-auto max-w-3xl px-4 py-6 text-center text-[11px] text-[var(--muted)] sm:px-6">
          Agenda online de{" "}
          <strong className="font-semibold text-[var(--brand-text)]">
            {appointment.establishment.name}
          </strong>
          . Este comprovante registra o horário; a confirmação final é do estabelecimento.
        </div>
      </footer>
    </div>
  );
}
