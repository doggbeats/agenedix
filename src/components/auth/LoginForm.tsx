"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { Alert, FieldError, inputClass, labelClass } from "@/components/ui";
import { PasswordInput } from "@/components/PasswordInput";
import { SubmitButton } from "@/components/SubmitButton";
import { loginAction } from "@/lib/actions/auth";
import { initialActionState } from "@/lib/action-utils";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(loginAction, initialActionState);
  const [capsLock, setCapsLock] = useState(false);

  const handleCapsLock = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof event.getModifierState === "function") {
      setCapsLock(event.getModifierState("CapsLock"));
    }
  };

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <div>
        <label className={labelClass} htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          required
          placeholder="voce@exemplo.com"
          className={inputClass}
        />
        <FieldError messages={state.fieldErrors?.email} />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <label
            className="block text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-600"
            htmlFor="password"
          >
            Senha
          </label>
          <Link
            href="/recuperar-senha"
            className="text-[11px] font-semibold text-brand transition hover:text-brand-hover hover:underline hover:underline-offset-2"
          >
            Esqueci minha senha
          </Link>
        </div>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          placeholder="Sua senha"
          onKeyDown={handleCapsLock}
          onKeyUp={handleCapsLock}
          onBlur={() => setCapsLock(false)}
        />
        {capsLock && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-amber-700">
            <TriangleAlert className="h-3.5 w-3.5" aria-hidden />
            Caps Lock está ativado.
          </p>
        )}
        <FieldError messages={state.fieldErrors?.password} />
      </div>

      <div className="pt-1">
        <SubmitButton className="group w-full" pendingLabel="Entrando...">
          <span>Entrar no painel</span>
          <ArrowRight
            className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
            aria-hidden
          />
        </SubmitButton>
      </div>

      <p className="text-center text-[11px] leading-relaxed text-muted">
        Ao entrar, você concorda com os{" "}
        <Link href="/termos" className="font-semibold text-slate-600 hover:text-ink">
          termos de uso
        </Link>{" "}
        e a{" "}
        <Link href="/privacidade" className="font-semibold text-slate-600 hover:text-ink">
          política de privacidade
        </Link>
        .
      </p>
    </form>
  );
}
