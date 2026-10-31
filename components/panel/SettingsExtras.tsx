"use client";

import { useActionState } from "react";
import { Alert, FieldError, inputClass, labelClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { initialActionState } from "@/lib/action-utils";
import {
  createScheduleExceptionAction,
  updateNotificationSettingsAction,
} from "@/lib/actions/branding";

export function NotificationSettingsForm({
  settings,
  emailConfigured,
}: {
  settings: {
    emailNotifications: boolean;
    notifyBookingCreated: boolean;
    notifyBookingCancelled: boolean;
    notifyBookingRescheduled: boolean;
    reminderHours: number;
  };
  emailConfigured: boolean;
}) {
  const [state, formAction] = useActionState(
    updateNotificationSettingsAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}
      {!emailConfigured && (
        <Alert tone="info">
          O envio de e-mail está em modo de registro local. Configure a chave da Resend no
          servidor para entregar mensagens reais aos clientes.
        </Alert>
      )}

      <label className="flex items-start gap-2.5 rounded-lg border border-line bg-paper px-3 py-3 text-sm text-slate-700">
        <input
          type="checkbox"
          name="emailNotifications"
          defaultChecked={settings.emailNotifications}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-brand"
        />
        <span>
          <span className="block font-semibold text-ink">Enviar e-mails aos clientes</span>
          <span className="block text-[11px] leading-relaxed text-slate-500">
            Usa o e-mail informado no agendamento. Sem essa opção, nenhuma mensagem automática
            é enviada.
          </span>
        </span>
      </label>

      <div className="grid gap-2 sm:grid-cols-3">
        {[
          ["notifyBookingCreated", "Novo agendamento", settings.notifyBookingCreated],
          ["notifyBookingCancelled", "Cancelamento", settings.notifyBookingCancelled],
          ["notifyBookingRescheduled", "Remarcação", settings.notifyBookingRescheduled],
        ].map(([name, label, checked]) => (
          <label
            key={String(name)}
            className="flex items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-xs font-medium text-slate-700"
          >
            <input
              type="checkbox"
              name={String(name)}
              defaultChecked={Boolean(checked)}
              className="h-4 w-4 rounded border-slate-300 accent-brand"
            />
            {label}
          </label>
        ))}
      </div>

      <div className="max-w-xs">
        <label className={labelClass} htmlFor="reminderHours">
          Antecedência do lembrete (horas)
        </label>
        <input
          id="reminderHours"
          name="reminderHours"
          type="number"
          min={1}
          max={168}
          defaultValue={settings.reminderHours}
          className={inputClass}
        />
        <p className="mt-1 text-[10px] text-slate-500">
          O lembrete é enviado pelo processamento agendado (cron) quando o horário entra nessa
          janela.
        </p>
        <FieldError messages={state.fieldErrors?.reminderHours} />
      </div>

      <SubmitButton variant="secondary" pendingLabel="Salvando...">
        Salvar preferências
      </SubmitButton>
    </form>
  );
}

export function ScheduleExceptionForm({
  professionals,
  defaultDate,
}: {
  professionals: { id: string; name: string }[];
  defaultDate: string;
}) {
  const [state, formAction] = useActionState(
    createScheduleExceptionAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="space-y-3">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}

      <div>
        <label className={labelClass} htmlFor="exception-professional">
          Profissional
        </label>
        <select
          id="exception-professional"
          name="professionalId"
          className={inputClass}
          defaultValue="all"
        >
          <option value="all">Todos os profissionais</option>
          {professionals.map((professional) => (
            <option key={professional.id} value={professional.id}>
              {professional.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="exception-date">
            Data
          </label>
          <input
            id="exception-date"
            name="date"
            type="date"
            required
            defaultValue={defaultDate}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.date} />
        </div>
        <div>
          <label className={labelClass} htmlFor="exception-reason">
            Motivo (opcional)
          </label>
          <input
            id="exception-reason"
            name="reason"
            maxLength={200}
            className={inputClass}
            placeholder="Feriado, evento, folga..."
          />
          <FieldError messages={state.fieldErrors?.reason} />
        </div>
      </div>

      <label className="flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2.5 text-xs font-medium text-slate-700">
        <input
          type="checkbox"
          name="isClosed"
          defaultChecked
          className="h-4 w-4 rounded border-slate-300 accent-brand"
        />
        Fechado o dia inteiro
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="exception-open">
            Abertura especial
          </label>
          <input
            id="exception-open"
            name="openTime"
            type="time"
            className={inputClass}
            defaultValue="09:00"
          />
          <FieldError messages={state.fieldErrors?.openTime} />
        </div>
        <div>
          <label className={labelClass} htmlFor="exception-close">
            Fechamento especial
          </label>
          <input
            id="exception-close"
            name="closeTime"
            type="time"
            className={inputClass}
            defaultValue="18:00"
          />
          <FieldError messages={state.fieldErrors?.closeTime} />
        </div>
      </div>
      <p className="text-[10px] leading-relaxed text-slate-500">
        Marque &quot;fechado o dia inteiro&quot; para bloquear a data. Para abrir em horário
        diferente, desmarque e informe a janela especial.
      </p>

      <SubmitButton variant="secondary" pendingLabel="Registrando...">
        Registrar exceção
      </SubmitButton>
    </form>
  );
}
