import React, { useState } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { 
  CheckCircle, 
  MessageCircle, 
  ArrowRight, 
  ChevronLeft, 
  Smartphone,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { BUSINESS_NICHES } from '../data/mockData';

export const LiveBookingSimulator: React.FC = () => {
  const [activeNicheIndex, setActiveNicheIndex] = useState(0);
  const niche = BUSINESS_NICHES[activeNicheIndex];

  // Booking states
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedService, setSelectedService] = useState(niche.services[0]);
  const [selectedProfessional, setSelectedProfessional] = useState(niche.professionals[0]);
  const [selectedDay, setSelectedDay] = useState('Hoje (Quinta)');
  const [selectedTime, setSelectedTime] = useState('15:00');
  const [clientName, setClientName] = useState('Mariana Oliveira');
  const [clientPhone, setClientPhone] = useState('(11) 98765-4321');
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Handle niche change
  const handleNicheSwitch = (idx: number) => {
    setActiveNicheIndex(idx);
    const newNiche = BUSINESS_NICHES[idx];
    setSelectedService(newNiche.services[0]);
    setSelectedProfessional(newNiche.professionals[0]);
    setStep(1);
    setIsConfirmed(false);
  };

  const timeSlots = ['09:00', '10:30', '13:00', '14:30', '15:00', '16:30', '18:00'];
  const days = [
    { label: 'Hoje (Quinta)', date: '26 Fev' },
    { label: 'Amanhã (Sexta)', date: '27 Fev' },
    { label: 'Sábado', date: '28 Fev' },
    { label: 'Segunda', date: '02 Mar' }
  ];

  const handleFinishBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmed(true);

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // fallback
    }
  };

  const handleReset = () => {
    setIsConfirmed(false);
    setStep(1);
  };

  return (
    <section id="demonstracao" className="py-20 bg-[#f4eee6]/60 border-y border-[#e7e0d6] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#e2dacd] text-[#8f5e3b] text-xs font-semibold uppercase tracking-wider mb-3">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Simulador Interativo em Tempo Real</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#171513] tracking-tight">
            Veja exatamente como seu cliente vai agendar com você
          </h2>
          <p className="mt-3 text-[#6b645c] text-sm sm:text-base">
            Experimente agora mesmo o fluxo de agendamento ultrarrápido que converte cliques em atendimentos confirmados.
          </p>

          {/* Niche Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {BUSINESS_NICHES.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => handleNicheSwitch(idx)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeNicheIndex === idx
                    ? 'bg-[#171513] text-white shadow-xs'
                    : 'bg-white text-[#57534e] hover:bg-[#ede7df] border border-[#ded5c8]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Smartphone Simulator Mockup */}
        <div className="max-w-xl mx-auto">
          <div className="bg-[#1c1917] p-3 sm:p-4 rounded-[40px] shadow-2xl border-4 border-[#3a352f]">
            
            {/* Phone Screen */}
            <div className="bg-[#fbfaf8] rounded-[32px] overflow-hidden border border-[#e5dfd4] min-h-[580px] flex flex-col justify-between">
              
              {/* Phone Status bar */}
              <div className="bg-white px-6 pt-3 pb-2 border-b border-[#eee8df] flex items-center justify-between text-[11px] text-[#78716c]">
                <div className="flex items-center gap-1 font-mono font-semibold text-[#171513]">
                  <span>agendamentoon.app/{niche.id}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] text-emerald-700 font-medium">Disponível</span>
                </div>
              </div>

              {/* Business Header in the phone */}
              <div className="bg-white px-5 py-3 border-b border-[#eee8df] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#171513]">{niche.name}</h4>
                  <p className="text-[11px] text-[#8c827a]">{niche.tagline}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#af7e56] text-white text-xs font-bold flex items-center justify-center">
                  AG
                </div>
              </div>

              {/* Progress Stepper */}
              {!isConfirmed && (
                <div className="bg-[#f4efe8] px-5 py-2 flex items-center justify-between text-[11px] text-[#78716c] font-medium border-b border-[#e9e2d7]">
                  <span className={step >= 1 ? 'text-[#171513] font-bold' : ''}>1. Serviço</span>
                  <span>→</span>
                  <span className={step >= 2 ? 'text-[#171513] font-bold' : ''}>2. Profissional</span>
                  <span>→</span>
                  <span className={step >= 3 ? 'text-[#171513] font-bold' : ''}>3. Horário</span>
                  <span>→</span>
                  <span className={step >= 4 ? 'text-[#171513] font-bold' : ''}>4. Confirmação</span>
                </div>
              )}

              {/* Phone Content Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                
                {/* STATE 1: Choose Service */}
                {!isConfirmed && step === 1 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-sm text-[#171513]">Escolha o serviço desejado:</h5>
                      <span className="text-[11px] text-[#8c827a]">Passo 1 de 4</span>
                    </div>

                    <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                      {niche.services.map((srv) => (
                        <div
                          key={srv.id}
                          onClick={() => setSelectedService(srv)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                            selectedService.id === srv.id
                              ? 'border-[#af7e56] bg-[#fbf5ef] shadow-xs'
                              : 'border-[#ede8e1] bg-white hover:border-[#ded5c8]'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-xs font-bold text-[#171513]">{srv.title}</p>
                              <p className="text-[11px] text-[#78716c] mt-0.5 line-clamp-1">{srv.description}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-[#af7e56]">{srv.price}</span>
                              <span className="text-[10px] text-[#8c827a] block">{srv.duration}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setStep(2)}
                      className="w-full mt-4 bg-[#af7e56] hover:bg-[#9d6d48] text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Continuar para profissionais</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* STATE 2: Choose Professional */}
                {!isConfirmed && step === 2 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setStep(1)}
                          className="p-1 hover:bg-[#ede8e1] rounded-lg text-[#57534e]"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <h5 className="font-bold text-sm text-[#171513]">Com quem deseja agendar?</h5>
                      </div>
                      <span className="text-[11px] text-[#8c827a]">Passo 2 de 4</span>
                    </div>

                    <div className="space-y-2">
                      {niche.professionals.map((prof) => (
                        <div
                          key={prof.id}
                          onClick={() => setSelectedProfessional(prof)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            selectedProfessional.id === prof.id
                              ? 'border-[#af7e56] bg-[#fbf5ef] shadow-xs'
                              : 'border-[#ede8e1] bg-white hover:border-[#ded5c8]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Image
                              src={prof.avatar}
                              alt={prof.name}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover border border-[#e5dfd4]"
                            />
                            <div>
                              <p className="text-xs font-bold text-[#171513]">{prof.name}</p>
                              <p className="text-[11px] text-[#78716c]">{prof.role}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            ★ {prof.rating}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setStep(3)}
                      className="w-full mt-4 bg-[#af7e56] hover:bg-[#9d6d48] text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Escolher dia e horário</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* STATE 3: Choose Day & Time */}
                {!isConfirmed && step === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setStep(2)}
                          className="p-1 hover:bg-[#ede8e1] rounded-lg text-[#57534e]"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <h5 className="font-bold text-sm text-[#171513]">Escolha o horário</h5>
                      </div>
                      <span className="text-[11px] text-[#8c827a]">Passo 3 de 4</span>
                    </div>

                    {/* Day selector */}
                    <div>
                      <span className="text-[11px] font-bold text-[#78716c] uppercase block mb-1.5">
                        Data
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {days.map((d) => (
                          <button
                            key={d.label}
                            type="button"
                            onClick={() => setSelectedDay(d.label)}
                            className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                              selectedDay === d.label
                                ? 'bg-[#171513] text-white border-[#171513]'
                                : 'bg-white text-[#44403c] border-[#ede8e1] hover:border-[#cfc6b8]'
                            }`}
                          >
                            <span className="text-[10px] block opacity-80">{d.date}</span>
                            <span className="text-xs font-bold block">{d.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Time slots */}
                    <div>
                      <span className="text-[11px] font-bold text-[#78716c] uppercase block mb-1.5">
                        Horários vagos com {selectedProfessional.name.split(' ')[0]}
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {timeSlots.map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setSelectedTime(time)}
                            className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              selectedTime === time
                                ? 'bg-[#af7e56] text-white border-[#af7e56]'
                                : 'bg-white text-[#292524] border-[#ede8e1] hover:border-[#cfc6b8]'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setStep(4)}
                      className="w-full mt-2 bg-[#af7e56] hover:bg-[#9d6d48] text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Avançar para confirmação</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* STATE 4: Final confirmation form */}
                {!isConfirmed && step === 4 && (
                  <form onSubmit={handleFinishBooking} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setStep(3)}
                          className="p-1 hover:bg-[#ede8e1] rounded-lg text-[#57534e]"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <h5 className="font-bold text-sm text-[#171513]">Seus dados de contato</h5>
                      </div>
                      <span className="text-[11px] text-[#8c827a]">Passo 4 de 4</span>
                    </div>

                    {/* Summary chip */}
                    <div className="bg-[#f6f2ec] p-3 rounded-2xl border border-[#ebe3d7] text-xs space-y-1">
                      <div className="flex justify-between font-bold text-[#171513]">
                        <span>{selectedService.title}</span>
                        <span>{selectedService.price}</span>
                      </div>
                      <div className="text-[11px] text-[#78716c] flex items-center gap-2">
                        <span>📅 {selectedDay} às {selectedTime}</span>
                        <span>•</span>
                        <span>👤 {selectedProfessional.name}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#57534e] block mb-1">
                        Seu nome completo
                      </label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#ded5c8] bg-white focus:outline-none focus:ring-2 focus:ring-[#af7e56]"
                        placeholder="Ex: João da Silva"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#57534e] block mb-1">
                        Seu WhatsApp (para envio do lembrete)
                      </label>
                      <input
                        type="tel"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#ded5c8] bg-white focus:outline-none focus:ring-2 focus:ring-[#af7e56]"
                        placeholder="(11) 99999-9999"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Confirmar Agendamento</span>
                      </button>
                    </div>

                    <p className="text-[10px] text-center text-[#8c827a] flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Sem necessidade de criar senha ou conta.
                    </p>
                  </form>
                )}

                {/* STATE: SUCCESS CONFIRMATION & SIMULATED WHATSAPP PUSH */}
                {isConfirmed && (
                  <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in-95">
                    <div className="w-14 h-14 bg-[#e8f7ee] text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-[#c6ecd5]">
                      <CheckCircle className="w-8 h-8" />
                    </div>

                    <div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Agendamento Confirmado!
                      </span>
                      <h4 className="text-base font-bold text-[#171513] mt-2">
                        Perfeito, {clientName.split(' ')[0]}!
                      </h4>
                      <p className="text-xs text-[#6b645c] mt-1">
                        Seu horário foi reservado com sucesso no AgendamentoON.
                      </p>
                    </div>

                    {/* Booking Details Card */}
                    <div className="bg-white p-3.5 rounded-2xl border border-[#ebe4da] text-xs text-left space-y-1.5 shadow-2xs">
                      <div className="flex justify-between border-b border-[#f3eee7] pb-1.5">
                        <span className="text-[#8c827a]">Serviço:</span>
                        <span className="font-bold text-[#171513]">{selectedService.title}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#f3eee7] pb-1.5">
                        <span className="text-[#8c827a]">Profissional:</span>
                        <span className="font-bold text-[#171513]">{selectedProfessional.name}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#f3eee7] pb-1.5">
                        <span className="text-[#8c827a]">Data e hora:</span>
                        <span className="font-bold text-emerald-700">{selectedDay} às {selectedTime}</span>
                      </div>
                      <div className="flex justify-between pt-0.5">
                        <span className="text-[#8c827a]">Valor:</span>
                        <span className="font-bold text-[#af7e56]">{selectedService.price}</span>
                      </div>
                    </div>

                    {/* WhatsApp notification push preview */}
                    <div className="bg-[#1c1917] text-white p-3 rounded-2xl text-left border border-[#3b342b] shadow-md">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-full bg-[#25d366] flex items-center justify-center">
                          <MessageCircle className="w-3 h-3 text-white fill-white" />
                        </div>
                        <span className="text-[11px] font-bold text-[#25d366]">Lembrete WhatsApp enviado para {clientPhone}</span>
                      </div>
                      <p className="text-[10px] text-[#cfc8bd] leading-tight">
                        &ldquo;Agendamento confirmado no {niche.name}! Adicionamos à sua agenda do Google.&rdquo;
                      </p>
                    </div>

                    <button
                      onClick={handleReset}
                      className="w-full bg-[#f4eee6] hover:bg-[#ebded0] text-[#57534e] py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Testar outro agendamento</span>
                    </button>
                  </div>
                )}

              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
