"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { initialActionState } from "@/lib/action-utils";
import { requestPlanChangeAction } from "@/lib/actions/auth";

export function PlanRequestForm({
  planId,
  planName,
  current,
}: {
  planId: string;
  planName: string;
  current: boolean;
}) {
  const [state, formAction] = useActionState(requestPlanChangeAction, initialActionState);

  if (current) {
    return (
      <span className="inline-flex rounded-full bg-green-50 px-3 py-1.5 text-[11px] font-semibold text-green-800 ring-1 ring-inset ring-green-200">
        Plano atual
      </span>
    );
  }

  return (
    <form action={formAction} className="w-full space-y-2">
      <input type="hidden" name="planId" value={planId} />
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}
      <SubmitButton variant="secondary" className="w-full">
        Solicitar {planName}
      </SubmitButton>
    </form>
  );
}
