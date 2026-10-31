"use client";

import { useActionState, useState } from "react";
import { Alert, FieldError, inputClass, labelClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { initialActionState } from "@/lib/action-utils";
import { registerManualPaymentAction } from "@/lib/actions/admin";

export type ManualPaymentTarget = {
  id: string;
  name: string;
  planName: string;
  status: string;
  suggestedAmount: number;
  currentPeriodEnd: string | null;
};

export function ManualPaymentForm({ establishments }: { establishments: ManualPaymentTarget[] }) {
  const [state, formAction] = useActionState(
    registerManualPaymentAction,
    initialActionState,
  );
  const [selectedId, setSelectedId] = useState(establishments[0]?.id ?? "");
  const selected =
    establishments.find((item) => item.id === selectedId) ?? establishments[0] ?? null;

  if (establishments.length === 0) {
    return (
      <Alert tone="warning">
        Nenhum estabelecimento com assinatura vinculada. Crie a assinatura em
        Estabelecimentos antes de registrar pagamentos.
      </Alert>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="payment-establishment">
            Estabelecimento
          </label>
          <select
            id="payment-establishment"
            name="establishmentId"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className={inputClass}
          >
            {establishments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.planName} · {item.status}
              </option>
            ))}
          </select>
          <FieldError messages={state.fieldErrors?.establishmentId} />
          {selected?.currentPeriodEnd && (
            <p className="mt-1 text-[10px] text-slate-500">
              Período atual até {selected.currentPeriodEnd}. O novo pagamento estende a partir
              dessa data.
            </p>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="payment-amount">
            Valor recebido (R$)
          </label>
          <input
            id="payment-amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            key={selected?.id}
            defaultValue={selected?.suggestedAmount?.toFixed(2) ?? ""}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.amount} />
        </div>

        <div>
          <label className={labelClass} htmlFor="payment-method">
            Forma de pagamento
          </label>
          <input
            id="payment-method"
            name="method"
            maxLength={40}
            defaultValue="Pix"
            placeholder="Pix, cartão, transferência..."
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.method} />
        </div>

        <div>
          <label className={labelClass} htmlFor="payment-paid-at">
            Data do pagamento
          </label>
          <input
            id="payment-paid-at"
            name="paidAt"
            type="date"
            className={inputClass}
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
          <FieldError messages={state.fieldErrors?.paidAt} />
        </div>

        <div>
          <label className={labelClass} htmlFor="payment-extend-days">
            Estender o período em (dias)
          </label>
          <input
            id="payment-extend-days"
            name="extendDays"
            type="number"
            min={0}
            max={400}
            defaultValue={30}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.extendDays} />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="payment-notes">
            Observação interna
          </label>
          <input
            id="payment-notes"
            name="notes"
            maxLength={300}
            placeholder="Referência, comprovante, contato..."
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.notes} />
        </div>
      </div>

      <label className="flex items-start gap-2.5 rounded-lg border border-line bg-paper px-3 py-2.5 text-xs text-slate-700">
        <input
          type="checkbox"
          name="activate"
          defaultChecked
          className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-brand"
        />
        <span>
          <span className="block font-semibold text-ink">Ativar a assinatura</span>
          <span className="block text-[10px] leading-relaxed text-slate-500">
            Marca a assinatura como ativa e encerra o período de teste. Desmarque para apenas
            registrar o pagamento.
          </span>
        </span>
      </label>

      <SubmitButton variant="brand" pendingLabel="Registrando...">
        Registrar pagamento
      </SubmitButton>
    </form>
  );
}
