"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Loader2,
  MessageCircle,
  Scissors,
  UserRound,
  Users,
} from "lucide-react";
import { formatCurrency, formatDuration, maskPhoneInput } from "@/lib/format";
import { buttonTenant, inputClass } from "@/components/ui";

export type PublicService = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  durationMin: number;
  bufferMin: number;
  professionalIds: string[];
};

export type PublicProfessional = {
  id: string;
  name: string;
  bio: string | null;
  photoUrl: string | null;
  specialties: string | null;
};

export type DateOption = {
  value: string;
  weekday: string;
  day: string;
  month: string;
  isToday: boolean;
};

type Slot = {
  time: string;
  professionalIds: string[];
  suggestedProfessionalId: string | null;
};

type AvailabilityResponse = {
  slots: Slot[];
  error?: string;
};

export function BookingWizard({
  slug,
  establishmentName,
  timezone,
  services,
  professionals,
  dates,
  whatsappUrl,
}: {
  slug: string;
  establishmentName: string;
  timezone: string;
  services: PublicService[];
  professionals: PublicProfessional[];
  dates: DateOption[];
  whatsappUrl: string;
}) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [professionalId, setProfessionalId] = useState("any");
  const [date, setDate] = useState(dates[0]?.value ?? "");
  const [slotState, setSlotState] = useState<{ key: string; slots: Slot[]; error: string }>({
    key: "",
    slots: [],
    error: "",
  });
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedProfessionalName, setSelectedProfessionalName] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const requestId = useRef(0);

  const selectedService = services.find((service) => service.id === serviceId) ?? null;
  const availableProfessionals = useMemo(
    () =>
      professionals.filter(
        (professional) => !selectedService || selectedService.professionalIds.includes(professional.id),
      ),
    [professionals, selectedService],
  );

  const requestKey = `${slug}|${serviceId}|${professionalId}|${date}`;
  const slotsLoading = Boolean(serviceId && date) && slotState.key !== requestKey;
  const slots = slotState.key === requestKey ? slotState.slots : [];
  const slotsError = slotState.key === requestKey ? slotState.error : "";

  useEffect(() => {
    if (!serviceId || !date) return;
    const key = requestKey;
    const current = ++requestId.current;
    const controller = new AbortController();

    fetch(
      `/api/public/${encodeURIComponent(slug)}/availability?serviceId=${encodeURIComponent(serviceId)}&professionalId=${encodeURIComponent(professionalId)}&date=${encodeURIComponent(date)}`,
      { signal: controller.signal, cache: "no-store" },
    )
      .then(async (response) => {
        const data = (await response.json()) as AvailabilityResponse;
        if (!response.ok) throw new Error(data.error ?? "Não foi possível carregar os horários.");
        return data;
      })
      .then((data) => {
        if (current !== requestId.current) return;
        setSlotState({ key, slots: data.slots ?? [], error: "" });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (current !== requestId.current) return;
        setSlotState({
          key,
          slots: [],
          error:
            error instanceof Error ? error.message : "Não foi possível carregar os horários.",
        });
      });

    return () => controller.abort();
  }, [requestKey, slug, serviceId, professionalId, date]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTime) {
      setSubmitError("Escolha um horário antes de confirmar.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch(
        `/api/public/${encodeURIComponent(slug)}/appointments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceId,
            professionalId,
            date,
            time: selectedTime,
            name,
            phone,
            email,
            notes,
            consent,
            website,
          }),
        },
      );
      const data = (await response.json()) as {
        error?: string;
        confirmationPath?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível concluir o agendamento.");
      }
      if (!data.confirmationPath) {
        throw new Error("O agendamento foi criado, mas o link de confirmação não foi retornado.");
      }
      router.push(data.confirmationPath);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Não foi possível concluir o agendamento.",
      );
      setSubmitting(false);
    }
  }

  const selectedDate = dates.find((item) => item.value === date);
  const selectedSlot = slots.find((slot) => slot.time === selectedTime);
  const slotProfessional =
    selectedProfessionalName ||
    (selectedSlot?.suggestedProfessionalId
      ? (professionals.find((p) => p.id === selectedSlot.suggestedProfessionalId)?.name ?? "")
      : "");

  if (services.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-white p-8 text-center">
        <Scissors className="mx-auto h-6 w-6 text-slate-500" />
        <p className="mt-3 font-semibold text-slate-900">
          Nenhum serviço disponível para agendamento online.
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Fale com o estabelecimento pelo WhatsApp para verificar os horários.
        </p>
        {whatsappUrl && (
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className={`${buttonTenant} mt-4`}>
            <MessageCircle className="h-4 w-4" /> Chamar no WhatsApp
          </a>
        )}
      </div>
    );
  }

  function goToStep(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const steps = [
    { id: "etapa-servico", number: "1", label: "Serviço", done: Boolean(serviceId) },
    { id: "etapa-profissional", number: "2", label: "Profissional", done: true },
    { id: "etapa-horario", number: "3", label: "Horário", done: Boolean(selectedTime) },
    { id: "etapa-dados", number: "4", label: "Seus dados", done: false },
  ];
  const currentStep = selectedTime ? 4 : 3;

  return (
    <div>
      <div className="mb-5 rounded-xl border border-line bg-white p-2 shadow-sm">
        <ol className="grid grid-cols-4 gap-1" aria-label="Etapas do agendamento">
          {steps.map((step, index) => {
            const active = index + 1 === currentStep;
            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => goToStep(step.id)}
                  aria-current={active ? "step" : undefined}
                  className={`flex w-full flex-col items-start gap-1 rounded-lg px-2.5 py-2 text-left transition sm:flex-row sm:items-center sm:gap-2 ${
                    active
                      ? "bg-brand/10 text-brand"
                      : "text-slate-500 hover:bg-paper hover:text-ink"
                  }`}
                >
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-md text-[10px] font-semibold ${
                      step.done
                        ? "bg-brand text-white"
                        : active
                          ? "bg-white text-brand ring-1 ring-inset ring-brand/20"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {step.done ? <Check className="h-3 w-3" /> : step.number}
                  </span>
                  <span className="truncate text-[10px] font-semibold uppercase tracking-wide sm:text-[11px]">
                    {step.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
        <div className="min-w-0 space-y-5">
          <section
            id="etapa-servico"
            className="scroll-mt-24 rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5"
          >
            <StepTitle number="1" title="Escolha o serviço" />
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {services.map((service) => {
              const active = service.id === serviceId;
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => {
                    setServiceId(service.id);
                    setProfessionalId("any");
                    setSelectedTime("");
                    setSelectedProfessionalName("");
                  }}
                  aria-pressed={active}
                  className={`rounded-lg border p-3.5 text-left transition ${
                    active
                      ? "border-brand bg-brand/10"
                      : "border-line bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{service.name}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {formatDuration(service.durationMin)} · {formatCurrency(service.price)}
                      </p>
                    </div>
                    <span
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                        active ? "border-brand bg-brand text-white" : "border-slate-300"
                      }`}
                    >
                      {active && <Check className="h-3 w-3" />}
                    </span>
                  </div>
                  {service.description && (
                    <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                      {service.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </section>

          <section
            id="etapa-profissional"
            className="scroll-mt-24 rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5"
          >
            <StepTitle number="2" title="Com quem você quer atendimento?" />
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setProfessionalId("any");
                setSelectedTime("");
                setSelectedProfessionalName("");
              }}
              aria-pressed={professionalId === "any"}
              className={`flex items-center gap-3 rounded-lg border p-3.5 text-left transition ${
                professionalId === "any"
                  ? "border-brand bg-brand/10"
                  : "border-line bg-white hover:border-slate-300"
              }`}
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600">
                <Users className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900">
                  Qualquer profissional
                </span>
                <span className="block text-[11px] text-slate-500">
                  Mostra todos os horários livres
                </span>
              </span>
              <span
                className={`ml-auto grid h-4 w-4 shrink-0 place-items-center rounded-full ${
                  professionalId === "any"
                    ? "bg-brand text-white"
                    : "border border-slate-300"
                }`}
                aria-hidden
              >
                {professionalId === "any" && <Check className="h-2.5 w-2.5" />}
              </span>
            </button>
            {availableProfessionals.map((professional) => {
              const active = professionalId === professional.id;
              return (
                <button
                  key={professional.id}
                  type="button"
                  onClick={() => {
                    setProfessionalId(professional.id);
                    setSelectedTime("");
                    setSelectedProfessionalName("");
                  }}
                  aria-pressed={active}
                  className={`flex items-center gap-3 rounded-lg border p-3.5 text-left transition ${
                    active
                      ? "border-brand bg-brand/10"
                      : "border-line bg-white hover:border-slate-300"
                  }`}
                >
                  {professional.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={professional.photoUrl}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                      {professional.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900">
                      {professional.name}
                    </span>
                    <span className="block truncate text-[11px] text-slate-500">
                      {professional.specialties ?? "Profissional"}
                    </span>
                  </span>
                  <span
                    className={`ml-auto grid h-4 w-4 shrink-0 place-items-center rounded-full ${
                      active ? "bg-brand text-white" : "border border-slate-300"
                    }`}
                    aria-hidden
                  >
                    {active && <Check className="h-2.5 w-2.5" />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

          <section
            id="etapa-horario"
            className="scroll-mt-24 rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5"
          >
            <StepTitle number="3" title="Escolha o dia e o horário" />
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {dates.map((item) => {
              const active = item.value === date;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setDate(item.value);
                    setSelectedTime("");
                    setSelectedProfessionalName("");
                  }}
                  aria-pressed={active}
                  className={`min-w-[62px] shrink-0 rounded-lg border px-2 py-3 text-center transition ${
                    active
                      ? "border-brand bg-brand text-white"
                      : "border-line bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <span className="block text-[10px] font-semibold uppercase">
                    {item.isToday ? "Hoje" : item.weekday}
                  </span>
                  <span className="mt-0.5 block text-lg font-semibold leading-none">{item.day}</span>
                  <span className="mt-0.5 block text-[10px]">{item.month}</span>
                </button>
              );
            })}
          </div>

          <div
            className="mt-4 min-h-[92px] rounded-lg border border-line bg-paper p-3"
            aria-live="polite"
            aria-busy={slotsLoading}
          >
            {slotsLoading ? (
              <div role="status">
                <span className="sr-only">Buscando horários livres...</span>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5" aria-hidden>
                  {Array.from({ length: 10 }).map((_, index) => (
                    <span
                      key={index}
                      className="h-9 animate-pulse rounded-md border border-line bg-white"
                    />
                  ))}
                </div>
              </div>
            ) : slotsError ? (
              <p role="alert" className="py-6 text-center text-sm text-red-600">
                {slotsError}
              </p>
            ) : slots.length === 0 ? (
              <div className="py-5 text-center">
                <p className="text-sm font-medium text-slate-700">
                  Nenhum horário livre neste dia.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Tente outra data ou fale com o estabelecimento.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {slots.map((slot) => {
                  const active = slot.time === selectedTime;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => {
                        setSelectedTime(slot.time);
                        setSelectedProfessionalName(
                          professionalId === "any"
                            ? (professionals.find(
                                (p) => p.id === slot.suggestedProfessionalId,
                              )?.name ?? "")
                            : (professionals.find((p) => p.id === professionalId)?.name ?? ""),
                        );
                      }}
                      aria-pressed={active}
                      className={`rounded-md border py-2 text-sm font-semibold transition ${
                        active
                          ? "border-brand bg-brand text-white"
                          : "border-line bg-white text-slate-700 hover:border-brand/30"
                      }`}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

          <section
            id="etapa-dados"
            className={`scroll-mt-24 rounded-xl border p-4 shadow-sm transition sm:p-5 ${
              selectedTime
                ? "border-brand/25 bg-white"
                : "border-line bg-paper/60"
            }`}
          >
            <StepTitle number="4" title="Seus dados" />
          {!selectedTime ? (
            <p className="mt-3 text-sm text-slate-600">
              Escolha um horário acima para liberar o formulário de confirmação.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-4 space-y-3.5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="booking-name"
                    className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600"
                  >
                    Nome completo
                  </label>
                  <input
                    id="booking-name"
                    required
                    minLength={2}
                    maxLength={120}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Seu nome"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label
                    htmlFor="booking-phone"
                    className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600"
                  >
                    WhatsApp
                  </label>
                  <input
                    id="booking-phone"
                    required
                    inputMode="tel"
                    value={phone}
                    onChange={(event) => setPhone(maskPhoneInput(event.target.value))}
                    placeholder="(61) 99999-9999"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="booking-email"
                  className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600"
                >
                  E-mail (opcional)
                </label>
                <input
                  id="booking-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@exemplo.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="booking-notes"
                  className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600"
                >
                  Observações (opcional)
                </label>
                <textarea
                  id="booking-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="Alguma preferência ou informação importante?"
                  className={inputClass}
                />
              </div>
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                className="hidden"
              />
              <label className="flex items-start gap-2.5 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  required
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-brand"
                />
                <span>
                  Concordo com o uso dos meus dados para este agendamento, conforme a
                  política de privacidade do estabelecimento.
                </span>
              </label>
              {submitError && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                >
                  {submitError}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className={`${buttonTenant} w-full justify-center px-5 py-3 text-sm`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Reservando...
                  </>
                ) : (
                  <>
                    Confirmar agendamento <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
              <p className="text-center text-[10px] text-slate-500">
                O horário é validado novamente no servidor antes de ser reservado.
              </p>
            </form>
          )}
        </section>
      </div>

        <aside className="lg:sticky lg:top-20">
          <div className="overflow-hidden rounded-xl border border-line border-t-2 border-t-brand bg-white shadow-sm">
            <div className="p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
            Resumo
          </p>
          <div className="mt-4 space-y-4 text-sm">
            <div className="flex gap-3">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-slate-100">
                <Scissors className="h-4 w-4 text-slate-500" />
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Serviço</p>
                <p className="font-medium text-slate-900">
                  {selectedService?.name ?? "Escolha um serviço"}
                </p>
                {selectedService && (
                  <p className="text-xs text-slate-500">
                    {formatDuration(selectedService.durationMin)} ·{" "}
                    {formatCurrency(selectedService.price)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-slate-100">
                <UserRound className="h-4 w-4 text-slate-500" />
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Profissional
                </p>
                <p className="font-medium text-slate-900">
                  {professionalId === "any"
                    ? slotProfessional || "Qualquer profissional"
                    : (professionals.find((p) => p.id === professionalId)?.name ??
                      "Qualquer profissional")}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-slate-100">
                <CalendarDays className="h-4 w-4 text-slate-500" />
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Data</p>
                <p className="font-medium text-slate-900">
                  {selectedDate
                    ? `${selectedDate.weekday}, ${selectedDate.day}/${selectedDate.month}`
                    : "Escolha uma data"}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-slate-100">
                <Clock3 className="h-4 w-4 text-slate-500" />
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Horário</p>
                <p className="font-medium text-slate-900">
                  {selectedTime || "Escolha um horário"}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 border-t border-line pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Total</span>
              <span className="text-lg font-semibold text-slate-900">
                {selectedService ? formatCurrency(selectedService.price) : "—"}
              </span>
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              Pagamento no estabelecimento. Nenhuma cobrança online.
            </p>
          </div>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-line px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-brand/30 hover:text-brand"
            >
              <MessageCircle className="h-4 w-4" />
              Falar com {establishmentName}
            </a>
          )}
          <p className="mt-3 text-center text-[10px] leading-relaxed text-slate-500">
            Fuso horário: {timezone}. Agendamentos online podem exigir confirmação do
            estabelecimento.
          </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StepTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-6 w-6 place-items-center rounded-md bg-brand/10 font-mono text-[11px] font-semibold text-brand">
        {number}
      </span>
      <h2 className="text-sm font-semibold text-slate-900 sm:text-base">{title}</h2>
      <ChevronRight className="h-4 w-4 text-slate-300" />
    </div>
  );
}
