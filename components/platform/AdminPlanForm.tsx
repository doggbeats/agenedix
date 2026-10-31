"use client";

import { useActionState } from "react";
import { Alert, FieldError, inputClass, labelClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { initialActionState } from "@/lib/action-utils";
import { createPlanAction, updatePlanAction } from "@/lib/actions/admin";

export type PlanFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  priceMonthly: string;
  priceYearly: string;
  maxProfessionals: string;
  maxServices: string;
  maxAppointmentsMonth: string;
  trialDays: string;
  features: string;
  active: boolean;
  isDemo: boolean;
};

const emptyPlan: PlanFormValues = {
  name: "",
  slug: "",
  description: "",
  priceMonthly: "0",
  priceYearly: "0",
  maxProfessionals: "3",
  maxServices: "20",
  maxAppointmentsMonth: "",
  trialDays: "14",
  features: "",
  active: true,
  isDemo: false,
};

export function AdminPlanForm({
  mode,
  plan = emptyPlan,
}: {
  mode: "create" | "update";
  plan?: PlanFormValues;
}) {
  const [state, formAction] = useActionState(
    mode === "create" ? createPlanAction : updatePlanAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      {plan.id && <input type="hidden" name="id" value={plan.id} />}
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor={`plan-name-${plan.id ?? "new"}`}>
            Nome
          </label>
          <input
            id={`plan-name-${plan.id ?? "new"}`}
            name="name"
            required
            maxLength={80}
            defaultValue={plan.name}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.name} />
        </div>
        <div>
          <label className={labelClass} htmlFor={`plan-slug-${plan.id ?? "new"}`}>
            Identificador
          </label>
          <input
            id={`plan-slug-${plan.id ?? "new"}`}
            name="slug"
            required
            maxLength={40}
            defaultValue={plan.slug}
            placeholder="essencial"
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.slug} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor={`plan-description-${plan.id ?? "new"}`}>
            Descrição
          </label>
          <textarea
            id={`plan-description-${plan.id ?? "new"}`}
            name="description"
            rows={2}
            maxLength={300}
            defaultValue={plan.description}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.description} />
        </div>
        <div>
          <label className={labelClass} htmlFor={`plan-monthly-${plan.id ?? "new"}`}>
            Preço mensal (R$)
          </label>
          <input
            id={`plan-monthly-${plan.id ?? "new"}`}
            name="priceMonthly"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={plan.priceMonthly}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.priceMonthly} />
        </div>
        <div>
          <label className={labelClass} htmlFor={`plan-yearly-${plan.id ?? "new"}`}>
            Preço anual (R$)
          </label>
          <input
            id={`plan-yearly-${plan.id ?? "new"}`}
            name="priceYearly"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={plan.priceYearly}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.priceYearly} />
        </div>
        <div>
          <label className={labelClass} htmlFor={`plan-professionals-${plan.id ?? "new"}`}>
            Máximo de profissionais
          </label>
          <input
            id={`plan-professionals-${plan.id ?? "new"}`}
            name="maxProfessionals"
            type="number"
            min="1"
            max="500"
            required
            defaultValue={plan.maxProfessionals}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.maxProfessionals} />
        </div>
        <div>
          <label className={labelClass} htmlFor={`plan-services-${plan.id ?? "new"}`}>
            Máximo de serviços
          </label>
          <input
            id={`plan-services-${plan.id ?? "new"}`}
            name="maxServices"
            type="number"
            min="1"
            max="1000"
            required
            defaultValue={plan.maxServices}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.maxServices} />
        </div>
        <div>
          <label className={labelClass} htmlFor={`plan-appointments-${plan.id ?? "new"}`}>
            Limite de agendamentos/mês
          </label>
          <input
            id={`plan-appointments-${plan.id ?? "new"}`}
            name="maxAppointmentsMonth"
            type="number"
            min="1"
            placeholder="Vazio = ilimitado"
            defaultValue={plan.maxAppointmentsMonth}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.maxAppointmentsMonth} />
        </div>
        <div>
          <label className={labelClass} htmlFor={`plan-trial-${plan.id ?? "new"}`}>
            Dias de teste
          </label>
          <input
            id={`plan-trial-${plan.id ?? "new"}`}
            name="trialDays"
            type="number"
            min="0"
            max="90"
            required
            defaultValue={plan.trialDays}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.trialDays} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor={`plan-features-${plan.id ?? "new"}`}>
            Recursos (um por linha)
          </label>
          <textarea
            id={`plan-features-${plan.id ?? "new"}`}
            name="features"
            rows={4}
            maxLength={1000}
            defaultValue={plan.features}
            placeholder={"Agenda online\nRelatórios\nSuporte por WhatsApp"}
            className={`${inputClass} font-mono text-xs`}
          />
          <FieldError messages={state.fieldErrors?.features} />
        </div>
      </div>

      <div className="grid gap-2 rounded-lg bg-paper px-3 py-3 sm:grid-cols-2">
        <label className="flex items-start gap-2 text-xs font-medium text-slate-700">
          <input
            type="checkbox"
            name="active"
            defaultChecked={plan.active}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-brand"
          />
          <span>
            Plano ativo
            <span className="mt-0.5 block font-normal text-slate-500">
              Aparece no site e pode ser solicitado por estabelecimentos.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-xs font-medium text-slate-700">
          <input
            type="checkbox"
            name="isDemo"
            defaultChecked={plan.isDemo}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-brand"
          />
          <span>
            Plano de demonstração
            <span className="mt-0.5 block font-normal text-slate-500">
              Não é oferecido no cadastro público.
            </span>
          </span>
        </label>
      </div>

      <SubmitButton variant="brand">
        {mode === "create" ? "Criar plano" : "Salvar plano"}
      </SubmitButton>
    </form>
  );
}
