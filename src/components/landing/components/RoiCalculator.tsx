import React, { useState } from "react";
import { ArrowRight } from "lucide-react";

interface RoiCalculatorProps {
  onOpenSignup: () => void;
}

export const RoiCalculator: React.FC<RoiCalculatorProps> = ({ onOpenSignup }) => {
  const [appointmentsPerWeek, setAppointmentsPerWeek] = useState(45);
  const [minutesPerConversation, setMinutesPerConversation] = useState(8);

  const monthlyAppointments = Math.round(appointmentsPerWeek * 4.33);
  const hoursPerMonth = Math.round((monthlyAppointments * minutesPerConversation) / 60);
  const workdays = Math.round((hoursPerMonth / 8) * 10) / 10;

  return (
    <section className="border-b border-line py-20 sm:py-28">
      <div className="container-page">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
          <div>
            <p className="eyebrow">Faça as contas</p>
            <h2 className="display-title mt-4 text-3xl text-ink sm:text-4xl lg:text-[44px]">
              Quanto tempo vai para o agendamento?
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted">
              Ajuste os números da sua rotina para estimar o tempo gasto em conversas de
              agendamento. O cálculo é uma referência, não uma promessa de resultado.
            </p>

            <div className="mt-8 space-y-7">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="appointments" className="text-[13px] font-semibold text-ink">
                    Atendimentos por semana
                  </label>
                  <span className="rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-[11px] font-semibold text-ink">
                    {appointmentsPerWeek}
                  </span>
                </div>
                <input
                  id="appointments"
                  type="range"
                  min="10"
                  max="200"
                  step="5"
                  value={appointmentsPerWeek}
                  onChange={(event) => setAppointmentsPerWeek(Number(event.target.value))}
                  className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-brand"
                />
                <div className="mt-1.5 flex justify-between text-[10px] text-muted">
                  <span>10</span>
                  <span>200</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="minutes" className="text-[13px] font-semibold text-ink">
                    Minutos por conversa
                  </label>
                  <span className="rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-[11px] font-semibold text-ink">
                    {minutesPerConversation} min
                  </span>
                </div>
                <input
                  id="minutes"
                  type="range"
                  min="3"
                  max="20"
                  step="1"
                  value={minutesPerConversation}
                  onChange={(event) => setMinutesPerConversation(Number(event.target.value))}
                  className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-brand"
                />
                <div className="mt-1.5 flex justify-between text-[10px] text-muted">
                  <span>3 min</span>
                  <span>20 min</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-ink bg-ink p-6 text-white sm:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
              Estimativa mensal
            </p>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-display text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">
                {hoursPerMonth}
              </span>
              <span className="text-sm text-white/60">horas</span>
            </div>
            <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-white/60">
              tempo em conversas de agendamento, considerando {monthlyAppointments}{" "}
              atendimentos por mês.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">
                  Em dias de trabalho
                </p>
                <p className="mt-1 font-display text-xl font-semibold">{workdays} dias</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">
                  Por atendimento
                </p>
                <p className="mt-1 font-display text-xl font-semibold">
                  {minutesPerConversation} min
                </p>
              </div>
            </div>

            <p className="mt-6 rounded-lg border border-white/10 bg-white/5 p-3 text-[10px] leading-relaxed text-white/50">
              Cálculo: atendimentos por semana × 4,33 × minutos por conversa ÷ 60. Não inclui
              tempo de deslocamento, espera ou retrabalho.
            </p>

            <button
              type="button"
              onClick={onOpenSignup}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/90"
            >
              Testar na minha agenda <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
