"use client";

import { useActionState } from "react";
import { Alert, FieldError, inputClass, labelClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { initialActionState } from "@/lib/action-utils";
import { createTimeBlockAction } from "@/lib/actions/settings";

export function TimeBlockForm({
  professionals,
  defaultDate,
}: {
  professionals: Array<{ id: string; name: string }>;
  defaultDate: string;
}) {
  const [state, formAction] = useActionState(createTimeBlockAction, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="block-professional">
            Profissional
          </label>
          <select
            id="block-professional"
            name="professionalId"
            defaultValue="all"
            className={inputClass}
          >
            <option value="all">Todos os profissionais</option>
            {professionals.map((professional) => (
              <option key={professional.id} value={professional.id}>
                {professional.name}
              </option>
            ))}
          </select>
          <FieldError messages={state.fieldErrors?.professionalId} />
        </div>
        <div>
          <label className={labelClass} htmlFor="block-date">
            Data
          </label>
          <input
            id="block-date"
            name="date"
            type="date"
            required
            defaultValue={defaultDate}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.date} />
        </div>
        <div>
          <label className={labelClass} htmlFor="block-start">
            Início
          </label>
          <input
            id="block-start"
            name="startTime"
            type="time"
            required
            defaultValue="12:00"
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.startTime} />
        </div>
        <div>
          <label className={labelClass} htmlFor="block-end">
            Fim
          </label>
          <input
            id="block-end"
            name="endTime"
            type="time"
            required
            defaultValue="13:00"
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.endTime} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="block-reason">
            Motivo
          </label>
          <input
            id="block-reason"
            name="reason"
            maxLength={200}
            placeholder="Ex.: almoço, compromisso, manutenção"
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.reason} />
        </div>
      </div>

      <SubmitButton variant="brand">Bloquear horário</SubmitButton>
    </form>
  );
}
