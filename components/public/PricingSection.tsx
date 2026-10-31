"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { buttonBrand, buttonSecondary } from "@/components/ui";

export type PricingPlan = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  trialDays: number;
  features: string[];
};

function savingsPercent(plan: PricingPlan): number {
  const fullYear = plan.priceMonthly * 12;
  if (fullYear <= 0 || plan.priceYearly <= 0) return 0;
  return Math.max(0, Math.round((1 - plan.priceYearly / fullYear) * 100));
}

export function PricingSection({ plans }: { plans: PricingPlan[] }) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <section id="planos" className="border-t border-line bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">
              Planos
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Preço claro. Ativação confirmada por gente.
            </h2>
            <p className="mt-3 text-slate-600">
              O cadastro inicia um período de teste. A mudança para um plano pago é uma
              solicitação registrada; a equipe Agendix confirma o pagamento antes de ativar.
            </p>
          </div>

          <div
            className="inline-flex w-fit items-center gap-1 rounded-lg border border-line bg-white p-1 shadow-sm"
            role="group"
            aria-label="Periodicidade do plano"
          >
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              aria-pressed={billing === "monthly"}
              className={`rounded-md px-3.5 py-2 text-xs font-semibold transition ${
                billing === "monthly"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:bg-paper hover:text-ink"
              }`}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setBilling("yearly")}
              aria-pressed={billing === "yearly"}
              className={`rounded-md px-3.5 py-2 text-xs font-semibold transition ${
                billing === "yearly"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:bg-paper hover:text-ink"
              }`}
            >
              Anual
            </button>
          </div>
        </div>

        {plans.length === 0 ? (
          <div className="mt-8 rounded-xl border border-line bg-white px-6 py-10 text-center">
            <p className="font-semibold text-ink">Nenhum plano publicado</p>
            <p className="mt-1 text-sm text-slate-500">
              Cadastre os planos no painel administrativo para exibi-los aqui.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {plans.map((plan, index) => {
              const featured = index === 1;
              const savings = savingsPercent(plan);
              return (
                <article
                  key={plan.id}
                  className={`surface-hover relative flex flex-col rounded-xl border bg-white p-6 ${
                    featured ? "border-brand/30 shadow-sm" : "border-line"
                  }`}
                >
                  {featured && (
                    <span className="absolute -top-3 left-6 rounded-md bg-brand px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                      Mais escolhido
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{plan.name}</p>
                      <p className="mt-1 min-h-10 text-sm leading-relaxed text-slate-600">
                        {plan.description}
                      </p>
                    </div>
                    {billing === "yearly" && savings > 0 && (
                      <span className="shrink-0 rounded-md bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-700 ring-1 ring-inset ring-green-200">
                        -{savings}%
                      </span>
                    )}
                  </div>

                  <div className="mt-5 border-y border-line py-4" aria-live="polite">
                    <p className="flex items-baseline gap-1">
                      <span className="text-4xl font-semibold tracking-tight text-slate-900">
                        {formatCurrency(
                          billing === "monthly" ? plan.priceMonthly : plan.priceYearly,
                        )}
                      </span>
                      <span className="text-sm text-slate-500">
                        /{billing === "monthly" ? "mês" : "ano"}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {billing === "monthly"
                        ? `ou ${formatCurrency(plan.priceYearly)}/ano`
                        : `equivalente a ${formatCurrency(
                            Math.round(plan.priceYearly / 12),
                          )}/mês`}
                    </p>
                  </div>

                  <ul className="mt-5 flex-1 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2 text-sm text-slate-600">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/cadastro?plano=${plan.slug}`}
                    className={`mt-6 ${featured ? buttonBrand : buttonSecondary}`}
                  >
                    Começar teste de {plan.trialDays} dias
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        <p className="mt-5 text-xs leading-relaxed text-slate-500">
          Nenhum pagamento é processado neste site. A ativação de planos pagos é registrada
          manualmente após confirmação com a equipe Agendix. Consulte os{" "}
          <Link href="/termos" className="text-slate-600 underline underline-offset-2">
            termos de uso
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
