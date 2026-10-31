import React from 'react';
import { ArrowRight, Sparkles, Check } from 'lucide-react';

interface CtaBannerProps {
  onOpenSignup: () => void;
  onOpenBookingDemo: () => void;
}

export const CtaBanner: React.FC<CtaBannerProps> = ({ onOpenSignup, onOpenBookingDemo }) => {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-gradient-to-br from-[#241f1c] via-[#2f2824] to-[#1c1917] rounded-[36px] p-8 sm:p-14 lg:p-16 text-white relative overflow-hidden shadow-2xl border border-[#453c35]">
          
          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#af7e56]/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-[#e8cbb5] text-xs font-semibold tracking-wider uppercase mb-6 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Experimente grátis por 7 dias</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight mb-6">
              A sua agenda merece a <br className="hidden sm:inline" />
              praticidade do Agendix.
            </h2>

            <p className="text-[#d8cebe] text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-8 font-normal">
              Cadastre seu negócio em 2 minutos. Envie seu link exclusivo para seus clientes hoje mesmo e sinta o alívio de ter sua rotina organizada.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <button
                onClick={onOpenSignup}
                className="w-full sm:w-auto bg-[#af7e56] hover:bg-[#9d6d48] text-white px-8 py-4 rounded-xl font-bold text-base shadow-warm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Criar minha conta gratuita</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={onOpenBookingDemo}
                className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white border border-white/20 px-6 py-4 rounded-xl font-semibold text-base transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Ver demonstração interativa</span>
              </button>
            </div>

            {/* Checkmarks */}
            <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-[#c4b9aa]">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                <span>Sem necessidade de cartão de crédito</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                <span>Configuração em menos de 5 minutos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                <span>Cancele a qualquer momento</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
