"use client";

import { useActionState } from "react";
import { Alert, FieldError, inputClass, labelClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { initialActionState } from "@/lib/action-utils";
import { updateSubscriptionAction } from "@/lib/actions/admin";
import { SUBSCRIPTION_LABELS } from "@/lib/constants";

export function AdminSubscriptionForm({
  establishmentId,
  plans,
  subscription,
}: {
  establishmentId: string;
  plans: Array<{ id: string; name: string }>;
  subscription: {
    planId: string;
    status: keyof typeof SUBSCRIPTION_LABELS;
    billingCycle: "MONTHLY" | "YEARLY";
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    notes: string | null;
  };
}) {
  const [state, formAction] = useActionState(updateSubscriptionAction, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="establishmentId" value={establishmentId} />
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor={`plan-${establishmentId}`}>
            Plano
          </label>
          <select
            id={`plan-${establishmentId}`}
            name="planId"
            defaultValue={subscription.planId}
            className={inputClass}
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
          <FieldError messages={state.fieldErrors?.planId} />
        </div>
        <div>
          <label className={labelClass} htmlFor={`status-${establishmentId}`}>
            Status da assinatura
          </label>
          <select
            id={`status-${establishmentId}`}
            name="status"
            defaultValue={subscription.status}
            className={inputClass}
          >
            {(Object.keys(SUBSCRIPTION_LABELS) as Array<keyof typeof SUBSCRIPTION_LABELS>).map(
              (status) => (
                <option key={status} value={status}>
                  {SUBSCRIPTION_LABELS[status]}
                </option>
              ),
            )}
          </select>
          <FieldError messages={state.fieldErrors?.status} />
        </div>
        <div>
          <label className={labelClass} htmlFor={`cycle-${establishmentId}`}>
            Ciclo
          </label>
          <select
            id={`cycle-${establishmentId}`}
            name="billingCycle"
            defaultValue={subscription.billingCycle}
            className={inputClass}
          >
            <option value="MONTHLY">Mensal</option>
            <option value="YEARLY">Anual</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor={`trial-${establishmentId}`}>
            Fim do teste
          </label>
          <input
            id={`trial-${establishmentId}`}
            name="trialEndsAt"
            type="date"
            defaultValue={subscription.trialEndsAt ?? ""}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.trialEndsAt} />
        </div>
        <div>
          <label className={labelClass} htmlFor={`period-${establishmentId}`}>
            Fim do período atual
          </label>
          <input
            id={`period-${establishmentId}`}
            name="currentPeriodEnd"
            type="date"
            defaultValue={subscription.currentPeriodEnd ?? ""}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.currentPeriodEnd} />
        </div>
        <div>
          <label className={labelClass} htmlFor={`notes-${establishmentId}`}>
            Observação interna
          </label>
          <input
            id={`notes-${establishmentId}`}
            name="notes"
            maxLength={500}
            defaultValue={subscription.notes ?? ""}
            placeholder="Forma de pagamento, contato, referência..."
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.notes} />
        </div>
      </div>

      <p className="text-[10px] leading-relaxed text-slate-500">
        A alteração é manual e registrada em auditoria. Não há cobrança automática nesta
        plataforma.
      </p>
      <SubmitButton variant="brand">Salvar assinatura</SubmitButton>
    </form>
  );
}
