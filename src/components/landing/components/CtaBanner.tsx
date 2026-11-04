import React from "react";
import { ArrowRight } from "lucide-react";

interface CtaBannerProps {
  onOpenSignup: () => void;
  onOpenBookingDemo: () => void;
}

const facts = [
  { label: "Teste", value: "7 dias no cartão" },
  { label: "Pagamento", value: "Pix à vista ou cartão" },
  { label: "Contrato", value: "Mensal, sem fidelidade" },
];

export const CtaBanner: React.FC<CtaBannerProps> = ({
  onOpenSignup,
  onOpenBookingDemo,
}) => {
  return (
    <section className="py-16 sm:py-24">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-2xl bg-ink">
          <div
            aria-hidden
            className="paper-grid pointer-events-none absolute inset-0 opacity-[0.07]"
          />

          <div className="relative grid gap-10 p-8 sm:p-12 lg:grid-cols-[1.25fr_0.75fr] lg:gap-16 lg:p-14">
            <div>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-white/55">
                AgendamentoON
              </p>
              <h2 className="display-title mt-4 max-w-[18ch] text-3xl text-white sm:text-4xl lg:text-[44px]">
                Coloque a agenda no ar ainda hoje.
              </h2>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/65">
                Crie a conta, cadastre serviços e profissionais e compartilhe o link da
                sua página. O primeiro horário pode entrar antes do fim do dia.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={onOpenSignup}
                  className="group inline-flex items-center justify-center gap-2 rounded-[10px] bg-brand px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
                >
                  Começar teste de 7 dias
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </button>
                <button
                  type="button"
                  onClick={onOpenBookingDemo}
                  className="inline-flex items-center justify-center rounded-[10px] border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:border-white/35 hover:bg-white/5"
                >
                  Ver agenda de exemplo
                </button>
              </div>
            </div>

            <dl className="grid content-center gap-0 border-t border-white/10 lg:border-l lg:border-t-0 lg:pl-10">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className="flex items-baseline justify-between gap-4 border-b border-white/10 py-4 last:border-0"
                >
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
                    {fact.label}
                  </dt>
                  <dd className="text-right text-[13px] font-medium text-white/85">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
};
