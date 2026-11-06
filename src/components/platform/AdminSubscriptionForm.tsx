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
  plans: Array<{ id: string; name: string; active?: boolean }>;
  subscription: {
    planId: string;
    status: keyof typeof SUBSCRIPTION_LABELS;
    billingCycle: "MONTHLY" | "YEARLY";
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    notes: string | null;
  } | null;
}) {
  const [state, formAction] = useActionState(updateSubscriptionAction, initialActionState);

  if (plans.length === 0) {
    return (
      <Alert tone="warning">
        Nenhum plano cadastrado na plataforma. Crie um plano em Planos antes de vincular uma
        assinatura a este cliente.
      </Alert>
    );
  }

  const selectedPlanId =
    subscription?.planId ??
    plans.find((plan) => plan.active)?.id ??
    plans[0]?.id ??
    "";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="establishmentId" value={establishmentId} />
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}
      {!subscription && (
        <Alert tone="info">
          Este cliente ainda não tem assinatura. Escolha o plano e a situação abaixo para criar o
          vínculo. O painel e a página pública passam a respeitar essas datas.
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor={`plan-${establishmentId}`}>
            Plano
          </label>
          <select
            id={`plan-${establishmentId}`}
            name="planId"
            defaultValue={selectedPlanId}
            className={inputClass}
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
                {plan.active === false ? " (inativo)" : ""}
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
            defaultValue={subscription?.status ?? "TRIALING"}
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
            defaultValue={subscription?.billingCycle ?? "MONTHLY"}
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
            defaultValue={subscription?.trialEndsAt ?? ""}
            className={inputClass}
          />
          <p className="mt-1 text-[10px] text-slate-500">
            Em branco, o teste usa os dias definidos no plano.
          </p>
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
            defaultValue={subscription?.currentPeriodEnd ?? ""}
            className={inputClass}
          />
          <p className="mt-1 text-[10px] text-slate-500">
            Em branco, uma assinatura ativa recebe 30 dias a partir de hoje.
          </p>
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
            defaultValue={subscription?.notes ?? ""}
            placeholder="Forma de pagamento, contato, referência..."
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.notes} />
        </div>
      </div>

      <p className="text-[10px] leading-relaxed text-slate-500">
        A alteração é manual e registrada em auditoria. Em assinaturas do Pagar.me ou da
        InfinitePay, a cobrança automática continua sendo controlada pelo provedor.
      </p>
      <SubmitButton variant="brand">
        {subscription ? "Salvar assinatura" : "Criar assinatura"}
      </SubmitButton>
    </form>
  );
}
