import React, { useState, useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

const LIVE_EVENTS = [
  {
    icon: '💈',
    title: 'Barbearia Dom Pedro (SP)',
    description: 'Novo agendamento: Corte Masculino com Rafael às 15:00',
    time: 'há 2 minutos'
  },
  {
    icon: '✨',
    title: 'Lumina Estética (PR)',
    description: 'Sinal de R$ 90 confirmado via PIX para Limpeza de Pele',
    time: 'há 4 minutos'
  },
  {
    icon: '🧘',
    title: 'Studio Flow Pilates (MG)',
    description: 'Vaga da lista de espera preenchida automaticamente',
    time: 'há 7 minutos'
  },
  {
    icon: '💬',
    title: 'WhatsApp Bot AgendamentoON',
    description: 'Lembrete de confirmação enviado para 14 clientes',
    time: 'agora mesmo'
  }
];

export const NotificationToast: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isDismissed) return;

    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % LIVE_EVENTS.length);
        setIsVisible(true);
      }, 500);
    }, 6000);

    return () => clearInterval(interval);
  }, [isDismissed]);

  if (isDismissed) return null;

  const current = LIVE_EVENTS[currentIndex];

  return (
    <div
      className={`fixed bottom-5 left-5 z-40 max-w-sm transition-all duration-500 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="bg-[#1c1917]/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-[#3d362e] flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-white/10 text-base flex items-center justify-center shrink-0">
          {current.icon}
        </div>
        <div className="flex-1 pr-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#e6dcd0] flex items-center gap-1.5">
              <span>{current.title}</span>
              <CheckCircle className="w-3 h-3 text-emerald-400" />
            </span>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-[#8c827a] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-[#c4baad] mt-0.5 leading-snug">
            {current.description}
          </p>
          <span className="text-[10px] text-[#8c827a] block mt-1">
            {current.time}
          </span>
        </div>
      </div>
    </div>
  );
};
