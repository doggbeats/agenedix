import React, { useState } from 'react';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';
import { FAQ_ITEMS } from '../data/mockData';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 md:py-28 relative bg-white border-t border-[#ede8e1]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#e4ded5] bg-[#f5efe6] text-[#8f5e3b] text-xs font-semibold uppercase tracking-wider mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Tire suas dúvidas</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#171513] tracking-tight">
            Perguntas Frequentes
          </h2>
          <p className="mt-3 text-[#6b645c] text-sm sm:text-base">
            Tudo o que você precisa saber antes de começar o seu teste gratuito de 7 dias.
          </p>
        </div>

        {/* Accordion list */}
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'border-[#af7e56]/40 bg-[#fbf9f6] shadow-xs'
                    : 'border-[#ede7de] bg-white hover:border-[#ded5c8]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="w-full text-left px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-bold text-sm sm:text-base text-[#1c1917]">
                    {item.q}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full bg-[#f4eee6] text-[#af7e56] flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-[#af7e56] text-white' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-[#57534e] leading-relaxed border-t border-[#f2ede6] animate-in fade-in slide-in-from-top-1">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Direct Contact Support Box */}
        <div className="mt-12 p-6 rounded-2xl bg-[#fdfaf7] border border-[#ebd8cb] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#25d366]/15 text-[#25d366] flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#171513]">Ainda tem alguma dúvida específica?</h4>
              <p className="text-xs text-[#78716c]">Nossa equipe de consultores atende no WhatsApp em minutos.</p>
            </div>
          </div>

          <a
            href="https://wa.me/?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20o%20AgendamentoON"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#241f1c] hover:bg-[#38332d] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shrink-0 inline-flex items-center gap-2"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Falar com especialista</span>
          </a>
        </div>

      </div>
    </section>
  );
};
