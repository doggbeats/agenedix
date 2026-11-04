"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  LockKeyhole,
  RotateCcw,
  Server,
} from "lucide-react";
import { BUSINESS_NICHES } from "../data/mockData";

const stepCopy = {
  1: {
    title: "O serviço define o tempo",
    description:
      "Duração, preço e intervalo entre atendimentos vêm do cadastro. A duração é o que abre os horários possíveis.",
  },
  2: {
    title: "Cada profissional tem a própria agenda",
    description:
      "A pessoa vê apenas quem executa o serviço escolhido. A opção “qualquer profissional” cruza as agendas disponíveis.",
  },
  3: {
    title: "O servidor calcula a disponibilidade",
    description:
      "Funcionamento, jornada, pausas, bloqueios, antecedência e conflitos entram na conta. Horário ocupado não aparece.",
  },
  4: {
    title: "A reserva é revalidada antes de confirmar",
    description:
      "O servidor confere o horário outra vez e a base impede dois agendamentos no mesmo intervalo.",
  },
} as const;

const timeSlots = ["09:00", "09:40", "10:20", "11:00", "13:30", "14:10", "15:00", "16:30"];

const dayOptions = [
  { label: "Hoje", short: "HQ" },
  { label: "Amanhã", short: "AM" },
  { label: "Em 2 dias", short: "+2" },
  { label: "Em 3 dias", short: "+3" },
];

