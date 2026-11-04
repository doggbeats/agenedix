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
  imageUrl: string | null;
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
  timezone,
  services,
  professionals,
  dates,
  whatsappUrl,
}: {
  slug: string;
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
      <div className="rounded-[calc(var(--brand-radius)*1.4)] border border-[var(--brand-line)] bg-[var(--brand-bg)] p-8 text-center">
        <Scissors className="mx-auto h-6 w-6 text-[var(--brand)]" />
        <p className="mt-3 font-semibold text-[var(--brand-text)]">
          Nenhum serviço disponível para agendamento online.
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
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
    { id: "etapa-horario", number: "3", label: "Data e hora", done: Boolean(selectedTime) },
    { id: "etapa-dados", number: "4", label: "Confirmar", done: false },
  ];
  const currentStep = selectedTime ? 4 : 3;

  return (
    <div>
      <ol className="mb-6 grid grid-cols-4 gap-3" aria-label="Etapas do agendamento">
        {steps.map((step, index) => {
          const active = index + 1 === currentStep;
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => goToStep(step.id)}
                aria-current={active ? "step" : undefined}
                className="group w-full text-left"
              >
                <span
                  className={`block h-0.5 w-full transition-colors ${
                    step.done || active ? "bg-[var(--brand)]" : "bg-[var(--brand-line)]"
                  }`}
                  aria-hidden
                />
                <span className="mt-2.5 flex items-center gap-2">
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[9px] font-semibold transition ${
                      step.done
                        ? "border-[var(--brand-button)] bg-[var(--brand-button)] text-[var(--brand-button-text)]"
                        : active
                          ? "border-[var(--brand)] bg-[var(--brand-surface)] text-[var(--brand-text)]"
                          : "border-[var(--brand-line)] text-[var(--muted)] group-hover:border-[var(--brand)]/50"
                    }`}
                  >
                    {step.done ? <Check className="h-2.5 w-2.5" /> : step.number}
                  </span>
                  <span
                    className={`hidden truncate text-[10px] font-semibold uppercase tracking-[0.1em] sm:block ${
                      active ? "text-[var(--brand-text)]" : "text-[var(--muted)]"
                    }`}
                  >
                    {step.label}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
        <div className="min-w-0 space-y-5">
          <section
            id="etapa-servico"
            className="scroll-mt-24 rounded-[calc(var(--brand-radius)*1.4)] border border-[var(--brand-line)] bg-[var(--brand-bg)] p-4 sm:p-5"
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
                    className={`flex gap-3 rounded-[var(--brand-radius)] border p-3 text-left transition ${
                      active
                        ? "border-[var(--brand)] bg-[var(--brand-surface)]"
                        : "border-[var(--brand-line)] bg-[var(--brand-bg)] hover:border-[var(--brand)]/50"
                    }`}
                  >
                    {service.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={service.imageUrl}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-[var(--brand-radius)] border border-[var(--brand-line)] object-cover"
                      />
                    ) : (
                      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[var(--brand-radius)] bg-[var(--brand-surface)] text-[var(--brand)]">
                        <Scissors className="h-5 w-5" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="block text-sm font-semibold leading-snug text-[var(--brand-text)]">
                          {service.name}
                        </span>
                        <span
                          className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                            active
                              ? "border-[var(--brand-button)] bg-[var(--brand-button)] text-[var(--brand-button-text)]"
                              : "border-[var(--brand-line)]"
                          }`}
                        >
                          {active && <Check className="h-2.5 w-2.5" />}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-[11px] text-[var(--muted)]">
                        {service.category ? `${service.category} · ` : ""}
                        {formatDuration(service.durationMin)}
                      </span>
                      <span className="mt-1 block font-mono text-[12px] font-semibold text-[var(--brand-text)]">
                        {formatCurrency(service.price)}
                      </span>
                      {service.description && (
                        <span className="mt-1.5 line-clamp-2 block text-[11px] leading-relaxed text-[var(--muted)]">
                          {service.description}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section
            id="etapa-profissional"
            className="scroll-mt-24 rounded-[calc(var(--brand-radius)*1.4)] border border-[var(--brand-line)] bg-[var(--brand-bg)] p-4 sm:p-5"
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
                className={`flex items-center gap-3 rounded-[var(--brand-radius)] border p-3 text-left transition ${
                  professionalId === "any"
                    ? "border-[var(--brand)] bg-[var(--brand-surface)]"
                    : "border-[var(--brand-line)] bg-[var(--brand-bg)] hover:border-[var(--brand)]/50"
                }`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--brand-surface)] text-[var(--brand)]">
                  <Users className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[var(--brand-text)]">
                    Qualquer profissional
                  </span>
                  <span className="block text-[11px] text-[var(--muted)]">
                    Mostra todos os horários livres
                  </span>
                </span>
                <span
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                    professionalId === "any"
                      ? "border-[var(--brand-button)] bg-[var(--brand-button)] text-[var(--brand-button-text)]"
                      : "border-[var(--brand-line)]"
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
                    className={`flex items-center gap-3 rounded-[var(--brand-radius)] border p-3 text-left transition ${
                      active
                        ? "border-[var(--brand)] bg-[var(--brand-surface)]"
                        : "border-[var(--brand-line)] bg-[var(--brand-bg)] hover:border-[var(--brand)]/50"
                    }`}
                  >
                    {professional.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={professional.photoUrl}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full border border-[var(--brand-line)] object-cover"
                      />
                    ) : (
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--brand-surface)] text-[11px] font-semibold text-[var(--brand)]">
                        {professional.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[var(--brand-text)]">
                        {professional.name}
                      </span>
                      <span className="block truncate text-[11px] text-[var(--muted)]">
                        {professional.specialties ?? "Profissional"}
                      </span>
                    </span>
                    <span
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                        active
                          ? "border-[var(--brand-button)] bg-[var(--brand-button)] text-[var(--brand-button-text)]"
                          : "border-[var(--brand-line)]"
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
            className="scroll-mt-24 rounded-[calc(var(--brand-radius)*1.4)] border border-[var(--brand-line)] bg-[var(--brand-bg)] p-4 sm:p-5"
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
                    className={`min-w-[64px] shrink-0 rounded-[var(--brand-radius)] border px-2 py-3 text-center transition ${
                      active
                        ? "border-[var(--brand-button)] bg-[var(--brand-button)] text-[var(--brand-button-text)]"
                        : "border-[var(--brand-line)] bg-[var(--brand-bg)] text-[var(--brand-text)] hover:border-[var(--brand)]/50"
                    }`}
                  >
                    <span className="block text-[10px] font-semibold uppercase tracking-wide">
                      {item.isToday ? "Hoje" : item.weekday}
                    </span>
                    <span className="mt-1 block font-mono text-lg font-semibold leading-none">
                      {item.day}
                    </span>
                    <span
                      className={`mt-1 block text-[10px] uppercase ${
                        active ? "opacity-70" : "text-[var(--muted)]"
                      }`}
                    >
                      {item.month}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              className="mt-4 min-h-[96px] rounded-[var(--brand-radius)] border border-[var(--brand-line)] bg-[var(--brand-surface)]/60 p-3"
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
                        className="h-9 animate-pulse rounded-[var(--brand-radius)] border border-[var(--brand-line)] bg-[var(--brand-bg)]"
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
                  <p className="text-sm font-medium text-[var(--brand-text)]">
                    Nenhum horário livre neste dia.
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
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
                        className={`rounded-[var(--brand-radius)] border py-2 font-mono text-sm font-semibold transition ${
                          active
                            ? "border-[var(--brand-button)] bg-[var(--brand-button)] text-[var(--brand-button-text)]"
                            : "border-[var(--brand-line)] bg-[var(--brand-bg)] text-[var(--brand-text)] hover:border-[var(--brand)]/60"
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
            className={`scroll-mt-24 rounded-[calc(var(--brand-radius)*1.4)] border p-4 transition sm:p-5 ${
              selectedTime
                ? "border-[var(--brand)]/40 bg-[var(--brand-bg)]"
                : "border-[var(--brand-line)] bg-[var(--brand-surface)]/50"
            }`}
          >
            <StepTitle number="4" title="Seus dados" />
            {!selectedTime ? (
              <p className="mt-3 text-sm text-[var(--muted)]">
                Escolha um horário acima para liberar o formulário de confirmação.
              </p>
            ) : (
              <form onSubmit={submit} className="mt-4 space-y-3.5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="booking-name"
                      className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]"
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
                      className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]"
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
                    className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]"
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
                    className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]"
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
                <label className="flex items-start gap-2.5 text-xs leading-relaxed text-[var(--muted)]">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                    required
                    className="mt-0.5 h-4 w-4 rounded border-[var(--brand-line)] accent-[var(--brand)]"
                  />
                  <span>
                    Concordo com o uso dos meus dados para este agendamento, conforme a
                    política de privacidade do estabelecimento.
                  </span>
                </label>
                {submitError && (
                  <p
                    role="alert"
                    className="rounded-[var(--brand-radius)] border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
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
                <p className="text-center text-[10px] text-[var(--muted)]">
                  O horário é validado novamente no servidor antes de ser reservado.
                </p>
              </form>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-[calc(var(--brand-radius)*1.4)] border border-[var(--brand-line)] bg-[var(--brand-bg)]">
            <div className="border-b border-[var(--brand-line)] bg-[var(--brand-surface)]/60 px-5 py-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Resumo do agendamento
              </p>
            </div>
            <div className="p-5">
              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  {selectedService?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedService.imageUrl}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-[var(--brand-radius)] border border-[var(--brand-line)] object-cover"
                    />
                  ) : (
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--brand-radius)] bg-[var(--brand-surface)] text-[var(--brand)]">
                      <Scissors className="h-4 w-4" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      Serviço
                    </p>
                    <p className="font-medium text-[var(--brand-text)]">
                      {selectedService?.name ?? "Escolha um serviço"}
                    </p>
                    {selectedService && (
                      <p className="text-xs text-[var(--muted)]">
                        {formatDuration(selectedService.durationMin)} ·{" "}
                        {formatCurrency(selectedService.price)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--brand-radius)] bg-[var(--brand-surface)] text-[var(--brand)]">
                    <UserRound className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      Profissional
                    </p>
                    <p className="font-medium text-[var(--brand-text)]">
                      {professionalId === "any"
                        ? slotProfessional || "Qualquer profissional"
                        : (professionals.find((p) => p.id === professionalId)?.name ??
                          "Qualquer profissional")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--brand-radius)] bg-[var(--brand-surface)] text-[var(--brand)]">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      Data
                    </p>
                    <p className="font-medium text-[var(--brand-text)]">
                      {selectedDate
                        ? `${selectedDate.weekday}, ${selectedDate.day}/${selectedDate.month}`
                        : "Escolha uma data"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--brand-radius)] bg-[var(--brand-surface)] text-[var(--brand)]">
                    <Clock3 className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      Horário
                    </p>
                    <p className="font-medium text-[var(--brand-text)]">
                      {selectedTime || "Escolha um horário"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-[var(--brand-line)] pt-4">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-[var(--muted)]">Total</span>
                  <span className="font-mono text-xl font-semibold text-[var(--brand-text)]">
                    {selectedService ? formatCurrency(selectedService.price) : "—"}
                  </span>
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-[var(--muted)]">
                  Pagamento no estabelecimento. Nenhuma cobrança online.
                </p>
              </div>

              <p className="mt-3 text-center text-[10px] leading-relaxed text-[var(--muted)]">
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
      <span className="grid h-6 w-6 place-items-center rounded-full border border-[var(--brand-line)] bg-[var(--brand-surface)] font-mono text-[10px] font-semibold text-[var(--brand)]">
        {number}
      </span>
      <h2 className="text-sm font-semibold text-[var(--brand-text)] sm:text-[15px]">{title}</h2>
      <ChevronRight className="h-4 w-4 text-[var(--brand)]/40" />
    </div>
  );
}
