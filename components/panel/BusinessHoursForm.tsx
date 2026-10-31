"use client";

import { useActionState } from "react";
import { Alert, FieldError } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { initialActionState } from "@/lib/action-utils";
import { updateBusinessHoursAction } from "@/lib/actions/settings";
import { WEEKDAYS } from "@/lib/constants";
import { minutesToTime } from "@/lib/format";

export type BusinessHoursValues = {
  weekday: number;
  isOpen: boolean;
  openMinute: number;
  closeMinute: number;
  breakStartMinute: number | null;
  breakEndMinute: number | null;
};

export function BusinessHoursForm({ hours }: { hours: BusinessHoursValues[] }) {
  const [state, formAction] = useActionState(updateBusinessHoursAction, initialActionState);

  return (
    <form action={formAction} className="space-y-3">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="min-w-full text-sm">
          <thead className="bg-paper text-left text-[10px] uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-3 py-2 font-semibold">Dia</th>
              <th className="px-3 py-2 font-semibold">Aberto</th>
              <th className="px-3 py-2 font-semibold">Abre</th>
              <th className="px-3 py-2 font-semibold">Fecha</th>
              <th className="px-3 py-2 font-semibold">Pausa início</th>
              <th className="px-3 py-2 font-semibold">Pausa fim</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {WEEKDAYS.map((day) => {
              const value =
                hours.find((hour) => hour.weekday === day.value) ?? {
                  weekday: day.value,
                  isOpen: day.value !== 0,
                  openMinute: 540,
                  closeMinute: 1080,
                  breakStartMinute: day.value !== 0 ? 720 : null,
                  breakEndMinute: day.value !== 0 ? 780 : null,
                };
              return (
                <tr key={day.value} className="bg-white align-middle">
                  <td className="px-3 py-2 text-xs font-semibold text-ink">{day.label}</td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      name={`isOpen_${day.value}`}
                      defaultChecked={value.isOpen}
                      aria-label={`Aberto em ${day.label}`}
                      className="h-4 w-4 rounded border-slate-300 accent-brand"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="time"
                      name={`openTime_${day.value}`}
                      defaultValue={minutesToTime(value.openMinute)}
                      aria-label={`Abertura ${day.label}`}
                      className="rounded-lg border border-line px-2 py-1.5 text-xs"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="time"
                      name={`closeTime_${day.value}`}
                      defaultValue={minutesToTime(value.closeMinute)}
                      aria-label={`Fechamento ${day.label}`}
                      className="rounded-lg border border-line px-2 py-1.5 text-xs"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="time"
                      name={`breakStart_${day.value}`}
                      defaultValue={
                        value.breakStartMinute != null
                          ? minutesToTime(value.breakStartMinute)
                          : ""
                      }
                      aria-label={`Pausa início ${day.label}`}
                      className="rounded-lg border border-line px-2 py-1.5 text-xs"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="time"
                      name={`breakEnd_${day.value}`}
                      defaultValue={
                        value.breakEndMinute != null ? minutesToTime(value.breakEndMinute) : ""
                      }
                      aria-label={`Pausa fim ${day.label}`}
                      className="rounded-lg border border-line px-2 py-1.5 text-xs"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {state.fieldErrors &&
        Object.entries(state.fieldErrors).map(([key, messages]) => (
          <FieldError key={key} messages={messages} />
        ))}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-slate-500">
          O horário de funcionamento limita a agenda de todos os profissionais. Pausa é opcional.
        </p>
        <SubmitButton variant="brand">Salvar horários</SubmitButton>
      </div>
    </form>
  );
}