export const LiveBookingSimulator: React.FC = () => {
  const [nicheIndex, setNicheIndex] = useState(0);
  const niche = BUSINESS_NICHES[nicheIndex];

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [serviceId, setServiceId] = useState(niche.services[0].id);
  const [professionalId, setProfessionalId] = useState<string>("any");
  const [day, setDay] = useState(dayOptions[0].label);
  const [time, setTime] = useState("11:00");
  const [name, setName] = useState("Mariana Oliveira");
  const [phone, setPhone] = useState("(11) 98765-4321");
  const [confirmed, setConfirmed] = useState(false);

  const service = niche.services.find((item) => item.id === serviceId) ?? niche.services[0];
  const professional =
    professionalId === "any"
      ? null
      : niche.professionals.find((item) => item.id === professionalId) ?? null;

  const switchNiche = (index: number) => {
    const next = BUSINESS_NICHES[index];
    setNicheIndex(index);
    setServiceId(next.services[0].id);
    setProfessionalId("any");
    setStep(1);
    setConfirmed(false);
  };

  const reset = () => {
    setConfirmed(false);
    setStep(1);
  };

  return (
    <section id="demonstracao" className="border-b border-line py-20 sm:py-28">
      <div className="container-page">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow">Demonstração</p>
            <h2 className="display-title mt-4 text-3xl text-ink sm:text-4xl lg:text-[44px]">
              Veja o fluxo de reserva do seu cliente.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              Escolha um segmento e percorra as etapas. É uma simulação da página pública,
              com dados de exemplo.
            </p>
          </div>
          <div
            className="flex flex-wrap gap-1.5 rounded-[10px] border border-line bg-surface p-1"
            role="tablist"
            aria-label="Segmento da demonstração"
          >
            {BUSINESS_NICHES.map((item, index) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={index === nicheIndex}
                onClick={() => switchNiche(index)}
                className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition ${
                  index === nicheIndex
                    ? "bg-white text-ink shadow-sm ring-1 ring-line"
                    : "text-muted hover:text-ink"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-12">
          <div className="mx-auto w-full max-w-md lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_28px_70px_-50px_rgba(11,18,32,0.4)]">
              <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-2.5">
                <span className="h-2 w-2 rounded-full bg-slate-300" />
                <span className="h-2 w-2 rounded-full bg-slate-300" />
                <span className="h-2 w-2 rounded-full bg-slate-300" />
                <span className="ml-2 flex-1 truncate rounded-md border border-line bg-white px-2.5 py-1 font-mono text-[9px] text-slate-500">
                  agendamentoon.com.br/agendar/{niche.id}
                </span>
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3 border-b border-line pb-4">
                  <div>
                    <p className="font-display text-base font-semibold tracking-tight text-ink">
                      {niche.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">{niche.tagline}</p>
                  </div>
                  <span className="shrink-0 rounded-md border border-line bg-surface px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-muted">
                    Exemplo
                  </span>
                </div>

                {!confirmed ? (
                  <>
                    <ol className="mt-4 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                      {["Serviço", "Profissional", "Horário", "Confirmação"].map((label, index) => {
                        const value = (index + 1) as 1 | 2 | 3 | 4;
                        const active = step === value;
                        const done = step > value;
                        return (
                          <li key={label} className="flex flex-1 items-center gap-1.5">
                            <span
                              className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-[8px] ${
                                active
                                  ? "bg-brand text-white"
                                  : done
                                    ? "bg-ink text-white"
                                    : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {done ? <Check className="h-2.5 w-2.5" /> : value}
                            </span>
                            <span className={active ? "text-ink" : ""}>{label}</span>
                          </li>
                        );
                      })}
                    </ol>

                    <div className="mt-5 min-h-[318px]">
                      {step === 1 && (
                        <div className="space-y-2">
                          {niche.services.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setServiceId(item.id)}
                              className={`flex w-full items-start justify-between gap-3 rounded-lg border p-3 text-left transition ${
                                item.id === serviceId
                                  ? "border-brand bg-brand/5"
                                  : "border-line bg-white hover:border-slate-300"
                              }`}
                            >
                              <span>
                                <span className="block text-[12px] font-semibold text-ink">
                                  {item.title}
                                </span>
                                <span className="mt-0.5 block text-[10px] text-muted">
                                  {item.duration} · {item.price}
                                </span>
                              </span>
                              <span
                                className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                                  item.id === serviceId
                                    ? "border-brand bg-brand text-white"
                                    : "border-slate-300"
                                }`}
                              >
                                {item.id === serviceId && <Check className="h-2.5 w-2.5" />}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {step === 2 && (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => setProfessionalId("any")}
                            className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${
                              professionalId === "any"
                                ? "border-brand bg-brand/5"
                                : "border-line bg-white hover:border-slate-300"
                            }`}
                          >
                            <span>
                              <span className="block text-[12px] font-semibold text-ink">
                                Qualquer profissional
                              </span>
                              <span className="mt-0.5 block text-[10px] text-muted">
                                Mostra os horários de toda a equipe
                              </span>
                            </span>
                            <span
                              className={`grid h-4 w-4 place-items-center rounded-full border ${
                                professionalId === "any"
                                  ? "border-brand bg-brand text-white"
                                  : "border-slate-300"
                              }`}
                            >
                              {professionalId === "any" && <Check className="h-2.5 w-2.5" />}
                            </span>
                          </button>
                          {niche.professionals.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setProfessionalId(item.id)}
                              className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition ${
                                item.id === professionalId
                                  ? "border-brand bg-brand/5"
                                  : "border-line bg-white hover:border-slate-300"
                              }`}
                            >
                              <span className="flex items-center gap-2.5">
                                <span className="grid h-7 w-7 place-items-center rounded-full bg-paper text-[9px] font-semibold text-slate-600">
                                  {item.initials}
                                </span>
                                <span>
                                  <span className="block text-[12px] font-semibold text-ink">
                                    {item.name}
                                  </span>
                                  <span className="text-[10px] text-muted">{item.role}</span>
                                </span>
                              </span>
                              <span
                                className={`grid h-4 w-4 place-items-center rounded-full border ${
                                  item.id === professionalId
                                    ? "border-brand bg-brand text-white"
                                    : "border-slate-300"
                                }`}
                              >
                                {item.id === professionalId && <Check className="h-2.5 w-2.5" />}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {step === 3 && (
                        <div className="space-y-4">
                          <div>
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                              Dia
                            </p>
                            <div className="grid grid-cols-4 gap-1.5">
                              {dayOptions.map((item) => (
                                <button
                                  key={item.label}
                                  type="button"
                                  onClick={() => setDay(item.label)}
                                  className={`rounded-md border px-1 py-2 text-center transition ${
                                    day === item.label
                                      ? "border-ink bg-ink text-white"
                                      : "border-line bg-white text-slate-600 hover:border-slate-300"
                                  }`}
                                >
                                  <span className="block text-[9px] opacity-70">{item.short}</span>
                                  <span className="block text-[10px] font-semibold">{item.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                              Horário
                            </p>
                            <div className="grid grid-cols-4 gap-1.5">
                              {timeSlots.map((item) => (
                                <button
                                  key={item}
                                  type="button"
                                  onClick={() => setTime(item)}
                                  className={`rounded-md border py-2 font-mono text-[11px] transition ${
                                    time === item
                                      ? "border-brand bg-brand text-white"
                                      : "border-line bg-white text-slate-600 hover:border-slate-300"
                                  }`}
                                >
                                  {item}
                                </button>
                              ))}
                            </div>
                          </div>
                          <p className="text-[10px] leading-relaxed text-muted">
                            Horários indisponíveis não aparecem. A lista é calculada no momento da
                            consulta.
                          </p>
                        </div>
                      )}

                      {step === 4 && (
                        <div className="space-y-3">
                          <div className="rounded-lg border border-line bg-surface p-3 text-[11px]">
                            <div className="flex justify-between gap-3">
                              <span className="text-muted">Serviço</span>
                              <span className="text-right font-semibold text-ink">{service.title}</span>
                            </div>
                            <div className="mt-1.5 flex justify-between gap-3">
                              <span className="text-muted">Profissional</span>
                              <span className="text-right font-semibold text-ink">
                                {professional?.name ?? "Qualquer profissional"}
                              </span>
                            </div>
                            <div className="mt-1.5 flex justify-between gap-3">
                              <span className="text-muted">Data</span>
                              <span className="text-right font-semibold text-ink">
                                {day} às {time}
                              </span>
                            </div>
                            <div className="mt-1.5 flex justify-between gap-3">
                              <span className="text-muted">Valor</span>
                              <span className="text-right font-semibold text-ink">{service.price}</span>
                            </div>
                          </div>
                          <label className="block">
                            <span className="mb-1 block text-[10px] font-semibold text-slate-600">
                              Seu nome
                            </span>
                            <input
                              value={name}
                              onChange={(event) => setName(event.target.value)}
                              className="w-full rounded-md border border-line bg-white px-3 py-2 text-[11px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1 block text-[10px] font-semibold text-slate-600">
                              WhatsApp
                            </span>
                            <input
                              value={phone}
                              onChange={(event) => setPhone(event.target.value)}
                              inputMode="tel"
                              className="w-full rounded-md border border-line bg-white px-3 py-2 text-[11px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                            />
                          </label>
                          <p className="text-[10px] leading-relaxed text-muted">
                            O cliente não cria senha nem conta. A confirmação traz protocolo e link
                            de acesso.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex items-center gap-2 border-t border-line pt-4">
                      {step > 1 && (
                        <button
                          type="button"
                          onClick={() => setStep((step - 1) as 1 | 2 | 3 | 4)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line text-slate-600 transition hover:bg-surface"
                          aria-label="Voltar uma etapa"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (step < 4) {
                            setStep((step + 1) as 1 | 2 | 3 | 4);
                          } else {
                            setConfirmed(true);
                          }
                        }}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-ink px-4 py-2.5 text-[11px] font-semibold text-white transition hover:bg-[#1b2638]"
                      >
                        {step < 4 ? "Continuar" : "Confirmar agendamento"}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="pt-4">
                    <span className="grid h-11 w-11 place-items-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-ink">
                      Agendamento confirmado.
                    </h3>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted">
                      {name.split(" ")[0]}, seu horário está reservado. Esta é uma simulação:
                      nenhum dado foi enviado.
                    </p>

                    <dl className="mt-4 space-y-2 rounded-lg border border-line bg-surface p-3 text-[11px]">
                      {[
                        ["Protocolo", "AG-7F3K2"],
                        ["Serviço", service.title],
                        ["Profissional", professional?.name ?? "A definir"],
                        ["Data", `${day} às ${time}`],
                        ["Contato", phone],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-3">
                          <dt className="text-muted">{label}</dt>
                          <dd className="text-right font-semibold text-ink">{value}</dd>
                        </div>
                      ))}
                    </dl>

                    <p className="mt-3 text-[10px] leading-relaxed text-muted">
                      Na versão real, o cliente recebe um link para consultar ou cancelar o
                      agendamento dentro do prazo configurado.
                    </p>

                    <button
                      type="button"
                      onClick={reset}
                      className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-line bg-white px-4 py-2.5 text-[11px] font-semibold text-ink transition hover:border-slate-300"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Testar outro agendamento
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:pt-4">
            <div className="rounded-xl border border-line bg-surface p-6 sm:p-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                Etapa {step} de 4
              </p>
              <h3 className="mt-2 font-display text-xl font-semibold tracking-tight text-ink">
                {stepCopy[step].title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                {stepCopy[step].description}
              </p>

              <div className="mt-6 space-y-3 border-t border-line pt-5">
                {[
                  {
                    icon: Server,
                    title: "Disponibilidade no servidor",
                    description: "O navegador nunca decide sozinho se um horário está livre.",
                  },
                  {
                    icon: LockKeyhole,
                    title: "Sem conflito de horário",
                    description: "A base impede dois agendamentos no mesmo intervalo.",
                  },
                  {
                    icon: CalendarCheck,
                    title: "Confirmação rastreável",
                    description: "Protocolo, status e link de cancelamento para o cliente.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-line bg-white text-slate-600">
                      <item.icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-[12px] font-semibold text-ink">{item.title}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-line bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[13px] font-semibold text-ink">
                  Quer testar com os dados do seu negócio?
                </p>
                <p className="mt-0.5 text-[11px] text-muted">
                  7 dias no cartão ou primeiro período no Pix.
                </p>
              </div>
              <Link
                href="/cadastro"
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[10px] bg-brand px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-brand-hover"
              >
                Criar conta <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
