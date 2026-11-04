import React, { useState } from "react";
import { ArrowRight, Dumbbell, Scissors, Smile, Sparkles } from "lucide-react";
import { BUSINESS_NICHES } from "../data/mockData";

interface NicheShowcaseProps {
  onOpenSignup: () => void;
}

const icons = {
  barbearia: Scissors,
  estetica: Sparkles,
  psicologia: Smile,
  studio: Dumbbell,
} as const;

const details: Record<string, string[]> = {
  barbearia: [
    "Agenda individual por barbeiro",
    "Serviços com duração e preço próprios",
    "Link para bio do Instagram e WhatsApp",
  ],
  estetica: [
    "Intervalo entre procedimentos",
    "Histórico do cliente no painel",
    "Política de cancelamento visível na página",
  ],
  psicologia: [
    "Sessões presenciais e online",
    "Jornada separada por profissional",
    "Página discreta, com apenas o necessário",
  ],
  studio: [
    "Turmas e atendimentos individuais",
    "Pausas e jornada por instrutor",
    "Relatórios de ocupação e faturamento",
  ],
};

export const NicheShowcase: React.FC<NicheShowcaseProps> = ({ onOpenSignup }) => {
  const [activeId, setActiveId] = useState(BUSINESS_NICHES[0].id);
  const niche = BUSINESS_NICHES.find((item) => item.id === activeId) ?? BUSINESS_NICHES[0];
  const Icon = icons[niche.id as keyof typeof icons] ?? Scissors;

  return (
    <section id="segmentos" className="border-b border-line bg-surface py-20 sm:py-28">
      <div className="container-page">
        <div className="max-w-2xl">
          <p className="eyebrow">Segmentos</p>
          <h2 className="display-title mt-4 text-3xl text-ink sm:text-4xl lg:text-[44px]">
            Um sistema, rotinas diferentes.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            Duração de serviço, jornada da equipe e o que aparece na página mudam conforme
            o negócio. A base é a mesma.
          </p>
        </div>

        <div className="mt-10 overflow-x-auto border-b border-line scrollbar-none">
          <div className="flex min-w-max gap-6" role="tablist" aria-label="Segmentos">
            {BUSINESS_NICHES.map((item) => {
              const TabIcon = icons[item.id as keyof typeof icons] ?? Scissors;
              const active = item.id === activeId;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveId(item.id)}
                  className={`relative flex items-center gap-2 pb-3.5 text-[13px] font-semibold transition-colors ${
                    active ? "text-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  <TabIcon className="h-4 w-4" aria-hidden />
                  {item.label}
                  <span
                    className={`absolute inset-x-0 -bottom-px h-0.5 transition-colors ${
                      active ? "bg-brand" : "bg-transparent"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              <Icon className="h-3.5 w-3.5 text-brand" aria-hidden />
              {niche.name}
            </span>
            <h3 className="display-title mt-4 text-2xl text-ink sm:text-3xl">{niche.tagline}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">{niche.description}</p>

            <ul className="mt-6 space-y-3">
              {details[niche.id].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[13px] text-slate-700">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand" />
                  {item}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={onOpenSignup}
              className="mt-7 inline-flex items-center gap-2 rounded-[10px] bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1b2638]"
            >
              Começar com esse formato <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-line bg-white shadow-[0_24px_60px_-48px_rgba(11,18,32,0.35)]">
            <div className="flex items-center justify-between border-b border-line p-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink text-[10px] font-bold text-white">
                  {niche.professionals[0].initials}
                </span>
                <div>
                  <p className="text-[12px] font-semibold text-ink">{niche.name}</p>
                  <p className="text-[10px] text-muted">
                    {niche.professionals.length} profissionais · {niche.services.length} serviços
                  </p>
                </div>
              </div>
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
                Aberto
              </span>
            </div>

            <div className="p-4 sm:p-5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
                Serviços em destaque
              </p>
              <div className="mt-2 space-y-1.5">
                {niche.services.slice(0, 3).map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5"
                  >
                    <div>
                      <p className="text-[11px] font-semibold text-ink">{service.title}</p>
                      <p className="text-[9px] text-muted">
                        {service.duration} · {service.price}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-brand">Agendar</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg border border-line bg-surface p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
                    Próximo horário livre
                  </p>
                  <p className="font-mono text-[11px] font-semibold text-ink">15:00</p>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {["09:00", "10:20", "11:00", "15:00"].map((time, index) => (
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
