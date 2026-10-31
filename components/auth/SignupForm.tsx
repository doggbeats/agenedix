"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Alert, FieldError, inputClass, labelClass } from "@/components/ui";
import { PasswordInput } from "@/components/PasswordInput";
import { SubmitButton } from "@/components/SubmitButton";
import { signupAction } from "@/lib/actions/auth";
import { initialActionState } from "@/lib/action-utils";
import { SEGMENTS } from "@/lib/constants";
import { maskPhoneInput } from "@/lib/format";

export function SignupForm({ planName }: { planName?: string }) {
  const [state, formAction] = useActionState(signupAction, initialActionState);
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  return (
    <form action={formAction} className="space-y-5">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {planName && (
        <Alert tone="info">
          O plano <strong>{planName}</strong> será iniciado em período de teste. A cobrança
          só acontece após confirmação com a equipe Agendix.
        </Alert>
      )}

      <fieldset className="space-y-4">
        <legend className="mb-3 text-sm font-semibold text-ink">Sobre o negócio</legend>
        <div>
          <label className={labelClass} htmlFor="businessName">
            Nome do estabelecimento
          </label>
          <input
            id="businessName"
            name="businessName"
            required
            maxLength={120}
            placeholder="Ex.: Barbearia Nobre"
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.businessName} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="segment">
              Segmento
            </label>
            <select id="segment" name="segment" className={inputClass} defaultValue="Barbearia">
              {SEGMENTS.map((segment) => (
                <option key={segment} value={segment}>
                  {segment}
                </option>
              ))}
            </select>
            <FieldError messages={state.fieldErrors?.segment} />
          </div>
          <div>
            <label className={labelClass} htmlFor="ownerName">
              Responsável
            </label>
            <input
              id="ownerName"
              name="ownerName"
              required
              maxLength={120}
              placeholder="Seu nome"
              className={inputClass}
            />
            <FieldError messages={state.fieldErrors?.ownerName} />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="address">
            Endereço (opcional)
          </label>
          <input
            id="address"
            name="address"
            maxLength={200}
            placeholder="Rua, número, bairro, cidade"
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.address} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-3 text-sm font-semibold text-ink">Contato</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="phone">
              Telefone com DDD
            </label>
            <input
              id="phone"
              name="phone"
              inputMode="tel"
              required
              value={phone}
              onChange={(event) => setPhone(maskPhoneInput(event.target.value))}
              placeholder="(61) 99999-9999"
              className={inputClass}
            />
            <FieldError messages={state.fieldErrors?.phone} />
          </div>
          <div>
            <label className={labelClass} htmlFor="whatsapp">
              WhatsApp (opcional)
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              inputMode="tel"
              value={whatsapp}
              onChange={(event) => setWhatsapp(maskPhoneInput(event.target.value))}
              placeholder="Mesmo do telefone"
              className={inputClass}
            />
            <FieldError messages={state.fieldErrors?.whatsapp} />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="email">
            E-mail de acesso
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="voce@exemplo.com"
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.email} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-3 text-sm font-semibold text-ink">Acesso</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="password">
              Senha
            </label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
            />
            <FieldError messages={state.fieldErrors?.password} />
          </div>
          <div>
            <label className={labelClass} htmlFor="confirmPassword">
              Confirmar senha
            </label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              required
              placeholder="Repita a senha"
            />
            <FieldError messages={state.fieldErrors?.confirmPassword} />
          </div>
        </div>
        <input type="hidden" name="timezone" value="America/Sao_Paulo" />
        <p className="text-xs text-slate-500">
          O fuso horário inicial é America/Sao_Paulo. Você pode alterá-lo depois nas
          configurações.
        </p>
      </fieldset>

      <div>
        <label className="flex items-start gap-2.5 text-xs text-slate-600">
          <input
            type="checkbox"
            name="acceptTerms"
            required
            className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-brand"
          />
          <span>
            Li e aceito os{" "}
            <Link href="/termos" className="font-semibold text-ink underline underline-offset-2">
              termos de uso
            </Link>{" "}
            e a{" "}
            <Link
              href="/privacidade"
              className="font-semibold text-ink underline underline-offset-2"
            >
              política de privacidade
            </Link>
            .
          </span>
        </label>
        <FieldError messages={state.fieldErrors?.acceptTerms} />
      </div>

      <SubmitButton className="w-full" pendingLabel="Criando conta...">
        Criar minha conta
      </SubmitButton>
    </form>
  );
}
