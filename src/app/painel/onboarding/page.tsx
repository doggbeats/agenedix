import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Circle,
  Clock3,
  ExternalLink,
  Palette,
  Scissors,
  Sparkles,
  UserRound,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/auth/session";
import { resolveBranding } from "@/lib/branding";
import { buttonSecondary, PageHeader, StatCard } from "@/components/ui";
import { OnboardingForm } from "@/components/panel/OnboardingForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Primeiros passos" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ "boas-vindas"?: string }>;
}) {
  const auth = await requireManager();
  const params = await searchParams;
  const establishment = auth.establishment;

  const [services, professionals, openHours, branding, appointments] = await Promise.all([
    prisma.service.count({
      where: { establishmentId: establishment.id, deletedAt: null },
    }),
    prisma.professional.count({
      where: { establishmentId: establishment.id, active: true },
    }),
    prisma.businessHours.count({
      where: { establishmentId: establishment.id, isOpen: true },
    }),
    prisma.tenantBranding.findUnique({
      where: { establishmentId: establishment.id },
    }),
    prisma.appointment.count({
      where: { establishmentId: establishment.id },
    }),
  ]);

  const view = resolveBranding(branding, establishment.brandColor);
  const brandingReady = Boolean(
    view.tagline ||
      view.coverUrl ||
      view.gallery.length > 0 ||
      view.instagram ||
      view.facebook ||
      view.website,
  );

  const steps = [
    {
      key: "conta",
      title: "Conta criada",
      description: "Seu estabelecimento já tem painel, página pública e período de teste.",
      done: true,
      href: "/painel",
      action: "Ver painel",
      icon: Sparkles,
    },
    {
      key: "servicos",
      title: "Cadastre seus serviços",
      description:
        "Nome, preço, duração e quais profissionais atendem cada serviço. Só serviços ativos aparecem na página pública.",
      done: services > 0,
      href: "/painel/servicos",
      action: services > 0 ? "Revisar serviços" : "Cadastrar serviço",
      icon: Scissors,
    },
    {
      key: "profissionais",
      title: "Adicione a equipe",
      description:
        "Cada profissional precisa de uma escala de atendimento. Você pode convidar a pessoa para acessar o painel depois.",
      done: professionals > 0,
      href: "/painel/profissionais",
      action: professionals > 0 ? "Revisar equipe" : "Cadastrar profissional",
      icon: UserRound,
    },
    {
      key: "horarios",
      title: "Confirme os horários",
      description:
        "Defina os dias e horários de funcionamento. Pausas e exceções também bloqueiam a agenda automaticamente.",
      done: openHours > 0,
      href: "/painel/configuracoes#horarios",
      action: "Ajustar horários",
      icon: Clock3,
    },
    {
      key: "identidade",
      title: "Personalize sua página",
      description:
        "Cores, capa, galeria e redes sociais deixam a página com a cara do seu negócio.",
      done: brandingReady,
      href: "/painel/personalizar",
      action: brandingReady ? "Editar identidade" : "Personalizar página",
      icon: Palette,
    },
  ];

  const doneCount = steps.filter((step) => step.done).length;
  const ready = services > 0 && professionals > 0;

  return (
    <div>
      <PageHeader
        eyebrow="Primeiros passos"
        title={
          params["boas-vindas"]
            ? `Boas-vindas, ${auth.user.name.split(" ")[0]}!`
            : "Deixe sua agenda pronta"
        }
        description="Cinco passos rápidos para começar a receber agendamentos com a sua marca."
        actions={
          <>
            <Link href="/painel/configuracoes" className={buttonSecondary}>
              Configurações
            </Link>
            <Link
              href={`/agendar/${establishment.slug}`}
              target="_blank"
              className={buttonSecondary}
            >
              <ExternalLink className="h-4 w-4" /> Página pública
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Progresso"
          value={`${doneCount} de ${steps.length}`}
          hint={establishment.onboardingCompletedAt ? "Configuração concluída" : "Em andamento"}
          accent
        />
        <StatCard label="Serviços" value={services} hint="Cadastrados no estabelecimento" />
        <StatCard
          label="Profissionais"
          value={professionals}
          hint={appointments > 0 ? `${appointments} agendamento(s) no histórico` : "Nenhum agendamento ainda"}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <section className="rounded-xl border border-line bg-white shadow-sm">
          <div className="border-b border-line px-4 py-4 sm:px-5">
            <h2 className="text-sm font-semibold text-ink">Checklist de configuração</h2>
            <p className="text-[11px] text-slate-500">
              O progresso é salvo automaticamente conforme você cadastra os dados.
            </p>
          </div>
          <ol className="divide-y divide-line">
            {steps.map((step) => (
              <li key={step.key} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:px-5">
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                    step.done ? "bg-green-50 text-green-700" : "bg-paper text-slate-500"
                  }`}
                >
                  {step.done ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{step.title}</p>
                    {step.done && (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700 ring-1 ring-inset ring-green-200">
                        Concluído
                      </span>
                    )}
                  </div>
                  <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500">
                    {step.description}
                  </p>
                  <Link
                    href={step.href}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-brand"
                  >
                    {step.action} <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <step.icon className="hidden h-4 w-4 shrink-0 text-slate-300 sm:block" />
              </li>
            ))}
          </ol>
        </section>

        <div className="space-y-4">
          <section className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
                <CalendarCheck2 className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  {establishment.onboardingCompletedAt ? "Tudo configurado" : "Concluir configuração"}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Ao concluir, o painel deixa de exibir o lembrete de primeiros passos. Você
                  pode voltar a esta página quando quiser.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <OnboardingForm ready={ready} />
            </div>
          </section>

          <section className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-semibold text-ink">Enquanto configura</h2>
            <ul className="mt-2 space-y-2 text-xs leading-relaxed text-slate-500">
              <li>
                A página pública só mostra horários realmente livres. O servidor valida cada
                reserva antes de confirmar.
              </li>
              <li>
                Você pode criar agendamentos manualmente em{" "}
                <Link href="/painel/agendamentos?novo=1" className="font-semibold text-brand hover:underline">
                  Agendamentos
                </Link>{" "}
                enquanto a página não está pronta.
              </li>
              <li>
                Depois de configurar, compartilhe o link{" "}
                <span className="break-all font-mono text-[10px] text-slate-600">
                  /agendar/{establishment.slug}
                </span>{" "}
                com seus clientes.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
