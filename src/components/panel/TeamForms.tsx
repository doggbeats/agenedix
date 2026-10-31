"use client";

import { useActionState, useState } from "react";
import { Alert, FieldError, inputClass, labelClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { initialActionState } from "@/lib/action-utils";
import {
  inviteTeamMemberAction,
  updateTeamMemberAction,
} from "@/lib/actions/team";
import { ROLE_DESCRIPTIONS } from "@/lib/constants";

type ProfessionalOption = { id: string; name: string };

export function InviteTeamMemberForm({
  professionals,
  disabled,
  disabledReason,
}: {
  professionals: ProfessionalOption[];
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [state, formAction] = useActionState(inviteTeamMemberAction, initialActionState);
  const [role, setRole] = useState<"ADMIN" | "PROFESSIONAL">("PROFESSIONAL");

  if (disabled) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {disabledReason ?? "O limite de acessos do seu plano foi atingido."}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="team-name">
            Nome
          </label>
          <input
            id="team-name"
            name="name"
            required
            maxLength={120}
            className={inputClass}
            placeholder="Nome da pessoa"
          />
          <FieldError messages={state.fieldErrors?.name} />
        </div>
        <div>
          <label className={labelClass} htmlFor="team-email">
            E-mail de acesso
          </label>
          <input
            id="team-email"
            name="email"
            type="email"
            required
            autoComplete="off"
            className={inputClass}
            placeholder="pessoa@exemplo.com"
          />
          <FieldError messages={state.fieldErrors?.email} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="team-role">
            Perfil de acesso
          </label>
          <select
            id="team-role"
            name="role"
            className={inputClass}
            value={role}
            onChange={(event) => setRole(event.target.value as "ADMIN" | "PROFESSIONAL")}
          >
            <option value="PROFESSIONAL">Profissional</option>
            <option value="ADMIN">Administrador</option>
          </select>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            {ROLE_DESCRIPTIONS[role]}
          </p>
          <FieldError messages={state.fieldErrors?.role} />
        </div>
        <div>
          <label className={labelClass} htmlFor="team-professional">
            Profissional vinculado {role === "PROFESSIONAL" ? "" : "(opcional)"}
          </label>
          <select
            id="team-professional"
            name="professionalId"
            className={inputClass}
            defaultValue="none"
          >
            <option value="none">
              {role === "PROFESSIONAL" ? "Selecione o profissional" : "Sem vínculo"}
            </option>
            {professionals.map((professional) => (
              <option key={professional.id} value={professional.id}>
                {professional.name}
              </option>
            ))}
          </select>
          <FieldError messages={state.fieldErrors?.professionalId} />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="team-password">
          Senha temporária
        </label>
        <input
          id="team-password"
          name="password"
          type="text"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
          placeholder="Mínimo 8 caracteres, com letras e números"
        />
        <p className="mt-1 text-[11px] text-slate-500">
          Enviaremos esta senha por e-mail. A pessoa pode alterá-la depois.
        </p>
        <FieldError messages={state.fieldErrors?.password} />
      </div>

      <SubmitButton pendingLabel="Criando acesso...">Criar acesso</SubmitButton>
    </form>
  );
}

export function TeamMemberRoleForm({
  membershipId,
  role,
  professionalId,
  professionals,
}: {
  membershipId: string;
  role: "ADMIN" | "PROFESSIONAL";
  professionalId: string | null;
  professionals: ProfessionalOption[];
}) {
  const [state, formAction] = useActionState(updateTeamMemberAction, initialActionState);
  const [selectedRole, setSelectedRole] = useState<"ADMIN" | "PROFESSIONAL">(role);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="membershipId" value={membershipId} />
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-32 flex-1">
          <label className={labelClass} htmlFor={`role-${membershipId}`}>
            Perfil
          </label>
          <select
            id={`role-${membershipId}`}
            name="role"
            className={inputClass}
            value={selectedRole}
            onChange={(event) =>
              setSelectedRole(event.target.value as "ADMIN" | "PROFESSIONAL")
            }
          >
            <option value="PROFESSIONAL">Profissional</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </div>
        <div className="min-w-40 flex-1">
          <label className={labelClass} htmlFor={`professional-${membershipId}`}>
            Profissional
          </label>
          <select
            id={`professional-${membershipId}`}
            name="professionalId"
            className={inputClass}
            defaultValue={professionalId ?? "none"}
          >
            <option value="none">
              {selectedRole === "PROFESSIONAL" ? "Selecione" : "Sem vínculo"}
            </option>
            {professionals.map((professional) => (
              <option key={professional.id} value={professional.id}>
                {professional.name}
              </option>
            ))}
          </select>
        </div>
        <SubmitButton variant="secondary" pendingLabel="Salvando...">
          Salvar
        </SubmitButton>
      </div>
    </form>
  );
}
