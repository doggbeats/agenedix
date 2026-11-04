import React from "react";
import { ArrowRight, CalendarCheck, Check, LockKeyhole, MessageCircle } from "lucide-react";
import { BUSINESS_NICHES } from "../data/mockData";

interface HeroSectionProps {
  onOpenSignup: () => void;
  onOpenBookingModal: (preselectedService?: string) => void;
}

const statusStyles: Record<string, string> = {
  Confirmado: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Pendente: "bg-amber-50 text-amber-700 ring-amber-200",
  Atendimento: "bg-brand/10 text-brand-hover ring-brand/20",
  Concluído: "bg-slate-100 text-slate-600 ring-slate-200",
};

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenSignup,
  onOpenBookingModal,
}) => {
  const appointments = BUSINESS_NICHES[0].sampleAppointments.slice(0, 3);

  return (
    <section className="relative overflow-hidden border-b border-line">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-fade opacity-70" />

      <div className="container-page relative grid gap-14 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16 lg:pb-28">
        <div className="animate-rise">
          <p className="eyebrow">Agenda online para negócios de serviço</p>

          <h1 className="display-title mt-5 max-w-[16ch] text-[42px] text-ink sm:text-[56px] lg:text-[64px]">
            Menos mensagens. Mais horários ocupados.
          </h1>

          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted sm:text-base">
            Seus clientes escolhem serviço, profissional e horário em uma página com a sua
            marca. Sua equipe acompanha tudo em um painel único, sem planilha e sem
            overbooking.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onOpenSignup}
              className="group inline-flex items-center justify-center gap-2 rounded-[10px] bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-hover"
            >
              Começar teste de 7 dias
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={() => onOpenBookingModal()}
              className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-line bg-white px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-slate-300 hover:bg-surface"
            >
              Ver agenda de exemplo
            </button>
          </div>

          <p className="mt-4 text-xs text-muted">
            7 dias de teste no cartão · Pix à vista · sem fidelidade
          </p>

          <dl className="mt-10 grid max-w-xl gap-x-6 gap-y-4 border-t border-line pt-6 sm:grid-cols-2">
            {[
              { icon: CalendarCheck, label: "Horários validados no servidor" },
              { icon: LockKeyhole, label: "Dados isolados por estabelecimento" },
              { icon: Check, label: "Página com a identidade do negócio" },
              { icon: MessageCircle, label: "Contato por WhatsApp em um clique" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-2.5 text-[13px] text-slate-700">
                <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                <span>{item.label}</span>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative animate-rise [animation-delay:120ms]">
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_30px_80px_-50px_rgba(11,18,32,0.45)]">
            <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <span className="ml-2 flex-1 truncate rounded-md border border-line bg-white px-2.5 py-1 font-mono text-[10px] text-slate-500">
                agendamentoon.com.br/barbearia-nobre
              </span>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                    Painel · agenda
                  </p>
                  <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-ink">
                    Hoje, terça-feira
                  </h2>
                </div>
                <span className="rounded-md border border-line bg-surface px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  3 horários livres
                </span>
              </div>

              <div className="mt-5 space-y-1">
                {appointments.map((item) => (
                  <div key={item.id} className="group flex gap-3 rounded-lg p-2 transition-colors hover:bg-surface">
                    <div className="w-12 shrink-0 pt-0.5 text-right">
                      <p className="font-mono text-[11px] font-medium text-ink">{item.time}</p>
                      <p className="text-[9px] uppercase tracking-wide text-slate-400">
                        {item.duration}
                      </p>
                    </div>
                    <div className="relative flex w-px justify-center bg-line">
                      <span className="absolute top-2 h-1.5 w-1.5 rounded-full bg-brand" />
                    </div>
                    <div className="min-w-0 flex-1 pb-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="truncate text-[13px] font-semibold text-ink">
                          {item.service}
                        </p>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                            statusStyles[item.status] ?? statusStyles.Confirmado
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-muted">
                        {item.client} · com {item.professional}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-line pt-3">
                <div className="text-[11px] text-muted">
                  Próximo horário livre{" "}
                  <span className="font-mono font-semibold text-ink">15:00</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand">
                  Abrir agenda <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-line bg-white p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                Hoje
              </p>
              <p className="mt-1 font-display text-xl font-semibold text-ink">7 atendimentos</p>
              <p className="mt-0.5 text-[11px] text-muted">3 confirmados · 1 pendente</p>
            </div>
            <div className="rounded-xl border border-line bg-white p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                Página pública
              </p>
              <p className="mt-1 font-display text-xl font-semibold text-ink">Online</p>
              <p className="mt-0.5 text-[11px] text-muted">Compartilhada no Instagram</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
