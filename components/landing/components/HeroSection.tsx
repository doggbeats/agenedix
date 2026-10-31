import React, { useState } from 'react';
import { 
  ArrowRight, 
  Globe, 
  Check, 
  Clock, 
  Sparkles, 
  Plus, 
  CheckCircle2, 
  MessageCircle, 
  Scissors, 
  Heart, 
  Smile, 
  Dumbbell
} from 'lucide-react';
import { BUSINESS_NICHES } from '../data/mockData';
import { AppointmentItem } from '../types';

interface HeroSectionProps {
  onOpenSignup: () => void;
  onOpenBookingModal: (preselectedService?: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenSignup,
  onOpenBookingModal
}) => {
  const [selectedNicheIndex, setSelectedNicheIndex] = useState(0);
  const currentNiche = BUSINESS_NICHES[selectedNicheIndex];
  const [appointments, setAppointments] = useState<AppointmentItem[]>(currentNiche.sampleAppointments);
  const [showNotification, setShowNotification] = useState(true);

  // When changing niche, update appointments list
  const handleNicheChange = (index: number) => {
    setSelectedNicheIndex(index);
    setAppointments(BUSINESS_NICHES[index].sampleAppointments);
  };

  const handleToggleStatus = (id: string) => {
    setAppointments((prev) =>
      prev.map((app) => {
        if (app.id === id) {
          const nextStatus =
            app.status === 'Pendente'
              ? 'Confirmado'
              : app.status === 'Confirmado'
              ? 'Concluído'
              : 'Pendente';
          return { ...app, status: nextStatus };
        }
        return app;
      })
    );
  };

  const getNicheIcon = (id: string) => {
    switch (id) {
      case 'barbearia': return <Scissors className="w-3.5 h-3.5" />;
      case 'estetica': return <Sparkles className="w-3.5 h-3.5" />;
      case 'psicologia': return <Smile className="w-3.5 h-3.5" />;
      case 'studio': return <Dumbbell className="w-3.5 h-3.5" />;
      default: return <Heart className="w-3.5 h-3.5" />;
    }
  };

  return (
    <section className="relative overflow-hidden pt-8 sm:pt-14 pb-20 md:pb-28">
      {/* Background ambient subtle gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[520px] pointer-events-none opacity-40">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#eedccf] rounded-full blur-3xl"></div>
        <div className="absolute top-28 right-1/4 w-80 h-80 bg-[#e7dfd5] rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline and Pitch */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            
            {/* Pill Badge exactly styled as screenshot */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#ebd8cb] bg-[#fbf5ee] text-[#8f5e3b] text-xs font-semibold tracking-wider uppercase mb-7 shadow-2xs hover:border-[#dfc4b2] transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-[#af7e56]" />
              <span>AGENDAMENTO ONLINE PARA NEGÓCIOS QUE ATENDEM COM HORA MARCADA</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[62px] xl:text-[66px] font-bold text-[#171513] tracking-tight leading-[1.08] mb-6">
              A sua agenda, no <br className="hidden sm:inline" />
              <span className="relative inline-block">
                ritmo certo.
                <span className="absolute -bottom-1 left-0 w-full h-[6px] bg-[#d7ad89]/30 rounded-full"></span>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-[#6b645c] leading-relaxed max-w-xl mb-8 font-normal">
              O Agendix organiza horários, equipe e página pública em um só lugar. Seus clientes escolhem o melhor horário; você cuida do atendimento.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto mb-8">
              <button
                onClick={onOpenSignup}
                className="group bg-[#af7e56] hover:bg-[#9d6d48] text-white px-7 py-3.5 rounded-xl font-semibold text-base shadow-warm active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>Começar teste de 7 dias</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onOpenBookingModal()}
                className="bg-white hover:bg-[#f6f2ec] border border-[#ded7cc] text-[#1f1d1b] px-6 py-3.5 rounded-xl font-semibold text-base active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:border-[#cdbfae]"
              >
                <Globe className="w-4 h-4 text-[#78716c]" />
                <span>Ver agendas online</span>
              </button>
            </div>

            {/* Trust Micro-bullets with green check icons */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-[#44403c] font-medium pt-1">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                <span>Sem cartão no teste</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                <span>Cancele quando quiser</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                <span>Dados isolados por negócio</span>
              </div>
            </div>

          </div>

          {/* Right Column: The Iconic Interactive Agenda Card matching the screenshot */}
          <div className="lg:col-span-5 relative">

            {/* Segment Selector above the card */}
            <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 max-w-full scrollbar-none">
              <span className="text-[11px] font-semibold text-[#8c827a] uppercase tracking-wider mr-1 hidden sm:inline">
                Ver nicho:
              </span>
              {BUSINESS_NICHES.map((niche, idx) => (
                <button
                  key={niche.id}
                  onClick={() => handleNicheChange(idx)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    selectedNicheIndex === idx
                      ? 'bg-[#171513] text-white shadow-xs'
                      : 'bg-white/80 hover:bg-white text-[#57534e] border border-[#e8e2d8]'
                  }`}
                >
                  {getNicheIcon(niche.id)}
                  <span>{niche.label}</span>
                </button>
              ))}
            </div>

            {/* The Main Agenda Card (Screenshot replica with interactive flair) */}
            <div className="relative bg-white rounded-3xl border border-[#eae5de] shadow-elevated p-5 sm:p-6 transition-all duration-300">
              
              {/* Card Header */}
              <div className="flex items-start justify-between pb-4 border-b border-[#f2eee9]">
                <div>
                  <span className="text-[11px] font-bold text-[#8c827a] uppercase tracking-wider block">
                    EXEMPLO DE AGENDA
                  </span>
                  <div className="text-xl font-bold text-[#171513] mt-0.5 flex items-center gap-2">
                    <span>Hoje · quinta-feira</span>
                    <span className="text-xs font-normal text-[#78716c] hidden sm:inline">
                      ({currentNiche.label})
                    </span>
                  </div>
                </div>

                {/* Status Pill: Online */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8f7ee] text-[#15803d] border border-[#c6ecd5] text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse"></span>
                  <span>Online</span>
                </div>
              </div>

              {/* Card Body: Appointment items */}
              <div className="py-4 space-y-3">
                {appointments.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleStatus(item.id)}
                    className="group relative flex items-center justify-between p-3.5 rounded-2xl border border-[#ede9e2] hover:border-[#d9cfc2] bg-[#fcfbf9] hover:bg-[#faf7f2] transition-all duration-200 cursor-pointer"
                    title="Clique para alternar status"
                  >
                    <div className="flex items-center gap-4">
                      {/* Time & Duration */}
                      <div className="w-16">
                        <div className="text-base font-bold text-[#171513] leading-none">
                          {item.time}
                        </div>
                        <div className="text-[10px] font-semibold text-[#8c827a] tracking-wider uppercase mt-1">
                          {item.duration}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-8 w-[1px] bg-[#e7e1d8]"></div>

                      {/* Service & Staff */}
                      <div>
                        <div className="text-sm font-semibold text-[#1f1d1b] group-hover:text-[#af7e56] transition-colors">
                          {item.service}
                        </div>
                        <div className="text-xs text-[#78716c] flex items-center gap-1.5 mt-0.5">
                          <span>com {item.professional}</span>
                          {item.client && (
                            <>
                              <span className="text-[#c4bcaf]">•</span>
                              <span className="text-[#8c827a]">{item.client}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {item.status === 'Confirmado' && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#e8f7ee] text-[#15803d] border border-[#c6ecd5] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Confirmado
                        </span>
                      )}
                      {item.status === 'Pendente' && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#fef3c7] text-[#b45309] border border-[#fde68a] inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pendente
                        </span>
                      )}
                      {item.status === 'Em atendimento' && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#ede9fe] text-[#6d28d9] border border-[#ddd6fe] inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] animate-ping"></span>
                          Em atendimento
                        </span>
                      )}
                      {item.status === 'Concluído' && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#f3f4f6] text-[#4b5563] border border-[#e5e7eb]">
                          Concluído
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Card Footer: Next free slot & CTA */}
              <div className="pt-3 border-t border-[#f2eee9] flex items-center justify-between text-xs text-[#78716c]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#8c827a]" />
                  <span className="font-medium">Próximo horário livre:</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-base text-[#171513]">15:00</span>
                  <button
                    onClick={() => onOpenBookingModal()}
                    className="px-3 py-1.5 rounded-lg bg-[#f4eee6] hover:bg-[#ebdfd2] text-[#8f5e3b] font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Novo agendamento</span>
                  </button>
                </div>
              </div>

              {/* Floating WhatsApp Reminder Simulator Pill */}
              {showNotification && (
                <div className="absolute -bottom-6 -left-4 sm:-left-8 max-w-[320px] bg-[#1c1917] text-white p-3.5 rounded-2xl shadow-xl border border-[#38332d] animate-float flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-full bg-[#25d366] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <MessageCircle className="w-4 h-4 fill-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#f5efe6]">WhatsApp automático</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowNotification(false);
                        }}
                        className="text-[#999086] hover:text-white ml-2 text-xs"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-[#c4bcaf] mt-1 text-[11px] leading-tight">
                      &ldquo;Olá Carlos! Lembrete do seu horário hoje às 14:00 com Diego. Clique aqui para confirmar.&rdquo;
                    </p>
                  </div>
                </div>
              )}

              {/* Floating Metric Badge on Top-Right */}
              <div className="hidden sm:flex absolute -top-4 -right-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#e4ded5] shadow-md items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                <span className="text-xs font-semibold text-[#171513]">
                  +85% de comparecimento
                </span>
              </div>

            </div>

            {/* Quick interactive note below card */}
            <p className="text-center text-[11px] text-[#8c827a] mt-3">
              💡 <span className="font-medium">Dica interativa:</span> Clique nos cards acima para alternar o status do atendimento em tempo real.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};
