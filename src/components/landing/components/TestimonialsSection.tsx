import React from 'react';
import Image from 'next/image';
import { Star, Quote } from 'lucide-react';
import { TESTIMONIALS } from '../data/mockData';

export const TestimonialsSection: React.FC = () => {
  return (
    <section id="depoimentos" className="py-20 md:py-28 bg-[#faf7f2] border-t border-[#ede8e1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#e4ded5] bg-white text-[#8f5e3b] text-xs font-semibold uppercase tracking-wider mb-4">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>Casos de Sucesso Reais</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#171513] tracking-tight">
            Quem usa o AgendamentoON não volta atrás
          </h2>
          <p className="mt-4 text-[#6b645c] text-base sm:text-lg">
            Veja o que profissionais autônomos e gestores de clínicas e barbearias relatam sobre a transformação no seu dia a dia.
          </p>
        </div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-7 sm:p-8 border border-[#e5dfd4] shadow-soft hover:shadow-elevated transition-all flex flex-col justify-between"
            >
              <div>
                {/* Metric pill */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4eee6] text-[#8f5e3b] text-xs font-bold mb-6">
                  <span>{item.highlightMetric}</span>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-1 mb-4 text-amber-400">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <div className="relative mb-6">
                  <Quote className="w-6 h-6 text-[#e8dfd2] absolute -top-2 -left-1 -z-0 opacity-50" />
                  <p className="text-sm text-[#44403c] leading-relaxed relative z-10 italic">
                    &ldquo;{item.content}&rdquo;
                  </p>
                </div>
              </div>

              {/* Author info */}
              <div className="pt-4 border-t border-[#f0ece5] flex items-center gap-3">
                <Image
                  src={item.avatar}
                  alt={item.name}
                  width={44}
                  height={44}
                  className="w-11 h-11 rounded-full object-cover border border-[#e0d7cb]"
                />
                <div>
                  <h4 className="text-xs font-bold text-[#171513]">{item.name}</h4>
                  <p className="text-[11px] text-[#78716c]">{item.role}</p>
                  <p className="text-[10px] text-[#8c827a] font-medium">{item.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
