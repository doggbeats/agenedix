import React from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { PRICING_PLANS } from "../data/mockData";
import type { PricingPlan } from "../types";

interface PricingSectionProps {
  plans?: PricingPlan[];
}

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const PricingSection: React.FC<PricingSectionProps> = ({ plans }) => {
  const catalog = plans && plans.length > 0 ? plans : PRICING_PLANS;

  return (
    <section id="planos" className="border-b border-line bg-surface py-20 sm:py-28">
      <div className="container-page">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow">Planos</p>
            <h2 className="display-title mt-4 text-3xl text-ink sm:text-4xl lg:text-[44px]">
              Preço claro, sem taxa por agendamento.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              Você paga pelo tamanho da operação, não pelo número de clientes que atende.
              Todos os planos incluem página pública, agenda por profissional e relatórios
              do período.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs text-muted lg:grid-cols-1">
            {[
              "7 dias de teste no cartão",
              "Pix à vista ou cartão recorrente",
              "Sem fidelidade e sem multa",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
                <span>{item}</span>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {catalog.map((plan) => (
            <div
              key={plan.id}
              className={`flex flex-col rounded-xl border bg-white p-6 ${
                plan.isPopular
                  ? "border-brand/40 shadow-[0_1px_2px_rgba(11,18,32,0.04),0_24px_50px_-40px_rgba(46,91,255,0.55)]"
                  : "border-line"
              }`}
            >
              <div className="flex min-h-8 items-start justify-between gap-3">
                <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
                  {plan.name}
                </h3>
                {plan.isPopular && (
                  <span className="rounded-md bg-brand/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-hover">
                    Mais escolhido
                  </span>
                )}
              </div>

              <p className="mt-2 min-h-[60px] text-[13px] leading-relaxed text-muted">
                {plan.description}
              </p>

              <div className="mt-5 border-t border-line pt-5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-medium text-muted">R$</span>
                  <span className="font-display text-[34px] font-semibold leading-none tracking-tight text-ink">
                    {formatPrice(plan.priceMonthly)}
                  </span>
                  <span className="text-xs text-muted">/mês</span>
                </div>
                <p className="mt-2 text-[11px] text-muted">
                  Cobrança mensal · cancele quando quiser
                </p>
              </div>

              <ul className="mt-5 flex-1 space-y-2.5 border-t border-line pt-5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-[12.5px] text-slate-700">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
                    <span className="leading-snug">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={
                  plan.slug
                    ? `/cadastro?plano=${encodeURIComponent(plan.slug)}`
                    : "/cadastro"
                }
                className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-sm font-semibold transition ${
                  plan.isPopular
                    ? "bg-brand text-white hover:bg-brand-hover"
                    : "border border-line bg-white text-ink hover:border-slate-300 hover:bg-paper"
                }`}
              >
                {plan.ctaText || "Começar teste"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 max-w-3xl text-[11px] leading-relaxed text-muted">
          Os limites de profissionais e serviços valem para cadastros ativos. Ao trocar de
          plano, o novo valor entra na próxima renovação e os dados já cadastrados são
          preservados.
        </p>
      </div>
    </section>
  );
};
