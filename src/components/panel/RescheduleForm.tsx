"use client";

import { useEffect, useMemo, useRef, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Alert, FieldError, inputClass, labelClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { initialActionState } from "@/lib/action-utils";
import { rescheduleFormAction } from "@/lib/actions/appointments";

type ProfessionalOption = { id: string; name: string };
type Slot = { time: string; professionalIds: string[]; suggestedProfessionalId: string | null };

export function RescheduleForm({
  appointmentId,
  serviceId,
  professionals,
  defaultProfessionalId,
  defaultDate,
  defaultTime,
  maxDate,
}: {
  appointmentId: string;
  serviceId: string;
  professionals: ProfessionalOption[];
  defaultProfessionalId: string;
  defaultDate: string;
  defaultTime: string;
  maxDate: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(rescheduleFormAction, initialActionState);
  const [professionalId, setProfessionalId] = useState(defaultProfessionalId);
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [slotState, setSlotState] = useState<{ key: string; slots: Slot[]; error: string }>({
    key: "",
    slots: [],
    error: "",
  });
  const requestId = useRef(0);
  const refreshed = useRef(false);

  const requestKey = `${appointmentId}|${serviceId}|${professionalId}|${date}`;
  const loading = Boolean(serviceId && date) && slotState.key !== requestKey;
  const slotsError = slotState.key === requestKey ? slotState.error : "";

  useEffect(() => {
    if (state.ok && !refreshed.current) {
      refreshed.current = true;
      router.refresh();
    }
  }, [state.ok, router]);

  useEffect(() => {
    if (!serviceId || !date) return;
    const key = requestKey;
    const current = ++requestId.current;
    const controller = new AbortController();

    fetch(
      `/api/painel/availability?serviceId=${encodeURIComponent(serviceId)}&professionalId=${encodeURIComponent(professionalId)}&date=${encodeURIComponent(date)}&exclude=${encodeURIComponent(appointmentId)}`,
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
  }, [appointmentId, requestKey, serviceId, professionalId, date]);

  const effectiveSlots = useMemo(() => {
    const slots = slotState.key === requestKey ? slotState.slots : [];
    if (time && !slots.some((slot) => slot.time === time)) {
      return [{ time, professionalIds: [], suggestedProfessionalId: null }, ...slots].sort((a, b) =>
        a.time.localeCompare(b.time),
      );
    }
    return slots;
  }, [slotState, requestKey, time]);
  const visibleSlots = serviceId && date ? effectiveSlots : [];

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="appointmentId" value={appointmentId} />
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="reschedule-professional">
            Profissional
          </label>
          <select
            id="reschedule-professional"
            name="professionalId"
            value={professionalId}
            onChange={(event) => {
              setProfessionalId(event.target.value);
              setTime("");
            }}
            className={inputClass}
          >
            <option value="any">Qualquer profissional disponível</option>
            {professionals.map((professional) => (
              <option key={professional.id} value={professional.id}>
                {professional.name}
              </option>
            ))}
          </select>
          <FieldError messages={state.fieldErrors?.professionalId} />
        </div>
        <div>
          <label className={labelClass} htmlFor="reschedule-date">
            Nova data
          </label>
          <input
            id="reschedule-date"
            name="date"
            type="date"
            required
            max={maxDate}
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setTime("");
            }}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.date} />
        </div>
      </div>

      <div>
        <span className={labelClass}>Novo horário</span>
        <input type="hidden" name="time" value={time} />
        {loading ? (
          <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-xs text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : slotsError ? (
          <Alert tone="error">{slotsError}</Alert>
        ) : visibleSlots.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-3 py-2.5 text-xs text-slate-500">
            Nenhum horário livre nesta data.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {visibleSlots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                onClick={() => setTime(slot.time)}
                aria-pressed={time === slot.time}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                  time === slot.time
                    ? "border-ink bg-brand text-white"
                    : "border-line bg-white text-ink hover:bg-paper"
                }`}
              >
                {slot.time}
              </button>
            ))}
          </div>
        )}
        <FieldError messages={state.fieldErrors?.time} />
      </div>

      <SubmitButton variant="secondary" disabled={!time}>
        Salvar novo horário
      </SubmitButton>
    </form>
  );
}
