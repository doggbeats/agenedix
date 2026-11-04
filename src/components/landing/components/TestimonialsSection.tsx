import React from "react";
import { Check } from "lucide-react";
import { SCENARIOS } from "../data/mockData";

export const TestimonialsSection: React.FC = () => {
  return (
    <section id="cenarios" className="border-b border-line py-20 sm:py-28">
      <div className="container-page">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow">Em operação</p>
            <h2 className="display-title mt-4 text-3xl text-ink sm:text-4xl lg:text-[44px]">
              Rotinas diferentes, a mesma lógica.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              Estes são cenários de configuração, não depoimentos. Cada negócio ajusta
              serviços, jornada e regras de acordo com o próprio atendimento.
            </p>
          </div>
          <p className="max-w-xs text-[11px] leading-relaxed text-muted lg:text-right">
            Exemplos ilustrativos montados a partir dos recursos disponíveis no painel.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {SCENARIOS.map((scenario, index) => (
            <article
              key={scenario.id}
              className="flex flex-col rounded-xl border border-line bg-white p-6 transition-colors hover:border-slate-300"
            >
              <div className="flex items-center gap-3 border-b border-line pb-4">
                <span className="font-mono text-[11px] font-medium text-brand">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                  {scenario.segment}
                </span>
              </div>

              <h3 className="mt-5 font-display text-lg font-semibold leading-snug tracking-tight text-ink">
                {scenario.title}
              </h3>
              <p className="mt-3 flex-1 text-[13px] leading-relaxed text-muted">
                {scenario.description}
              </p>

              <ul className="mt-5 space-y-2.5 border-t border-line pt-5">
                {scenario.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 text-[12.5px] text-slate-700">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
                    <span className="leading-snug">{bullet}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
