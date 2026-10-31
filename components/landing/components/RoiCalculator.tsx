import React, { useState } from 'react';
import { Calculator, TrendingUp, Clock, ArrowRight } from 'lucide-react';

interface RoiCalculatorProps {
  onOpenSignup: () => void;
}

export const RoiCalculator: React.FC<RoiCalculatorProps> = ({ onOpenSignup }) => {
  const [appointmentsPerWeek, setAppointmentsPerWeek] = useState(45);
  const [averageTicket, setAverageTicket] = useState(80);

  // Calculations
  const monthlyAppointments = appointmentsPerWeek * 4.2;
  // Without auto reminders, approx 15% no-show rate. With Agendix, no-shows drop to ~3% (saving ~12% of appointments)
  const recoveredAppointments = Math.round(monthlyAppointments * 0.12);
  const recoveredMoney = recoveredAppointments * averageTicket;
  
  // Time saved: approx 8 minutes spent per appointment negotiation on WhatsApp manually
  const hoursSaved = Math.round((monthlyAppointments * 8) / 60);

  return (
    <section className="py-20 bg-white border-y border-[#ede8e1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#e4ded5] bg-[#f5efe6] text-[#8f5e3b] text-xs font-semibold uppercase tracking-wider mb-3">
            <Calculator className="w-3.5 h-3.5" />
            <span>Calculadora de Retorno</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#171513] tracking-tight">
            Descubra quanto dinheiro o Agendix <br className="hidden sm:inline" />
            coloca de volta no seu bolso.
          </h2>
          <p className="mt-3 text-[#6b645c] text-sm sm:text-base">
            Mova os controles abaixo para simular o impacto real da automação no seu negócio mensal.
          </p>
        </div>

        {/* Calculator layout */}
        <div className="max-w-4xl mx-auto bg-[#fbfaf8] border border-[#e5dfd4] rounded-3xl p-6 sm:p-10 shadow-elevated">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            
            {/* Sliders Side */}
            <div className="space-y-8">
              {/* Slider 1 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-[#1c1917]">
                    Atendimentos por semana
                  </label>
                  <span className="text-base font-extrabold text-[#af7e56] bg-[#fbf5ef] px-3 py-0.5 rounded-lg border border-[#ebd8cb]">
                    {appointmentsPerWeek} clientes
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="5"
                  value={appointmentsPerWeek}
                  onChange={(e) => setAppointmentsPerWeek(Number(e.target.value))}
                  className="w-full accent-[#af7e56] cursor-pointer h-2 bg-[#e8e2d8] rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-[#8c827a] mt-1 font-medium">
                  <span>10/sem</span>
                  <span>100/sem</span>
                  <span>200/sem</span>
                </div>
              </div>

              {/* Slider 2 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-[#1c1917]">
                    Valor médio por cliente (Ticket Médio)
                  </label>
                  <span className="text-base font-extrabold text-[#af7e56] bg-[#fbf5ef] px-3 py-0.5 rounded-lg border border-[#ebd8cb]">
                    R$ {averageTicket},00
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="450"
                  step="10"
                  value={averageTicket}
                  onChange={(e) => setAverageTicket(Number(e.target.value))}
                  className="w-full accent-[#af7e56] cursor-pointer h-2 bg-[#e8e2d8] rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-[#8c827a] mt-1 font-medium">
                  <span>R$ 30</span>
                  <span>R$ 200</span>
                  <span>R$ 450</span>
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-[#ece4d9] text-xs text-[#78716c]">
                💡 <strong>Base de cálculo:</strong> Estimativa fundamentada em métricas de mais de 2.800 empresas utilizando confirmação via WhatsApp e sinal PIX.
              </div>
            </div>

            {/* Results Side */}
            <div className="bg-[#1e1b18] text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
              <div>
                <span className="text-xs font-semibold text-[#b3a89a] uppercase tracking-wider block">
                  Faturamento recuperado todo mês
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#f3d3b3] mt-1 flex items-baseline gap-1">
                  <span>+ R$ {recoveredMoney.toLocaleString('pt-BR')}</span>
                  <span className="text-xs text-[#c4b9aa] font-normal">/mês</span>
                </div>
                <p className="text-xs text-[#b0a597] mt-1">
                  Atendimentos que deixam de ser perdidos por faltas e esquecimentos.
                </p>
              </div>

              <div className="pt-4 border-t border-[#38332c] grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-[#c4b9aa] font-medium">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Tempo livre ganho</span>
                  </div>
                  <div className="text-xl font-bold text-white mt-1">
                    {hoursSaved} horas
                  </div>
                  <span className="text-[10px] text-[#8c827a]">a menos no WhatsApp</span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-xs text-[#c4b9aa] font-medium">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Vagas salvas</span>
                  </div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    ~{recoveredAppointments} vagas
                  </div>
                  <span className="text-[10px] text-[#8c827a]">reaproveitadas</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#38332c]">
                <button
                  onClick={onOpenSignup}
                  className="w-full bg-[#af7e56] hover:bg-[#9d6d48] text-white py-3.5 rounded-xl font-bold text-sm shadow-warm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Começar a recuperar esse valor agora</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="text-center text-[10px] text-[#9c9183] mt-2">
                  Plano mensal se paga no primeiro atendimento recuperado.
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
