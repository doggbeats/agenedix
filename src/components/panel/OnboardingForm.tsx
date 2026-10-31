"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { initialActionState } from "@/lib/action-utils";
import { completeOnboardingAction } from "@/lib/actions/auth";

export function OnboardingForm({ ready }: { ready: boolean }) {
  const [state, formAction] = useActionState(completeOnboardingAction, initialActionState);

  return (
    <div className="space-y-3">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}

      <form action={formAction} className="flex flex-col gap-2 sm:flex-row">
        <SubmitButton variant="brand" pendingLabel="Concluindo...">
          Concluir configuração
        </SubmitButton>
        <p className="self-center text-[10px] leading-relaxed text-slate-500">
          {ready
            ? "Você já pode receber agendamentos pela página pública."
            : "Cadastre ao menos um serviço e um profissional para liberar a conclusão."}
        </p>
      </form>

      <form action={formAction}>
        <input type="hidden" name="skip" value="true" />
        <button
          type="submit"
          className="text-[11px] font-semibold text-slate-500 underline-offset-2 hover:text-ink hover:underline"
        >
          Prefiro configurar depois
        </button>
      </form>
    </div>
  );
}
