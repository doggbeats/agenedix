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
  UserRound,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buildWhatsAppLink, customerContactMessage } from "@/lib/whatsapp";
import { formatPhone, minutesToTime, toNumber } from "@/lib/format";
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
      style={brandingCssVars(branding) as React.CSSProperties}
    >
      <header className="border-b border-[var(--brand-line)]">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-5 py-4">
          <Link href={`/agendar/${establishment.slug}`} className="flex items-center gap-2.5">
            {establishment.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={establishment.logoUrl}
                alt=""
                className="h-9 w-9 rounded-lg object-cover"
              />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--brand)] text-xs font-bold text-white">
                {establishment.name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="font-display text-base font-semibold">{establishment.name}</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-xl border border-[var(--brand-line)] bg-[var(--brand-surface)]">
          <CalendarDays className="h-6 w-6 text-[var(--brand)]" />
        </span>
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight">
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
    .map((hours) => {
      const label = WEEKDAYS[hours.weekday].short;
      const base = `${label} ${minutesToTime(hours.openMinute)}–${minutesToTime(hours.closeMinute)}`;
      const breakLabel =
        hours.breakStartMinute != null && hours.breakEndMinute != null
          ? ` (pausa ${minutesToTime(hours.breakStartMinute)}–${minutesToTime(hours.breakEndMinute)})`
          : "";
      return { weekday: hours.weekday, label: `${base}${breakLabel}` };
    });

  const address = establishment.address?.trim() || null;
  const showServices = branding.showServices && services.length > 0;
  const showTeam = branding.showTeam && professionals.length > 0;
  const showGallery = branding.showGallery && branding.gallery.length > 0;
  const showHours = branding.showHours && openHours.length > 0;
  const showAddress = branding.showAddress && Boolean(address);
  const showInfo = showHours || showAddress || Boolean(establishment.cancellationPolicy);

  const navItems = [
    { href: "#agendar", label: "Agendar", show: true },
    { href: "#servicos", label: "Serviços", show: showServices },
    { href: "#equipe", label: "Equipe", show: showTeam },
    { href: "#galeria", label: "Galeria", show: showGallery },
    { href: "#informacoes", label: "Contato", show: showInfo },
  ].filter((item) => item.show);

  return (
    <div
      className="min-h-screen bg-[var(--brand-bg)] text-[var(--brand-text)]"
      style={brandingCssVars(branding) as React.CSSProperties}
    >
      <header className="sticky top-0 z-40 border-b border-[var(--brand-line)] bg-[var(--brand-bg)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href={`/agendar/${establishment.slug}`} className="flex min-w-0 items-center gap-2.5">
            {establishment.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={establishment.logoUrl}
                alt=""
                className="h-9 w-9 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--brand)] text-xs font-bold text-white">
                {establishment.name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate font-display text-sm font-semibold">
                {establishment.name}
              </span>
              <span className="block truncate text-[10px] uppercase tracking-wide text-[var(--muted)]">
                {establishment.segment}
              </span>
            </span>
          </Link>

          <nav aria-label="Seções da página" className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-xs font-semibold text-[var(--muted)] transition hover:bg-[var(--brand-surface)] hover:text-[var(--brand-text)]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Falar com ${establishment.name} no WhatsApp`}
                className={`${buttonTenantOutline} px-3 py-2 text-xs`}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}
            <a href="#agendar" className={`${buttonTenant} px-3.5 py-2 text-xs`}>
              Agendar <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-[var(--brand-line)] bg-[var(--brand-surface)]">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--brand)]">
                {branding.tagline ?? "Agendamento online"}
              </p>
              <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                {establishment.name}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                {establishment.description ??
                  "Escolha o serviço, o profissional e o melhor horário para você."}
              </p>

              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--muted)]">
                {address && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[var(--brand)]" />
                    {address}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <UserRound className="h-3.5 w-3.5 text-[var(--brand)]" />
                  {professionals.length} profissional(is)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Scissors className="h-3.5 w-3.5 text-[var(--brand)]" />
                  {services.length} serviço(s) online
                </span>
              </div>

              <div className="mt-7 flex flex-wrap gap-2">
                <a href="#agendar" className={buttonTenant}>
                  <CalendarDays className="h-4 w-4" /> Agendar horário
                </a>
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonTenantOutline}
                  >
                    <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
                  </a>
                )}
              </div>

              <div className="mt-5">
                <SocialLinks branding={branding} />
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-2xl border border-[var(--brand-line)] bg-[var(--brand-bg)] shadow-sm">
                {branding.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={branding.coverUrl}
                    alt={`Ambiente de ${establishment.name}`}
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 bg-[var(--brand-surface)] p-6 text-center">
                    <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--brand)] text-xl font-bold text-white">
                      {establishment.name.slice(0, 2).toUpperCase()}
                    </span>
                    <p className="max-w-[220px] text-xs leading-relaxed text-[var(--muted)]">
                      {branding.tagline ?? establishment.segment}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--brand-line)] bg-[var(--brand-bg)] px-3 py-2.5 text-[11px] text-[var(--muted)]">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--brand)]" />
                Horários validados em tempo real. Confirmação pelo estabelecimento.
              </div>
            </div>
          </div>
        </section>

        <section
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-8 sm:px-6 sm:py-10"
          id="agendar"
        >
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand)]">
                Reserva online
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                Escolha seu horário
              </h2>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Fuso horário: {timezone.replace("_", " ")}
            </p>
          </div>

          {dates.length === 0 ? (
            <div className="rounded-xl border border-[var(--brand-line)] bg-[var(--brand-bg)] p-8 text-center">
              <CalendarDays className="mx-auto h-6 w-6 text-[var(--brand)]" />
              <p className="mt-3 font-semibold">Nenhum dia aberto para agendamento.</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Fale com o estabelecimento para verificar os horários disponíveis.
              </p>
            </div>
          ) : (
            <BookingWizard
              slug={establishment.slug}
              establishmentName={establishment.name}
              timezone={timezone}
              services={services}
              professionals={professionals}
              dates={dates}
              whatsappUrl={whatsappUrl}
            />
          )}
        </section>

        {showServices && (
          <section
            id="servicos"
            className="scroll-mt-20 border-y border-[var(--brand-line)] bg-[var(--brand-surface)]"
          >
            <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand)]">
                Serviços
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                O que você pode agendar
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="rounded-xl border border-[var(--brand-line)] bg-[var(--brand-bg)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{service.name}</p>
                        <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                          {service.category ?? "Serviço"} · {service.durationMin} min
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-[var(--brand)]">
                        R$ {service.price.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                    {service.description && (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">
                        {service.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {showTeam && (
          <section id="equipe" className="scroll-mt-20">
            <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand)]">
                Equipe
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                Quem atende você
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {professionals.map((professional) => (
                  <div
                    key={professional.id}
                    className="flex items-start gap-3 rounded-xl border border-[var(--brand-line)] bg-[var(--brand-bg)] p-4"
                  >
                    {professional.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={professional.photoUrl}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--brand-surface)] text-xs font-semibold text-[var(--brand)]">
                        {professional.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{professional.name}</p>
                      <p className="truncate text-[11px] text-[var(--muted)]">
                        {professional.specialties ?? "Profissional"}
                      </p>
                      {professional.bio && (
                        <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-[var(--muted)]">
                          {professional.bio}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {showGallery && (
          <section
            id="galeria"
            className="scroll-mt-20 border-y border-[var(--brand-line)] bg-[var(--brand-surface)]"
          >
            <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand)]">
                Galeria
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                Um pouco do nosso espaço
              </h2>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {branding.gallery.map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    className="overflow-hidden rounded-xl border border-[var(--brand-line)] bg-[var(--brand-bg)]"
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
            <div className="mx-auto grid max-w-6xl gap-5 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-2">
              {showHours && (
                <div className="rounded-xl border border-[var(--brand-line)] bg-[var(--brand-bg)] p-5">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-[var(--brand)]" />
                    <h2 className="text-sm font-semibold">Horários de funcionamento</h2>
                  </div>
                  <div className="mt-3 space-y-1 text-xs leading-relaxed text-[var(--muted)]">
                    {openHours.map((item) => (
                      <p key={item.weekday}>{item.label}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {showAddress && (
                  <div className="rounded-xl border border-[var(--brand-line)] bg-[var(--brand-bg)] p-5">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[var(--brand)]" />
                      <h2 className="text-sm font-semibold">Onde estamos</h2>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                      {address}
                    </p>
                  </div>
                )}

                <div className="rounded-xl border border-[var(--brand-line)] bg-[var(--brand-bg)] p-5">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[var(--brand)]" />
                    <h2 className="text-sm font-semibold">Contato</h2>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <a
                      href={`tel:${establishment.phone}`}
                      className="inline-flex items-center gap-1.5 text-[var(--muted)] transition hover:text-[var(--brand)]"
                    >
                      <Phone className="h-3.5 w-3.5" /> {formatPhone(establishment.phone)}
                    </a>
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[var(--muted)] transition hover:text-[var(--brand)]"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                {establishment.cancellationPolicy && (
                  <div className="rounded-xl border border-[var(--brand-line)] bg-[var(--brand-bg)] p-5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-[var(--brand)]" />
                      <h2 className="text-sm font-semibold">Política de cancelamento</h2>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                      {establishment.cancellationPolicy}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-[var(--brand-line)] bg-[var(--brand-surface)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-7 text-[11px] text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p>
              Agenda operada por{" "}
              <strong className="font-semibold text-[var(--brand-text)]">
                {establishment.name}
              </strong>
              . Agendamentos sujeitos à confirmação do estabelecimento.
            </p>
            <p className="mt-1">
              {branding.website ? (
                <a
                  href={branding.website}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--brand)]"
                >
                  Site oficial
                </a>
              ) : (
                "Agendamento online com AgendamentoON."
              )}
            </p>
          </div>
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
      </footer>
    </div>
  );
}
