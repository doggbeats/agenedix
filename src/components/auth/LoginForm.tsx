"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Mail, TriangleAlert } from "lucide-react";
import { Alert, FieldError } from "@/components/ui";
import { PasswordInput } from "@/components/PasswordInput";
import { SubmitButton } from "@/components/SubmitButton";
import { loginAction } from "@/lib/actions/auth";
import { initialActionState } from "@/lib/action-utils";

const fieldBase =
  "peer w-full rounded-xl border border-[#e6ddd2] bg-[#fbfaf8] py-3 pl-11 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 hover:border-[#d8cabb] focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-60";

const labelBase =
  "mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600";

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
        <label className={labelBase} htmlFor="email">
          E-mail
        </label>
        <div className="relative">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            placeholder="voce@exemplo.com"
            className={`${fieldBase} pr-4`}
          />
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition peer-focus:text-brand" />
        </div>
        <FieldError messages={state.fieldErrors?.email} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label
            className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600"
            htmlFor="password"
          >
            Senha
          </label>
          <Link
            href="/recuperar-senha"
            className="text-[11px] font-semibold text-brand-hover transition hover:text-ink hover:underline hover:underline-offset-2"
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
          fieldClassName={fieldBase}
          leadingIcon={
            <Lock className="h-4 w-4 text-slate-400 transition group-focus-within:text-brand" />
          }
          onKeyDown={handleCapsLock}
          onKeyUp={handleCapsLock}
          onBlur={() => setCapsLock(false)}
        />
        {capsLock && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-amber-700">
            <TriangleAlert className="h-3.5 w-3.5" />
            Caps Lock está ativado.
          </p>
        )}
        <FieldError messages={state.fieldErrors?.password} />
      </div>

      <div className="pt-1">
        <SubmitButton
          className="group h-12 w-full rounded-xl bg-gradient-to-r from-[#bd9069] to-[#a8734c] text-sm font-semibold shadow-[0_18px_35px_-18px_rgba(175,126,86,0.95)] transition duration-200 hover:from-[#ae7f58] hover:to-[#99653f] hover:shadow-[0_22px_40px_-18px_rgba(175,126,86,1)]"
          pendingLabel="Entrando..."
        >
          <span>Entrar no painel</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </SubmitButton>
      </div>

      <p className="text-center text-[11px] leading-relaxed text-slate-500">
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
