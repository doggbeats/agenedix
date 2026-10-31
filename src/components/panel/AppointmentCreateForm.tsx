"use client";

import { useEffect, useMemo, useRef, useState, useActionState } from "react";
import Link from "next/link";
import { CalendarCheck, Loader2, MessageCircle } from "lucide-react";
import { Alert, FieldError, inputClass, labelClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import {
  createAppointmentAction,
  type CreateAppointmentState,
} from "@/lib/actions/appointments";
import { formatCurrency, formatDuration, maskPhoneInput } from "@/lib/format";

type ServiceOption = {
  id: string;
  name: string;
  price: number;
  durationMin: number;
  professionalIds: string[];
};

type ProfessionalOption = { id: string; name: string };

type Slot = {
  time: string;
  professionalIds: string[];
  suggestedProfessionalId: string | null;
};

export function AppointmentCreateForm({
  services,
  professionals,
  timezone,
  defaultDate,
  maxDate,
  supportMessage,
}: {
  services: ServiceOption[];
  professionals: ProfessionalOption[];
  timezone: string;
  defaultDate: string;
  maxDate: string;
  supportMessage: string;
}) {
  const [state, formAction] = useActionState(createAppointmentAction, {} as CreateAppointmentState);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [professionalId, setProfessionalId] = useState("any");
  const [date, setDate] = useState(defaultDate);
  const [phone, setPhone] = useState("");
  const [slotState, setSlotState] = useState<{ key: string; slots: Slot[]; error: string }>({
    key: "",
    slots: [],
    error: "",
  });
  const [selectedTime, setSelectedTime] = useState("");
  const requestId = useRef(0);

  const selectedService = services.find((service) => service.id === serviceId) ?? null;
  const availableProfessionals = useMemo(
    () =>
      professionals.filter(
        (professional) =>
          !selectedService || selectedService.professionalIds.includes(professional.id),
      ),
    [professionals, selectedService],
  );
  const effectiveProfessionalId =
    professionalId === "any" ||
    availableProfessionals.some((professional) => professional.id === professionalId)
      ? professionalId
      : "any";

  const requestKey = `${serviceId}|${effectiveProfessionalId}|${date}`;
  const loading = Boolean(serviceId && date) && slotState.key !== requestKey;
  const slots = slotState.key === requestKey ? slotState.slots : [];
  const slotsError = slotState.key === requestKey ? slotState.error : "";

  function clearSelection() {
    setSelectedTime("");
  }

  useEffect(() => {
    if (!serviceId || !date) return;
    const key = requestKey;
    const current = ++requestId.current;
    const controller = new AbortController();

    fetch(
      `/api/painel/availability?serviceId=${encodeURIComponent(serviceId)}&professionalId=${encodeURIComponent(effectiveProfessionalId)}&date=${encodeURIComponent(date)}`,
      { signal: controller.signal, cache: "no-store" },
    )
      .then(async (response) => {
        const data = (await response.json()) as { slots?: Slot[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Não foi possível carregar os horários.");
        return data;
      })
      .then((data) => {
        if (current !== requestId.current) return;
        setSlotState({ key, slots: data.slots ?? [], error: "" });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || current !== requestId.current) return;
        setSlotState({
          key,
          slots: [],
          error: error instanceof Error ? error.message : "Erro ao carregar horários.",
        });
      });

    return () => controller.abort();
  }, [requestKey, serviceId, effectiveProfessionalId, date]);

  if (state.ok) {
    return (
      <div className="space-y-4 rounded-xl border border-green-200 bg-green-50/60 p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white">
            <CalendarCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-ink">{state.message ?? "Agendamento criado."}</p>
            <p className="mt-1 text-sm text-slate-600">
              Protocolo <strong className="font-mono">{state.protocol}</strong>. A confirmação
              ao cliente é manual: use o botão de WhatsApp para enviar a mensagem pronta.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {state.whatsappUrl && (
            <a
              href={state.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
            >
              <MessageCircle className="h-4 w-4" /> Enviar no WhatsApp
            </a>
          )}
          {state.confirmationUrl && (
            <a
              href={state.confirmationUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink"
            >
              Ver confirmação do cliente
            </a>
          )}
          <Link
            href={`/painel/agendamentos?protocolo=${encodeURIComponent(state.protocol ?? "")}`}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink"
          >
            Abrir no painel
          </Link>
          <Link
            href="/painel/agendamentos?novo=1"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Criar outro
          </Link>
        </div>
        <p className="text-[11px] text-slate-500">{supportMessage}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.fieldErrors && (
        <Alert tone="warning">
          Revise os campos destacados antes de confirmar o agendamento.
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="new-customer-name">
            Cliente
          </label>
          <input
            id="new-customer-name"
            name="customerName"
            required
            maxLength={120}
            placeholder="Nome completo"
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.customerName} />
        </div>
        <div>
          <label className={labelClass} htmlFor="new-customer-phone">
            WhatsApp do cliente
          </label>
          <input
            id="new-customer-phone"
            name="customerPhone"
            inputMode="tel"
            required
            value={phone}
            onChange={(event) => setPhone(maskPhoneInput(event.target.value))}
            placeholder="(61) 99999-9999"
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.customerPhone} />
        </div>

        <div>
          <label className={labelClass} htmlFor="new-service">
            Serviço
          </label>
          <select
            id="new-service"
            name="serviceId"
            required
            value={serviceId}
            onChange={(event) => {
              setServiceId(event.target.value);
              setProfessionalId("any");
              clearSelection();
            }}
            className={inputClass}
          >
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} · {formatCurrency(service.price)} ·{" "}
                {formatDuration(service.durationMin)}
              </option>
            ))}
          </select>
          <FieldError messages={state.fieldErrors?.serviceId} />
        </div>
        <div>
          <label className={labelClass} htmlFor="new-professional">
            Profissional
          </label>
          <select
            id="new-professional"
            name="professionalId"
            required
            value={effectiveProfessionalId}
            onChange={(event) => {
              setProfessionalId(event.target.value);
              clearSelection();
            }}
            className={inputClass}
          >
            <option value="any">Qualquer profissional disponível</option>
            {availableProfessionals.map((professional) => (
              <option key={professional.id} value={professional.id}>
                {professional.name}
              </option>
            ))}
          </select>
          <FieldError messages={state.fieldErrors?.professionalId} />
        </div>

        <div>
          <label className={labelClass} htmlFor="new-date">
            Data
          </label>
          <input
            id="new-date"
            name="date"
            type="date"
            required
            min={defaultDate}
            max={maxDate}
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              clearSelection();
            }}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.date} />
        </div>
        <div className="sm:col-span-2">
          <span className={labelClass}>Horário</span>
          <input type="hidden" name="time" value={selectedTime} />
          {loading ? (
            <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-3 text-xs text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando horários disponíveis...
            </div>
          ) : slotsError ? (
            <Alert tone="error">{slotsError}</Alert>
          ) : slots.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-paper px-3 py-3 text-xs text-slate-600">
              Nenhum horário livre nesta data para a seleção. Tente outro dia ou profissional.
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => setSelectedTime(slot.time)}
                  aria-pressed={selectedTime === slot.time}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                    selectedTime === slot.time
                      ? "border-ink bg-brand text-white"
                      : "border-line bg-white text-ink hover:bg-paper"
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
          {selectedTime ? (
            <p className="mt-1.5 text-[11px] text-slate-500">
              Horário selecionado: <strong className="text-ink">{selectedTime}</strong> · fuso{" "}
              {timezone}
            </p>
          ) : (
            <p className="mt-1.5 text-[11px] text-slate-500">
              Selecione um horário livre. A disponibilidade é recalculada no servidor ao salvar.
            </p>
          )}
          <FieldError messages={state.fieldErrors?.time} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="new-notes">
            Observações internas
          </label>
          <textarea
            id="new-notes"
            name="notes"
            rows={2}
            maxLength={500}
            placeholder="Preferências, alergias, combinados..."
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.notes} />
        </div>
      </div>

      <div className="flex justify-end">
        <SubmitButton variant="brand" pendingLabel="Criando agendamento...">
          Confirmar agendamento
        </SubmitButton>
      </div>
    </form>
  );
}

