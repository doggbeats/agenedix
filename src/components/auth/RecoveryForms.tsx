"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert, FieldError, inputClass, labelClass } from "@/components/ui";
import { PasswordInput } from "@/components/PasswordInput";
import { SubmitButton } from "@/components/SubmitButton";
import { initialActionState } from "@/lib/action-utils";
import {
  requestPasswordResetAction,
  resetPasswordAction,
} from "@/lib/actions/auth";

export function PasswordRecoveryForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}

      <div>
        <label className={labelClass} htmlFor="recovery-email">
          E-mail da conta
        </label>
        <input
          id="recovery-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
          placeholder="voce@exemplo.com"
        />
        <FieldError messages={state.fieldErrors?.email} />
      </div>

      <SubmitButton className="w-full" pendingLabel="Enviando...">
        Enviar instruções
      </SubmitButton>

      <p className="text-center text-[11px] leading-relaxed text-muted">
        Por segurança, não informamos se o e-mail está cadastrado. O link enviado expira em
        1 hora.
      </p>
    </form>
  );
}

export function PasswordResetForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && (
        <Alert tone="success">
          {state.message}{" "}
          <Link href="/login" className="font-semibold underline underline-offset-2">
            Entrar agora
          </Link>
        </Alert>
      )}

      <div>
        <label className={labelClass} htmlFor="reset-password">
          Nova senha
        </label>
        <PasswordInput
          id="reset-password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
        />
        <FieldError messages={state.fieldErrors?.password} />
      </div>
      <div>
        <label className={labelClass} htmlFor="reset-confirm">
          Confirmar nova senha
        </label>
        <PasswordInput
          id="reset-confirm"
          name="confirmPassword"
          required
          autoComplete="new-password"
          placeholder="Repita a nova senha"
        />
        <FieldError messages={state.fieldErrors?.confirmPassword} />
      </div>

      <SubmitButton className="w-full" pendingLabel="Alterando...">
        Alterar senha
      </SubmitButton>
    </form>
  );
}
