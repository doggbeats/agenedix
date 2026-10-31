"use client";

import { useActionState } from "react";
import { Alert, FieldError, inputClass, labelClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { initialActionState } from "@/lib/action-utils";
import { anonymizeCustomerAction } from "@/lib/actions/customers";

export function CustomerAnonymizeForm({ customerId }: { customerId: string }) {
  const [state, formAction] = useActionState(anonymizeCustomerAction, initialActionState);

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-xl border border-red-200 bg-red-50/60 p-4"
    >
      <input type="hidden" name="customerId" value={customerId} />
      <div>
        <p className="text-sm font-semibold text-red-900">Excluir dados pessoais (LGPD)</p>
        <p className="mt-1 text-xs leading-relaxed text-red-800">
          O nome, telefone, e-mail e observações serão apagados. O histórico financeiro e os
          atendimentos permanecem de forma anônima. Esta ação não pode ser desfeita.
        </p>
      </div>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}
      <div>
        <label className={labelClass} htmlFor="anonymize-confirmation">
          Digite EXCLUIR para confirmar
        </label>
        <input
          id="anonymize-confirmation"
          name="confirmation"
          required
          autoComplete="off"
          className={inputClass}
        />
        <FieldError messages={state.fieldErrors?.confirmation} />
      </div>
      <SubmitButton variant="danger">Anonimizar cliente</SubmitButton>
    </form>
  );
}
