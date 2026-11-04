"use client";

import {
  releaseSlotFormAction,
  updateStatusFormAction,
} from "@/lib/actions/appointments";
import type { AppointmentStatus } from "@prisma/client";
import { isManagerRole, type MembershipRole } from "@/lib/permissions";

const labels: Partial<Record<AppointmentStatus, string>> = {
  CONFIRMED: "Confirmar",
  COMPLETED: "Concluir",
  NO_SHOW: "Não compareceu",
  CANCELLED: "Cancelar",
};

export function AppointmentActions({
  appointmentId,
  status,
  role,
  returnTo,
  compact = false,
  releasedAt = null,
}: {
  appointmentId: string;
  status: AppointmentStatus;
  role: MembershipRole;
  returnTo: string;
  compact?: boolean;
  releasedAt?: Date | string | null;
}) {
  const options: AppointmentStatus[] = [];
  if (status === "PENDING") {
    if (isManagerRole(role)) options.push("CONFIRMED");
    options.push("CANCELLED");
  } else if (status === "CONFIRMED") {
    options.push("COMPLETED", "NO_SHOW", "CANCELLED");
  }

  const isFinished = status === "COMPLETED" || status === "NO_SHOW";
  const released = Boolean(releasedAt);
  const canRelease = isFinished && !released;

  if (options.length === 0 && !canRelease && !released) return null;

  const base = compact
    ? "rounded-full px-2.5 py-1 text-[10px] font-semibold transition"
    : "rounded-full px-3 py-1.5 text-xs font-semibold transition";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {options.length > 0 && (
        <form action={updateStatusFormAction} className="flex flex-wrap items-center gap-1.5">
          <input type="hidden" name="appointmentId" value={appointmentId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <input type="hidden" name="reason" value="" />
          {options.map((option) => {
            const isCancel = option === "CANCELLED";
            const isNoShow = option === "NO_SHOW";
            return (
              <button
                key={option}
                type="submit"
                name="status"
                value={option}
                onClick={(event) => {
                  if (isCancel) {
                    const reason = window.prompt(
                      "Motivo do cancelamento (opcional). Deixe em branco para cancelar sem justificar.",
                      "",
                    );
                    if (reason === null) {
                      event.preventDefault();
                      return;
                    }
                    const form = event.currentTarget.form;
                    const hidden = form?.elements.namedItem("reason");
                    if (hidden instanceof HTMLInputElement) hidden.value = reason;
                  }
                  if (
                    isNoShow &&
                    !window.confirm("Marcar este agendamento como não compareceu?")
                  ) {
                    event.preventDefault();
                  }
                }}
                className={`${base} ${
                  isCancel
                    ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    : isNoShow
                      ? "border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                      : "bg-brand text-white hover:bg-slate-800"
                }`}
              >
                {labels[option] ?? option}
              </button>
            );
          })}
        </form>
      )}

      {canRelease && (
        <form action={releaseSlotFormAction}>
          <input type="hidden" name="appointmentId" value={appointmentId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button
            type="submit"
            onClick={(event) => {
              if (
                !window.confirm(
                  "Liberar este horário para novos agendamentos? A vaga volta a aparecer na página pública.",
                )
              ) {
                event.preventDefault();
              }
            }}
            className={`${base} border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
          >
            Liberar horário
          </button>
        </form>
      )}

      {released && (
        <span
          className={`${base} border border-emerald-200 bg-emerald-50 text-emerald-700`}
          title="Este horário já está disponível para novos agendamentos."
        >
          Horário liberado
        </span>
      )}
    </div>
  );
}
