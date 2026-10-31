import React from 'react';
import { 
  Smartphone, 
  MessageSquare, 
  Users, 
  QrCode, 
  CalendarSync, 
  BarChart3, 
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface FeaturesGridProps {
  onOpenBookingDemo: () => void;
}

export const FeaturesGrid: React.FC<FeaturesGridProps> = ({ onOpenBookingDemo }) => {
  return (
    <section id="recursos" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#e4ded5] bg-[#f5efe6] text-[#8f5e3b] text-xs font-semibold tracking-wider uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recursos pensados para o seu dia a dia</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#171513] tracking-tight leading-tight">
            Tudo o que você precisa para <br className="hidden sm:inline" />
            <span className="text-[#af7e56]">lotar a sua agenda</span> com zero estresse.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#6b645c]">
            Elimine conversas intermináveis de agendamento e foque 100% na excelência do seu atendimento presencial ou online.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Card 1: Página Pública (Featured Large) */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-[#e7e1d8] shadow-soft hover:shadow-elevated transition-all group flex flex-col justify-between overflow-hidden relative">
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#f7efe8] text-[#af7e56] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="inline-block text-xs font-semibold uppercase tracking-wider text-[#af7e56] mb-1">
                Sua vitrine 24 horas por dia
              </div>
              <h3 className="text-2xl font-bold text-[#171513] mb-3">
                Página pública exclusiva no seu link da bio
              </h3>
              <p className="text-[#6b645c] text-sm sm:text-base max-w-md leading-relaxed mb-6">
                Seu cliente clica no link do Instagram, escolhe o serviço, profissional, dia e horário disponível em menos de 40 segundos — sem baixar nenhum aplicativo.
              </p>
              
              <button 
                onClick={onOpenBookingDemo}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#af7e56] hover:text-[#8f5e3b] group/btn cursor-pointer"
              >
                <span>Experimentar página de agendamento do cliente</span>
                <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
              </button>
            </div>

            {/* Visual representation of public page */}
            <div className="mt-8 bg-[#fbfaf8] border border-[#ede7de] rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#ece6dd] text-xs">
                <span className="font-mono text-[#8c827a] text-[11px] bg-white px-2 py-0.5 rounded border border-[#ede7de]">
                  agendamentoon.app/barbeariadon
                </span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium text-[11px]">
                  ✓ Aberto para agendamentos
                </span>
              </div>
              <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="bg-white p-2.5 rounded-xl border border-[#ede8e1] flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#f5ede4] text-[#af7e56] flex items-center justify-center font-bold text-xs">1</div>
                  <div className="text-left">
                    <p className="text-[11px] font-bold text-[#1c1917]">Corte Degradê</p>
                    <p className="text-[10px] text-[#8c827a]">R$ 60 • 40 min</p>
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#ede8e1] flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#f5ede4] text-[#af7e56] flex items-center justify-center font-bold text-xs">2</div>
                  <div className="text-left">
                    <p className="text-[11px] font-bold text-[#1c1917]">Rafael (Barbeiro)</p>
                    <p className="text-[10px] text-emerald-600 font-medium">3 horários livres</p>
                  </div>
                </div>
                <div className="bg-[#171513] text-white p-2.5 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-[#c7beaf]">Confirmar para</p>
                    <p className="text-[11px] font-bold text-white">Hoje, 15:00</p>
                  </div>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Lembretes WhatsApp */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e7e1d8] shadow-soft hover:shadow-elevated transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#e8f7ee] text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="inline-block text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
                Adeus Faltas
              </div>
              <h3 className="text-2xl font-bold text-[#171513] mb-3">
                Lembretes no WhatsApp com 1 clique
              </h3>
              <p className="text-[#6b645c] text-sm leading-relaxed mb-6">
                Envio automático 24h e 2h antes com botão de confirmação. Se o cliente desmarcar, a vaga é liberada automaticamente.
              </p>
            </div>

            {/* Chat bubble preview */}
            <div className="bg-[#eef8f1] border border-[#d2edd9] rounded-2xl p-3.5 text-xs">
              <div className="flex items-center gap-2 mb-1.5 font-bold text-emerald-900">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>WhatsApp AgendamentoON</span>
              </div>
              <p className="text-emerald-950 text-[11px] leading-relaxed">
                &ldquo;Olá Ana! Seu horário de <strong>Limpeza de Pele</strong> é amanhã às 14h com a Dra. Camila. Responda 1 para confirmar.&rdquo;
              </p>
              <div className="mt-2 pt-2 border-t border-[#c6e7d0] flex justify-end">
                <span className="text-[10px] text-emerald-700 font-bold bg-white/70 px-2 py-0.5 rounded">
                  ✓ Confirmado pelo cliente
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Cobrança de Sinal via PIX */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e7e1d8] shadow-soft hover:shadow-elevated transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#fdf2e9] text-[#b45309] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <QrCode className="w-6 h-6" />
              </div>
              <div className="inline-block text-xs font-semibold uppercase tracking-wider text-[#b45309] mb-1">
                Zero calote
              </div>
              <h3 className="text-2xl font-bold text-[#171513] mb-3">
                Cobrança de Sinal via PIX Integrado
              </h3>
              <p className="text-[#6b645c] text-sm leading-relaxed mb-6">
                Exija uma taxa de 30% ou o valor total no momento do agendamento para blindar sua agenda contra clientes fantasmas.
              </p>
            </div>

            <div className="bg-[#fcfbf9] border border-[#eee7dd] rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                  PIX
                </div>
                <div>
                  <p className="text-xs font-bold text-[#171513]">Sinal de Reserva</p>
                  <p className="text-[10px] text-[#78716c]">Creditado na sua conta</p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                + R$ 50,00
              </span>
            </div>
          </div>

          {/* Card 4: Gestão de Múltiplos Profissionais */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e7e1d8] shadow-soft hover:shadow-elevated transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#ede9fe] text-[#7c3aed] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <div className="inline-block text-xs font-semibold uppercase tracking-wider text-[#7c3aed] mb-1">
                Equipe Organizada
              </div>
              <h3 className="text-2xl font-bold text-[#171513] mb-3">
                Agendas individuais & Comissões
              </h3>
              <p className="text-[#6b645c] text-sm leading-relaxed mb-6">
                Cada colaborador acessa apenas sua própria agenda pelo smartphone e acompanha suas comissões em tempo real.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#faf8f5] border border-[#ede8e1]">
                <span className="font-medium text-[#1c1917]">Rafael (Barbeiro)</span>
                <span className="text-emerald-700 font-bold">50% comissão (R$ 1.840)</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#faf8f5] border border-[#ede8e1]">
                <span className="font-medium text-[#1c1917]">Bruno (Barba & Corte)</span>
                <span className="text-emerald-700 font-bold">45% comissão (R$ 1.520)</span>
              </div>
            </div>
          </div>

          {/* Card 5: Google Agenda e Calendars */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e7e1d8] shadow-soft hover:shadow-elevated transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <CalendarSync className="w-6 h-6" />
              </div>
              <div className="inline-block text-xs font-semibold uppercase tracking-wider text-[#0284c7] mb-1">
                Sincronia 100%
              </div>
              <h3 className="text-2xl font-bold text-[#171513] mb-3">
                Sincronização com Google Calendar
              </h3>
              <p className="text-[#6b645c] text-sm leading-relaxed mb-6">
                Marcou médico pessoal no seu Google Agenda? O AgendamentoON bloqueia automaticamente o horário para clientes no mesmo segundo.
              </p>
            </div>

            <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-2xl p-3 flex items-center gap-3 text-xs text-[#0369a1]">
              <ShieldCheck className="w-5 h-5 shrink-0 text-[#0284c7]" />
              <span>Proteção anti-choque de horários ativa em tempo real.</span>
            </div>
          </div>

          {/* Card 6: Relatórios Financeiros */}
          <div className="md:col-span-3 bg-gradient-to-r from-[#1e1b18] to-[#2c2621] text-white rounded-3xl p-6 sm:p-8 shadow-elevated flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#d7ad89] text-xs font-semibold uppercase tracking-wider mb-4">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Gestão Financeira Descomplicada</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                Saiba exatamente quanto seu negócio faturou hoje, nesta semana e no mês.
              </h3>
              <p className="text-[#c5beaf] text-sm sm:text-base leading-relaxed">
                Tenha um raio-x claro de quais serviços mais vendem, os horários mais procurados e a taxa de retorno dos seus clientes fiéis.
              </p>
            </div>

            <div className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center">
                <div className="text-xs text-[#b8afa3] font-medium uppercase tracking-wider">Faturamento Médio</div>
                <div className="text-2xl font-extrabold text-emerald-400 mt-0.5">+38%</div>
                <div className="text-[10px] text-[#a89f93]">após 60 dias de uso</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center">
                <div className="text-xs text-[#b8afa3] font-medium uppercase tracking-wider">Tempo Economizado</div>
                <div className="text-2xl font-extrabold text-amber-300 mt-0.5">60h/mês</div>
                <div className="text-[10px] text-[#a89f93]">em média por estabelecimento</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
