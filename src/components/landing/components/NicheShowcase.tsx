import React, { useState } from 'react';
import { 
  Scissors, 
  Sparkles, 
  Smile, 
  Dumbbell, 
  Check, 
  ArrowRight,
  ShieldAlert,
  Clock,
  Coins
} from 'lucide-react';

interface NicheShowcaseProps {
  onOpenSignup: () => void;
}

export const NicheShowcase: React.FC<NicheShowcaseProps> = ({ onOpenSignup }) => {
  const [activeTab, setActiveTab] = useState<'barbearia' | 'estetica' | 'saude' | 'fitness'>('barbearia');

  const niches = {
    barbearia: {
      badge: 'Barbearias & Salões Masculinos',
      icon: <Scissors className="w-5 h-5 text-[#af7e56]" />,
      title: 'Chega de parar o corte para responder no WhatsApp.',
      description: 'Deixe seus clientes escolherem o barbeiro favorito e o combo na hora que quiserem, até mesmo na madrugada de domingo.',
      painPointsSolved: [
        'Elimina a perda de tempo digitando horários vagos no WhatsApp',
        'Divide a comissão de cada barbeiro automaticamente no fechamento do dia',
        'Lembrete automático 2 horas antes reduz cadeiras vazias no sábado',
        'Catálogo visual com fotos de cortes e barboterapia'
      ],
      metricTitle: '-90% de interrupções durante o expediente',
      demoCard: {
        title: 'Barbearia Dom Pedro',
        slots: ['09:00 - Rafael (Corte)', '10:00 - Rafael (Barba)', '11:00 - Bruno (Combo)'],
        stat: 'R$ 1.480 faturados no sábado'
      }
    },
    estetica: {
      badge: 'Clínicas & Procedimentos Estéticos',
      icon: <Sparkles className="w-5 h-5 text-pink-600" />,
      title: 'Proteja horários caros com cobrança de sinal antecipado.',
      description: 'Procedimentos de 1 a 2 horas não podem sofrer com no-show de última hora. Exija um valor de reserva via PIX e fidelize suas pacientes.',
      painPointsSolved: [
        'Cobrança de sinal (ex: R$ 50 ou 50%) para travar a vaga',
        'Envio de orientações pré-procedimento no WhatsApp (ex: jejum ou não passar ácidos)',
        'Ficha de anamnese e histórico dos procedimentos de cada paciente',
        'Reagendamento automático de retorno de Botox em 15 dias'
      ],
      metricTitle: '+ R$ 3.800 recuperados em no-shows no 1º mês',
      demoCard: {
        title: 'Dra. Camila Rocha Estética',
        slots: ['10:00 - Harmonização (Sinal R$ 100 pago)', '14:00 - Limpeza de Pele', '16:00 - Bioestimulador'],
        stat: '100% dos sinais recebidos via PIX'
      }
    },
    saude: {
      badge: 'Psicólogos, Terapeutas & Médicos',
      icon: <Smile className="w-5 h-5 text-indigo-600" />,
      title: 'Atendimentos presenciais e online no Google Meet sem esforço.',
      description: 'Quando seu paciente marca a sessão online, o link seguro da videochamada é gerado sozinho e enviado junto com o recibo.',
      painPointsSolved: [
        'Criação automática da sala segura do Google Meet',
        'Lembrete discreto e empático respeitando a privacidade do paciente',
        'Organização de pacotes mensais ou sessões avulsas',
        'Sincronização com Google Agenda pessoal para evitar conflitos'
      ],
      metricTitle: 'Pontualidade máxima em consultas remotas',
      demoCard: {
        title: 'Espaço Terapêutico Mente Sã',
        slots: ['08:00 - Terapia Online (Link Meet)', '10:00 - Presencial Sala 2', '15:00 - Avaliação'],
        stat: '32 pacientes ativos com recorrência'
      }
    },
    fitness: {
      badge: 'Studios de Pilates & Personal VIP',
      icon: <Dumbbell className="w-5 h-5 text-emerald-600" />,
      title: 'Controle de vagas limitadas e lista de espera inteligente.',
      description: 'Defina o limite exato de alunos por turma (ex: 3 alunos no reformer). Se alguém desmarcar, a vaga é ofertada automaticamente para a fila.',
      painPointsSolved: [
        'Limite rígido de alunos por aparelho para manter o padrão VIP',
        'Lista de espera automática que notifica quem estiver na fila no WhatsApp',
        'Regra de cancelamento com até 2h de antecedência para reposição',
        'Check-in rápido na entrada do studio'
      ],
      metricTitle: 'Ocupação média das turmas sobe para 96%',
      demoCard: {
        title: 'Studio Flow Pilates',
        slots: ['07:00 - Pilates (3/3 vagas)', '08:00 - Pilates (3/3 vagas)', '17:00 - Yoga Vinyasa'],
        stat: 'Lista de espera preencheu 8 cancelamentos'
      }
    }
  };

  const current = niches[activeTab];

  return (
    <section id="nichos" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#e4ded5] bg-[#f5efe6] text-[#8f5e3b] text-xs font-semibold uppercase tracking-wider mb-4">
            <Coins className="w-3.5 h-3.5" />
            <span>Versatilidade para o seu ramo</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#171513] tracking-tight">
            Projetado para negócios com atendimento agendado
          </h2>
          <p className="mt-4 text-[#6b645c] text-base sm:text-lg">
            Descubra como o AgendamentoON se adapta às particularidades e regras específicas do seu modelo de negócio.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-12">
          <button
            onClick={() => setActiveTab('barbearia')}
            className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'barbearia'
                ? 'bg-[#171513] text-white shadow-md'
                : 'bg-white hover:bg-[#ede7df] text-[#57534e] border border-[#ded5c8]'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Barbearias & Salões</span>
          </button>

          <button
            onClick={() => setActiveTab('estetica')}
            className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'estetica'
                ? 'bg-[#171513] text-white shadow-md'
                : 'bg-white hover:bg-[#ede7df] text-[#57534e] border border-[#ded5c8]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Clínicas & Estética</span>
          </button>

          <button
            onClick={() => setActiveTab('saude')}
            className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'saude'
                ? 'bg-[#171513] text-white shadow-md'
                : 'bg-white hover:bg-[#ede7df] text-[#57534e] border border-[#ded5c8]'
            }`}
          >
            <Smile className="w-4 h-4" />
            <span>Psicólogos & Terapia</span>
          </button>

          <button
            onClick={() => setActiveTab('fitness')}
            className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'fitness'
                ? 'bg-[#171513] text-white shadow-md'
                : 'bg-white hover:bg-[#ede7df] text-[#57534e] border border-[#ded5c8]'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span>Pilates & Studios</span>
          </button>
        </div>

        {/* Content Box */}
        <div className="bg-white rounded-3xl border border-[#e5dfd4] shadow-elevated p-6 sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Details */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#af7e56] uppercase tracking-wider mb-3">
                {current.icon}
                <span>{current.badge}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#171513] tracking-tight leading-snug mb-4">
                {current.title}
              </h3>
              <p className="text-[#6b645c] text-base leading-relaxed mb-6">
                {current.description}
              </p>

              {/* Bullet points */}
              <div className="space-y-3 mb-8">
                {current.painPointsSolved.map((point, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#f4eee6] text-[#af7e56] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm text-[#38332d] font-medium leading-relaxed">
                      {point}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={onOpenSignup}
                className="bg-[#af7e56] hover:bg-[#9d6d48] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-warm inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Configurar agenda para {activeTab}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Right Column: Visual Case Preview */}
            <div className="lg:col-span-5">
              <div className="bg-[#fcfbf9] rounded-2xl border border-[#ece4d9] p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-[#ece4d9]">
                  <div>
                    <span className="text-[10px] font-bold text-[#8c827a] uppercase tracking-wider block">
                      Painel Operacional
                    </span>
                    <h5 className="font-bold text-base text-[#171513]">{current.demoCard.title}</h5>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Ao Vivo
                  </span>
                </div>

                <div className="py-4 space-y-2.5">
                  {current.demoCard.slots.map((slot, i) => (
                    <div key={i} className="p-3 bg-white rounded-xl border border-[#ede8e1] flex items-center justify-between text-xs">
                      <span className="font-medium text-[#1c1917]">{slot}</span>
                      <span className="text-emerald-600 font-bold">Confirmado</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-[#ece4d9] flex items-center justify-between text-xs font-semibold text-[#8f5e3b] bg-[#fbf5ef] p-3 rounded-xl">
                  <span>{current.demoCard.stat}</span>
                  <Clock className="w-4 h-4" />
                </div>

                <div className="mt-4 p-3 rounded-xl bg-[#241f1c] text-white text-xs flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-[11px] text-[#e8dfd3] font-medium">
                    {current.metricTitle}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
