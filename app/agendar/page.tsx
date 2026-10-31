import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { ArrowRight, CalendarDays, MapPin, Scissors, Search, UserRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { isSubscriptionUsable } from "@/lib/subscription";
import { PublicFooter, PublicHeader } from "@/components/public/PublicChrome";
import { buttonBrand, buttonSecondary, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agendas online",
  description:
    "Encontre barbearias, salões, estúdios e outros negócios com agendamento online.",
};

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";

  const where: Prisma.EstablishmentWhereInput = {
    archivedAt: null,
    status: "ACTIVE",
    publicPageEnabled: true,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { segment: { contains: q, mode: "insensitive" as const } },
            { address: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const establishments = await prisma.establishment.findMany({
    where,
    include: {
      subscription: {
        select: {
          status: true,
          trialEndsAt: true,
          currentPeriodEnd: true,
          toleranceDays: true,
        },
      },
      branding: { select: { tagline: true, coverUrl: true } },
      _count: {
        select: {
          professionals: { where: { active: true } },
          services: { where: { active: true, onlineEnabled: true, deletedAt: null } },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 60,
  });

  const visible = establishments.filter((item) => isSubscriptionUsable(item.subscription));

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <PublicHeader />

      <main className="flex-1">
        <section className="border-b border-line bg-white">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-hover">
              Diretório
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              Agendas online.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
              Escolha um estabelecimento, veja os serviços e reserve o melhor horário. Só
              aparecem aqui páginas com agendamento liberado.
            </p>

            <form
              method="get"
              action="/agendar"
              className="mt-7 flex max-w-xl flex-col gap-2 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Buscar por nome, segmento ou endereço"
                  aria-label="Buscar estabelecimento"
                  className="w-full rounded-lg border border-line bg-white py-3 pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-slate-500 focus:border-brand focus:ring-2 focus:ring-brand/15"
                />
              </div>
              <button type="submit" className={buttonBrand}>
                Buscar
              </button>
              {q && (
                <Link href="/agendar" className={buttonSecondary}>
                  Limpar
                </Link>
              )}
            </form>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-12">
          {visible.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-5 w-5" />}
              title={q ? "Nenhuma agenda encontrada" : "Nenhuma agenda publicada"}
              description={
                q
                  ? "Tente outro nome, segmento ou endereço."
                  : "Quando um estabelecimento publicar a página, ele aparece aqui."
              }
              action={
                <Link href="/cadastro" className={buttonBrand}>
                  Cadastrar meu negócio <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />
          ) : (
            <>
              <p className="mb-4 text-xs font-medium text-slate-500">
                {visible.length} agenda(s) disponível(is)
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((item) => {
                  const cover = item.branding?.coverUrl;
                  return (
                    <article
                      key={item.id}
                      className="surface-hover flex flex-col overflow-hidden rounded-xl border border-line bg-white"
                    >
                      <div className="relative h-24 bg-ink">
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cover}
                            alt=""
                            className="h-full w-full object-cover opacity-80"
                          />
                        ) : (
                          <div className="paper-grid h-full w-full opacity-20" aria-hidden />
                        )}
                        <span className="absolute bottom-3 left-4 grid h-11 w-11 place-items-center rounded-lg border border-white/20 bg-white text-sm font-semibold text-ink">
                          {item.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.logoUrl}
                              alt=""
                              className="h-full w-full rounded-lg object-cover"
                            />
                          ) : (
                            item.name.slice(0, 2).toUpperCase()
                          )}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-hover">
                          {item.segment}
                        </p>
                        <h2 className="mt-1 text-base font-semibold text-ink">{item.name}</h2>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">
                          {item.branding?.tagline ??
                            item.description ??
                            "Agende seu horário online."}
                        </p>
                        {item.address && (
                          <p className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-500">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span className="line-clamp-2">{item.address}</span>
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <UserRound className="h-3.5 w-3.5" />
                            {item._count.professionals} profissional(is)
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Scissors className="h-3.5 w-3.5" />
                            {item._count.services} serviço(s)
                          </span>
                        </div>
                        <Link
                          href={`/agendar/${item.slug}`}
                          className={`${buttonBrand} mt-4 w-full`}
                        >
                          Agendar horário <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
