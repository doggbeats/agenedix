import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  Clock3,
  Globe2,
  MapPin,
  MessageCircle,
  Phone,
  Scissors,
  ShieldCheck,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buildWhatsAppLink, customerContactMessage } from "@/lib/whatsapp";
import { formatCurrency, formatDuration, formatPhone, minutesToTime, toNumber } from "@/lib/format";
import { addDaysToDate, getWeekday, todayInZone } from "@/lib/timezone";
import { WEEKDAYS } from "@/lib/constants";
import {
  brandingCssVars,
  resolveBranding,
  type BrandingView,
} from "@/lib/branding";
import {
  isSubscriptionUsable,
  subscriptionBlockedMessage,
} from "@/lib/subscription";
import { buttonTenant, buttonTenantOutline } from "@/components/ui";
import {
  BookingWizard,
  type DateOption,
  type PublicProfessional,
  type PublicService,
} from "@/components/public/BookingWizard";
import { PublicPageMenu } from "@/components/public/PublicPageMenu";

export const dynamic = "force-dynamic";

const SUBSCRIPTION_SELECT = {
  status: true,
  trialEndsAt: true,
  currentPeriodEnd: true,
  toleranceDays: true,
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const establishment = await prisma.establishment.findFirst({
    where: { slug, archivedAt: null },
    select: {
      name: true,
      description: true,
      segment: true,
      logoUrl: true,
      branding: { select: { tagline: true, coverUrl: true } },
    },
  });
  if (!establishment) return { title: "Agenda não encontrada" };
  const cover = establishment.branding?.coverUrl;
  const shareableCover =
    cover && (/^https?:\/\//i.test(cover) || cover.startsWith("/")) ? cover : undefined;
  return {
    title: `${establishment.name} — agendamento online`,
    description:
      establishment.branding?.tagline ??
      establishment.description ??
      `Agende seu horário na ${establishment.name}. ${establishment.segment} com agenda online.`,
    openGraph: shareableCover ? { images: [shareableCover] } : undefined,
  };
}

function SocialLinks({ branding }: { branding: BrandingView }) {
  const links = [
    { href: branding.instagram, label: "Instagram", icon: Camera },
    { href: branding.facebook, label: "Facebook", icon: Users },
    { href: branding.website, label: "Site", icon: Globe2 },
  ].filter((item) => Boolean(item.href));
  if (links.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {links.map((item) => (
        <a
          key={item.label}
          href={item.href ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--brand-line)] bg-[var(--brand-bg)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--brand-text)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
        >
          <item.icon className="h-3.5 w-3.5" />
          {item.label}
        </a>
      ))}
    </div>
  );
}

