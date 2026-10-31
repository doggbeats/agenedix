import React from 'react';
import Link from 'next/link';
import { Check, Sparkles, Shield, ArrowRight } from 'lucide-react';
import { PRICING_PLANS } from '../data/mockData';
import type { PricingPlan } from '../types';

interface PricingSectionProps {
  plans?: PricingPlan[];
}

export const PricingSection: React.FC<PricingSectionProps> = ({ plans }) => {
  const catalog = plans && plans.length > 0 ? plans : PRICING_PLANS;

  return (
    <section id="planos" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#e4ded5] bg-[#f5efe6] text-[#8f5e3b] text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Preço Justo e Sem Surpresas</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#171513] tracking-tight">
            Planos simples que crescem com você
          </h2>
          <p className="mt-4 text-[#6b645c] text-base sm:text-lg">
            Cobrança mensal, 7 dias de teste no cartão ou pagamento imediato no Pix. Sem fidelidade e cancele quando quiser.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white border border-[#ded5c8] px-4 py-2 text-xs font-bold text-[#57534e]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Todos os planos com 7 dias de teste
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 xl:gap-5 items-stretch">
          {catalog.map((plan) => {
            const priceLabel = plan.priceMonthly.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-7 sm:p-9 flex flex-col justify-between transition-all duration-200 relative ${
                  plan.isPopular
                    ? 'bg-white border-2 border-[#af7e56] shadow-xl scale-[1.02] z-10'
                    : 'bg-white/80 border border-[#e5dfd4] shadow-soft hover:shadow-elevated'
                }`}
              >
                {/* Popular pill */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-[#af7e56] text-white text-[11px] font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-[#171513] mb-2">{plan.name}</h3>
                  <p className="text-xs text-[#78716c] leading-relaxed min-h-[36px] mb-6">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-1.5 mb-6 pb-6 border-b border-[#f0ece5]">
                    <span className="text-xs font-bold text-[#78716c]">R$</span>
                    <span className="text-4xl sm:text-5xl font-extrabold text-[#171513] tracking-tight">
                      {priceLabel}
                    </span>
                    <span className="text-xs font-medium text-[#78716c]">
                      /mês
                    </span>
                  </div>

                  {/* Features list */}
                  <div className="space-y-3.5 mb-8">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#8c827a]">
                      O que está incluso:
                    </div>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-[#38332d]">
                        <div className="w-4 h-4 rounded-full bg-[#f4eee6] text-[#af7e56] flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <span className="leading-snug">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <div className="pt-4 border-t border-[#f0ece5]">
                  <Link
                    href={plan.slug ? `/cadastro?plano=${encodeURIComponent(plan.slug)}` : '/cadastro'}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      plan.isPopular
                        ? 'bg-[#af7e56] hover:bg-[#9d6d48] text-white shadow-warm'
                        : 'bg-[#171513] hover:bg-[#2d2824] text-white shadow-xs'
                    }`}
                  >
                    <span>{plan.ctaText || 'Começar teste de 7 dias'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <p className="text-[11px] text-center text-[#8c827a] mt-2.5">
                    Teste grátis de 7 dias • Sem fidelidade
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security / Guarantee Seal */}
        <div className="mt-14 max-w-3xl mx-auto bg-white/70 border border-[#e5dfd4] rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-[#e8f7ee] text-emerald-600 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#171513]">
              Garantia Incondicional de Satisfação
            </h4>
            <p className="text-xs text-[#6b645c] mt-0.5">
              Experimente o AgendamentoON por 7 dias. Se você e sua equipe não sentirem a diferença na pontualidade e na redução de faltas, basta cancelar no painel com 1 clique.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
