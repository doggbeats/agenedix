import React from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Globe2,
  Palette,
  Scissors,
  Users,
} from "lucide-react";

interface FeaturesGridProps {
  onOpenBookingDemo: () => void;
}

const features = [
  {
    icon: Globe2,
    title: "Página pública com a sua marca",
    description:
      "Link próprio, logo, capa, cores e seções que você escolhe. O cliente agenda sem criar conta.",
  },
  {
    icon: CalendarClock,
    title: "Disponibilidade calculada de verdade",
    description:
      "Funcionamento, jornada, pausas, bloqueios, exceções e duração dos serviços entram na conta.",
  },
  {
    icon: Scissors,
    title: "Serviços ligados à equipe",
    description:
      "Defina preço, duração, intervalo e quais profissionais executam cada serviço.",
  },
  {
    icon: Users,
    title: "Acesso por papel",
    description:
      "Proprietário, administrador e profissional enxergam apenas o que precisam para trabalhar.",
  },
  {
    icon: BarChart3,
    title: "Relatórios do período",
    description:
      "Receita, volume, distribuição por serviço e exportação em CSV para fechar o mês.",
  },
  {
    icon: Palette,
    title: "Personalização com prévia",
    description:
      "Ajuste a aparência da página pública e veja o resultado antes de aplicar.",
  },
];

export const FeaturesGrid: React.FC<FeaturesGridProps> = ({ onOpenBookingDemo }) => {
  return (
    <section id="recursos" className="border-b border-line py-20 sm:py-28">
      <div className="container-page">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow">Recursos</p>
            <h2 className="display-title mt-4 text-3xl text-ink sm:text-4xl lg:text-[44px]">
              O essencial para a agenda funcionar.
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
              Sem recurso de vitrine. O AgendamentoON cobre a operação de quem atende com
              hora marcada: agenda, equipe, serviços, página pública e relatórios.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenBookingDemo}
            className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-brand transition hover:text-brand-hover lg:self-end"
          >
            Ver uma agenda de exemplo <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="group bg-white p-6 transition-colors hover:bg-surface sm:p-7">
              <span className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-white text-ink transition-colors group-hover:border-brand/30 group-hover:text-brand">
                <feature.icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <h3 className="mt-5 text-[15px] font-semibold tracking-tight text-ink">
                {feature.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid items-center gap-10 rounded-2xl border border-line bg-surface p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div>
            <p className="eyebrow">Página pública</p>
            <h3 className="display-title mt-4 text-2xl text-ink sm:text-3xl">
              Uma página, não um formulário.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              O cliente chega pelo link da bio, escolhe o serviço e vê apenas os horários
              que realmente estão livres. A confirmação traz protocolo e um link para
              consultar ou cancelar.
            </p>
            <ul className="mt-6 space-y-3 text-[13px] text-slate-700">
              {[
                "Serviços, equipe, horários, endereço e política de cancelamento",
                "Reserva em etapas com disponibilidade validada no servidor",
                "Seções condicionais: você mostra só o que faz sentido",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand" />
                  {item}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onOpenBookingDemo}
              className="mt-7 inline-flex items-center gap-2 rounded-[10px] border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-slate-300"
            >
              Explorar a página de exemplo <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-line bg-white shadow-[0_24px_60px_-45px_rgba(11,18,32,0.35)]">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-ink text-[9px] font-bold text-white">
                  BN
                </span>
                <div>
                  <p className="text-[11px] font-semibold text-ink">Barbearia Nobre</p>
                  <p className="text-[9px] uppercase tracking-wide text-slate-400">
                    Barbearia · São Paulo
                  </p>
                </div>
              </div>
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
                Aberto
              </span>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
                  1. Escolha o serviço
                </p>
                {[
                  { name: "Corte masculino", meta: "40 min · R$ 60" },
                  { name: "Corte + barba", meta: "70 min · R$ 95" },
                  { name: "Barba completa", meta: "30 min · R$ 45" },
                ].map((service, index) => (
                  <div
                    key={service.name}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${
                      index === 0 ? "border-brand bg-brand/5" : "border-line bg-white"
                    }`}
                  >
                    <div>
                      <p className="text-[11px] font-semibold text-ink">{service.name}</p>
                      <p className="text-[9px] text-muted">{service.meta}</p>
                    </div>
                    <span
                      className={`h-3.5 w-3.5 rounded-full border ${
                        index === 0 ? "border-brand bg-brand" : "border-slate-300"
                      }`}
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
                  2. Escolha o horário
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {["09:00", "09:40", "10:20", "11:00", "13:30", "15:00"].map((time, index) => (
                    <span
                      key={time}
                      className={`rounded-md border py-1.5 text-center font-mono text-[10px] ${
                        index === 3
                          ? "border-ink bg-ink text-white"
                          : "border-line bg-white text-slate-600"
                      }`}
                    >
                      {time}
                    </span>
                  ))}
                </div>
                <div className="mt-3 rounded-lg border border-line bg-surface p-2.5">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
                    Resumo
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-ink">Corte masculino</p>
                  <p className="text-[10px] text-muted">Hoje, 11:00 · com Rafael</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