function UnavailablePage({
  establishment,
  branding,
  whatsappUrl,
  reason,
}: {
  establishment: {
    name: string;
    slug: string;
    phone: string;
    logoUrl: string | null;
  };
  branding: BrandingView;
  whatsappUrl: string | null;
  reason: string;
}) {
  return (
    <div
      className="flex min-h-screen flex-col bg-[var(--brand-bg)] text-[var(--brand-text)]"
      style={
        {
          ...brandingCssVars(branding),
          fontFamily: "var(--brand-font)",
        } as React.CSSProperties
      }
    >
      <header className="border-b border-[var(--brand-line)]">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-6">
          <Link href={`/agendar/${establishment.slug}`} className="flex items-center gap-3">
            {establishment.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={establishment.logoUrl}
                alt=""
                className="h-10 w-10 rounded-[var(--brand-radius)] border border-[var(--brand-line)] object-cover"
              />
            ) : (
              <span className="grid h-10 w-10 place-items-center rounded-[var(--brand-radius)] bg-[var(--brand-button)] text-xs font-bold text-[var(--brand-button-text)]">
                {establishment.name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="font-display text-base font-semibold">{establishment.name}</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-[calc(var(--brand-radius)*1.5)] border border-[var(--brand-line)] bg-[var(--brand-surface)]">
          <CalendarDays className="h-6 w-6 text-[var(--brand)]" />
        </span>
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-[-0.03em]">
          Agenda temporariamente indisponível
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--muted)]">
          A página online de <strong className="text-[var(--brand-text)]">{establishment.name}</strong>{" "}
          não está aceitando novos agendamentos neste momento. {reason}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonTenant}
            >
              <MessageCircle className="h-4 w-4" /> Chamar no WhatsApp
            </a>
          )}
          <a href={`tel:${establishment.phone}`} className={buttonTenantOutline}>
            <Phone className="h-4 w-4" /> {formatPhone(establishment.phone)}
          </a>
        </div>
        <Link
          href="/agendar"
          className="mt-8 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--brand)]"
        >
          Ver outras agendas online <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </main>
    </div>
  );
}

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const establishment = await prisma.establishment.findFirst({
    where: { slug, archivedAt: null },
    include: {
      branding: true,
      subscription: { select: SUBSCRIPTION_SELECT },
      businessHours: { orderBy: { weekday: "asc" } },
      services: {
        where: { active: true, onlineEnabled: true, deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: { professionals: { select: { professionalId: true } } },
      },
      professionals: {
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: { services: { select: { serviceId: true } } },
      },
    },
  });

  if (!establishment) notFound();

  const branding = resolveBranding(establishment.branding, establishment.brandColor);
  const whatsappUrl = buildWhatsAppLink(
    establishment.whatsapp,
    customerContactMessage(establishment.name),
  );

  if (
    establishment.status !== "ACTIVE" ||
    !establishment.publicPageEnabled ||
    !isSubscriptionUsable(establishment.subscription)
  ) {
    const reason =
      establishment.status !== "ACTIVE"
        ? "O estabelecimento está com a agenda suspensa."
        : !establishment.publicPageEnabled
          ? "O estabelecimento desativou a página de agendamento."
          : `${subscriptionBlockedMessage(establishment.subscription)} Fale diretamente com o estabelecimento para mais informações.`;
    return (
      <UnavailablePage
        establishment={establishment}
        branding={branding}
        whatsappUrl={whatsappUrl}
        reason={reason}
      />
    );
  }

  const services: PublicService[] = establishment.services
    .map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      category: service.category,
      price: toNumber(service.price),
      durationMin: service.durationMin,
      bufferMin: service.bufferMin,
      imageUrl: service.imageUrl,
      professionalIds: service.professionals.map((item) => item.professionalId),
    }))
    .filter((service) => service.professionalIds.length > 0);

  const serviceIds = new Set(services.map((service) => service.id));
  const professionals: PublicProfessional[] = establishment.professionals
    .filter((professional) =>
      professional.services.some((link) => serviceIds.has(link.serviceId)),
    )
    .map((professional) => ({
      id: professional.id,
      name: professional.name,
      bio: professional.bio,
      photoUrl: professional.photoUrl,
      specialties: professional.specialties,
    }));

  const timezone = establishment.timezone;
  const today = todayInZone(timezone);
  const hoursByWeekday = new Map(
    establishment.businessHours.map((hours) => [hours.weekday, hours]),
  );
  const dates: DateOption[] = [];
  const limit = Math.max(1, Math.min(establishment.maxAdvanceDays, 90));
  for (let offset = 0; offset < limit && dates.length < 45; offset += 1) {
    const value = addDaysToDate(today, offset);
    const weekday = getWeekday(value);
    const hours = hoursByWeekday.get(weekday);
    if (!hours?.isOpen) continue;
    const [, month, day] = value.split("-");
    const info = WEEKDAYS[weekday];
    dates.push({
      value,
      weekday: info.short,
      day,
      month,
      isToday: offset === 0,
    });
  }

  const openHours = establishment.businessHours
    .filter((hours) => hours.isOpen)
    .map((hours) => ({
      weekday: hours.weekday,
      day: WEEKDAYS[hours.weekday].short,
      time: `${minutesToTime(hours.openMinute)}–${minutesToTime(hours.closeMinute)}`,
      breakTime:
        hours.breakStartMinute != null && hours.breakEndMinute != null
          ? `${minutesToTime(hours.breakStartMinute)}–${minutesToTime(hours.breakEndMinute)}`
          : null,
    }));

  const address = establishment.address?.trim() || null;
  const showServices = branding.showServices && services.length > 0;
  const showTeam = branding.showTeam && professionals.length > 0;
  const showGallery = branding.showGallery && branding.gallery.length > 0;
  const showHours = branding.showHours && openHours.length > 0;
  const showAddress = branding.showAddress && Boolean(address);
  const showInfo = showHours || showAddress || Boolean(establishment.cancellationPolicy);

  const navItems = [
    { href: "#inicio", label: "Início", show: true },
    { href: "#agendar", label: "Agendar", show: true },
    { href: "#servicos", label: "Serviços", show: showServices },
    { href: "#equipe", label: "Equipe", show: showTeam },
    { href: "#galeria", label: "Galeria", show: showGallery },
    { href: "#informacoes", label: "Contato", show: showInfo },
  ].filter((item) => item.show);

  return (
    <div
      className="min-h-screen bg-[var(--brand-bg)] text-[var(--brand-text)]"
      style={
        {
          ...brandingCssVars(branding),
          fontFamily: "var(--brand-font)",
        } as React.CSSProperties
      }
    >
      <header className="sticky top-0 z-40 border-b border-[var(--brand-line)] bg-[var(--brand-bg)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href={`/agendar/${establishment.slug}`}
            className="flex min-w-0 items-center gap-3"
          >
            {establishment.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={establishment.logoUrl}
                alt=""
                className="h-10 w-10 shrink-0 rounded-[var(--brand-radius)] border border-[var(--brand-line)] object-cover"
              />
            ) : (
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--brand-radius)] bg-[var(--brand-button)] text-xs font-bold text-[var(--brand-button-text)]">
                {establishment.name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate font-display text-[15px] font-semibold leading-tight">
                {establishment.name}
              </span>
              <span className="mt-0.5 block truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                {establishment.segment}
              </span>
            </span>
          </Link>

          <nav aria-label="Seções da página" className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="border-b border-transparent py-1.5 text-[13px] font-medium text-[var(--muted)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand-text)]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <a
              href="#agendar"
              className={`${buttonTenant} hidden h-10 px-4 text-[13px] sm:inline-flex`}
            >
              Agendar <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <PublicPageMenu
              items={navItems}
              establishmentName={establishment.name}
              brandingStyle={brandingCssVars(branding) as React.CSSProperties}
            />
          </div>
        </div>
      </header>

      <main>
        <section
          id="inicio"
          className="border-b border-[var(--brand-line)] bg-[var(--brand-bg)]"
        >
          <figure className="border-b border-[var(--brand-line)] bg-[var(--brand-surface)]">
            {branding.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding.coverUrl}
                alt={`Ambiente de ${establishment.name}`}
                className="h-[220px] w-full object-cover object-center sm:h-[340px] lg:h-[420px]"
              />
            ) : (
              <div className="flex h-[220px] w-full flex-col items-center justify-center gap-4 px-6 text-center sm:h-[300px]">
                {establishment.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={establishment.logoUrl}
                    alt=""
                    className="h-20 w-20 rounded-[calc(var(--brand-radius)*2)] border border-[var(--brand-line)] object-cover"
                  />
                ) : (
                  <span className="grid h-20 w-20 place-items-center rounded-full bg-[var(--brand)] text-2xl font-bold text-[var(--brand-button-text)]">
                    {establishment.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <p className="max-w-[26ch] text-sm font-medium leading-relaxed text-[var(--muted)]">
                  {branding.tagline ?? establishment.segment}
                </p>
              </div>
            )}
            <figcaption className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-5 gap-y-2 border-t border-[var(--brand-line)] bg-[var(--brand-bg)] px-4 py-3 text-[11px] text-[var(--muted)] sm:px-6">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 text-[var(--brand)]" />
                {services.length} serviço(s) · {professionals.length} profissional(is)
              </span>
              {showAddress ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[var(--brand)]" />
                  {address}
                </span>
              ) : (
                openHours[0] && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5 text-[var(--brand)]" />
                    {openHours[0].day} · {openHours[0].time}
                  </span>
                )
              )}
            </figcaption>
          </figure>

          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] lg:items-start lg:gap-14">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-[var(--brand)]" aria-hidden />
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  {branding.tagline ?? establishment.segment}
                </span>
              </div>

              <h1 className="mt-5 max-w-[15ch] font-display text-[clamp(2.6rem,7vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.045em]">
                {establishment.name}
              </h1>

              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-[var(--muted)]">
                {establishment.description ??
                  "Escolha o serviço, o profissional e o melhor horário para você. A confirmação é feita pelo estabelecimento."}
              </p>

              <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                <a href="#agendar" className={buttonTenant}>
                  <CalendarDays className="h-4 w-4" />
                  Agendar horário
                </a>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-medium text-[var(--muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[var(--brand)]" />
                  Horários confirmados pelo estabelecimento
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-[var(--brand)]" />
                  Reserva online
                </span>
              </div>

              <div className="mt-6">
                <SocialLinks branding={branding} />
              </div>
            </div>

            {services[0] && (
              <aside className="rounded-[calc(var(--brand-radius)*1.4)] border border-[var(--brand-line)] bg-[var(--brand-bg)] lg:mt-2">
                <div className="border-b border-[var(--brand-line)] bg-[var(--brand-surface)]/60 px-5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    Serviço em destaque
                  </p>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    {services[0].imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={services[0].imageUrl}
                        alt=""
                        className="h-16 w-16 shrink-0 rounded-[var(--brand-radius)] border border-[var(--brand-line)] object-cover"
                      />
                    ) : (
                      <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[var(--brand-radius)] bg-[var(--brand-surface)] text-[var(--brand)]">
                        <Scissors className="h-6 w-6" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold">{services[0].name}</p>
                      <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                        {services[0].category ? `${services[0].category} · ` : ""}
                        {formatDuration(services[0].durationMin)}
                      </p>
                      <p className="mt-1 font-mono text-base font-semibold">
                        {formatCurrency(services[0].price)}
                      </p>
                    </div>
                  </div>
                  <a href="#agendar" className={`${buttonTenant} mt-5 w-full justify-center`}>
                    Reservar <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                  <p className="mt-3 text-center text-[10px] leading-relaxed text-[var(--muted)]">
                    Pagamento no estabelecimento.
                  </p>
                </div>
              </aside>
            )}
          </div>
        </section>

        <section
          className="scroll-mt-20 border-b border-[var(--brand-line)] bg-[var(--brand-bg)]"
          id="agendar"
        >
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--brand-line)] pb-6">
              <div>
                <div className="flex items-center gap-3">
                  <span className="h-px w-6 bg-[var(--brand)]" aria-hidden />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Reserva online
                  </span>
                </div>
                <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                  Escolha seu horário
                </h2>
              </div>
              <p className="text-[11px] text-[var(--muted)]">
                Fuso horário: {timezone.replace("_", " ")}
              </p>
            </div>

            <div className="mt-6">
              {dates.length === 0 ? (
                <div className="rounded-[calc(var(--brand-radius)*1.4)] border border-[var(--brand-line)] bg-[var(--brand-bg)] p-10 text-center">
                  <CalendarDays className="mx-auto h-6 w-6 text-[var(--brand)]" />
                  <p className="mt-3 font-semibold">Nenhum dia aberto para agendamento.</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Fale com o estabelecimento para verificar os horários disponíveis.
                  </p>
                </div>
              ) : (
                <BookingWizard
                  slug={establishment.slug}
                  timezone={timezone}
                  services={services}
                  professionals={professionals}
                  dates={dates}
                  whatsappUrl={whatsappUrl}
                />
              )}
            </div>
          </div>
        </section>

        {showServices && (
          <section
            id="servicos"
            className="scroll-mt-20 border-b border-[var(--brand-line)] bg-[var(--brand-surface)]"
          >
            <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="h-px w-6 bg-[var(--brand)]" aria-hidden />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                      Serviços
                    </span>
                  </div>
                  <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                    O que você pode agendar
                  </h2>
                </div>
                <p className="text-[11px] font-medium text-[var(--muted)]">
                  {services.length} serviço(s) disponível(is)
                </p>
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <article
                    key={service.id}
                    className="group flex flex-col overflow-hidden rounded-[calc(var(--brand-radius)*1.4)] border border-[var(--brand-line)] bg-[var(--brand-bg)] transition duration-200 hover:border-[var(--brand)]/50 hover:shadow-[0_18px_40px_-32px_rgba(11,11,11,0.35)]"
                  >
                    {service.imageUrl && (
                      <div className="overflow-hidden border-b border-[var(--brand-line)] bg-[var(--brand-surface)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={service.imageUrl}
                          alt=""
                          loading="lazy"
                          className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
                            {service.category ?? "Serviço"}
                          </p>
                          <h3 className="mt-1 text-[15px] font-semibold leading-snug">
                            {service.name}
                          </h3>
                        </div>
                        <p className="shrink-0 font-mono text-[15px] font-semibold">
                          {formatCurrency(service.price)}
                        </p>
                      </div>
                      {service.description && (
                        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[var(--muted)]">
                          {service.description}
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--brand-line)] pt-3">
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                          <Clock3 className="h-3.5 w-3.5" />
                          {formatDuration(service.durationMin)}
                        </span>
                        <a
                          href="#agendar"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--brand-text)] transition hover:text-[var(--brand)]"
                        >
                          Reservar <ArrowRight className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {showTeam && (
          <section id="equipe" className="scroll-mt-20 border-b border-[var(--brand-line)]">
            <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
              <div className="flex items-center gap-3">
                <span className="h-px w-6 bg-[var(--brand)]" aria-hidden />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Equipe
                </span>
              </div>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                Quem atende você
              </h2>

              <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {professionals.map((professional) => (
                  <article
                    key={professional.id}
                    className="flex items-start gap-4 rounded-[calc(var(--brand-radius)*1.4)] border border-[var(--brand-line)] bg-[var(--brand-bg)] p-5"
                  >
                    {professional.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={professional.photoUrl}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-full border border-[var(--brand-line)] object-cover"
                      />
                    ) : (
                      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--brand-surface)] text-sm font-semibold text-[var(--brand)]">
                        {professional.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-semibold leading-snug">
                        {professional.name}
                      </h3>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
                        {professional.specialties ?? "Profissional"}
                      </p>
                      {professional.bio && (
                        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[var(--muted)]">
                          {professional.bio}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {showGallery && (
          <section
            id="galeria"
            className="scroll-mt-20 border-b border-[var(--brand-line)] bg-[var(--brand-surface)]"
          >
            <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
              <div className="flex items-center gap-3">
                <span className="h-px w-6 bg-[var(--brand)]" aria-hidden />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Galeria
                </span>
              </div>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                Um pouco do nosso espaço
              </h2>
              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {branding.gallery.map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    className="overflow-hidden rounded-[calc(var(--brand-radius)*1.2)] border border-[var(--brand-line)] bg-[var(--brand-bg)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Foto ${index + 1} de ${establishment.name}`}
                      className="aspect-[4/3] w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {showInfo && (
          <section id="informacoes" className="scroll-mt-20">
            <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
              <div className="flex items-center gap-3">
                <span className="h-px w-6 bg-[var(--brand)]" aria-hidden />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Informações
                </span>
              </div>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                Antes de sua visita
              </h2>

              <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {showHours && (
                  <InfoCard
                    icon={<Clock3 className="h-4 w-4" />}
                    title="Horários de funcionamento"
                  >
                    <dl className="divide-y divide-[var(--brand-line)]">
                      {openHours.map((item) => (
                        <div
                          key={item.weekday}
                          className="flex items-baseline justify-between gap-4 py-2 first:pt-0 last:pb-0"
                        >
                          <dt className="font-semibold text-[var(--brand-text)]">{item.day}</dt>
                          <dd className="text-right">
                            <span className="font-mono text-[11px]">{item.time}</span>
                            {item.breakTime && (
                              <span className="block text-[10px] text-[var(--muted)]">
                                Pausa {item.breakTime}
                              </span>
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </InfoCard>
                )}

                {showAddress && (
                  <InfoCard icon={<MapPin className="h-4 w-4" />} title="Onde estamos">
                    <p>{address}</p>
                  </InfoCard>
                )}

                <InfoCard icon={<Phone className="h-4 w-4" />} title="Contato">
                  <a
                    href={`tel:${establishment.phone}`}
                    className="flex items-center justify-between gap-3 rounded-[var(--brand-radius)] border border-[var(--brand-line)] px-3 py-2 font-medium text-[var(--brand-text)] transition hover:border-[var(--brand)]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-[var(--brand)]" />
                      {formatPhone(establishment.phone)}
                    </span>
                    <ArrowRight className="h-3 w-3 text-[var(--muted)]" />
                  </a>
                </InfoCard>

                {establishment.cancellationPolicy && (
                  <InfoCard icon={<ShieldCheck className="h-4 w-4" />} title="Política de cancelamento">
                    <p>{establishment.cancellationPolicy}</p>
                  </InfoCard>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-[var(--brand-line)] bg-[var(--brand-surface)]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-sm">
              <Link
                href={`/agendar/${establishment.slug}`}
                className="inline-flex items-center gap-2.5"
              >
                {establishment.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={establishment.logoUrl}
                    alt=""
                    className="h-8 w-8 rounded-[var(--brand-radius)] border border-[var(--brand-line)] object-cover"
                  />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-[var(--brand-radius)] bg-[var(--brand-button)] text-[10px] font-bold text-[var(--brand-button-text)]">
                    {establishment.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="font-display text-sm font-semibold">{establishment.name}</span>
              </Link>
              <p className="mt-3 text-[11px] leading-relaxed text-[var(--muted)]">
                Agenda operada pelo estabelecimento. Os agendamentos estão sujeitos à
                confirmação da equipe.
              </p>
              <div className="mt-4">
                <SocialLinks branding={branding} />
              </div>
            </div>

            <nav
              aria-label="Links da página"
              className="grid grid-cols-2 gap-x-10 gap-y-2.5 text-[11px]"
            >
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-[var(--muted)] transition hover:text-[var(--brand)]"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-[var(--brand-line)] pt-5 text-[10px] text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
            <p>
              Agendamento online com{" "}
              <Link href="/" className="font-semibold text-[var(--brand-text)] hover:text-[var(--brand)]">
                AgendamentoON
              </Link>
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/privacidade" className="hover:text-[var(--brand)]">
                Privacidade
              </Link>
              <Link href="/termos" className="hover:text-[var(--brand)]">
                Termos
              </Link>
              <Link href="/agendar" className="hover:text-[var(--brand)]">
                Outras agendas
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[calc(var(--brand-radius)*1.4)] border border-[var(--brand-line)] bg-[var(--brand-bg)] p-5 sm:p-6">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--brand-radius)] bg-[var(--brand-surface)] text-[var(--brand)]">
          {icon}
        </span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="mt-3 text-xs leading-relaxed text-[var(--muted)]">{children}</div>
    </div>
  );
}
