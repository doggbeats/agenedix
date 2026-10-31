import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Mail, ShieldCheck, Trash2, UserRound, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth/session";
import { removeTeamMemberAction } from "@/lib/actions/team";
import { formatDateInZone, formatDateTimeInZone } from "@/lib/format";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/constants";
import {
  Badge,
  buttonSecondary,
  PageHeader,
  StatCard,
} from "@/components/ui";
import { ConfirmButton } from "@/components/ConfirmButton";
import {
  InviteTeamMemberForm,
  TeamMemberRoleForm,
} from "@/components/panel/TeamForms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Equipe e acessos" };

export default async function TeamPage() {
  const auth = await requireOwner();
  const establishment = auth.establishment;

  const [memberships, professionals, subscription] = await Promise.all([
    prisma.membership.findMany({
      where: { establishmentId: establishment.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            lastLoginAt: true,
            emailVerifiedAt: true,
            createdAt: true,
          },
        },
        professional: { select: { id: true, name: true } },
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    }),
    prisma.professional.findMany({
      where: { establishmentId: establishment.id, active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.subscription.findUnique({
      where: { establishmentId: establishment.id },
      include: { plan: true },
    }),
  ]);

  const linkedProfessionalIds = new Set(
    memberships
      .map((membership) => membership.professionalId)
      .filter((value): value is string => Boolean(value)),
  );
  const availableProfessionals = professionals.filter(
    (professional) => !linkedProfessionalIds.has(professional.id),
  );
  const maxUsers = subscription?.plan.maxUsers ?? 1;
  const atLimit = memberships.length >= maxUsers;

  return (
    <div>
      <PageHeader
        eyebrow="Equipe e acessos"
        title="Quem entra no painel"
        description="Convide administradores e profissionais, defina o perfil de cada pessoa e mantenha o acesso sob controle."
        actions={
          <Link href="/painel/plano" className={buttonSecondary}>
            Ver plano e limites
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Acessos em uso"
          value={`${memberships.length} de ${maxUsers}`}
          hint={subscription ? `Plano ${subscription.plan.name}` : "Sem plano vinculado"}
          accent
        />
        <StatCard
          label="Profissionais ativos"
          value={professionals.length}
          hint={`${availableProfessionals.length} sem acesso vinculado`}
        />
        <StatCard
          label="Proprietário"
          value={memberships.filter((item) => item.role === "OWNER").length}
          hint="Acesso total ao estabelecimento"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <section className="rounded-xl border border-line bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-line px-4 py-4 sm:px-5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-ink">Novo acesso</h2>
              <p className="text-[11px] text-slate-500">
                A pessoa recebe a senha temporária por e-mail e pode entrar imediatamente.
              </p>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <InviteTeamMemberForm
              professionals={availableProfessionals}
              disabled={atLimit}
              disabledReason={`Seu plano ${subscription?.plan.name ?? ""} permite até ${maxUsers} acessos. Remova um membro ou altere o plano para adicionar outra pessoa.`}
            />
          </div>
        </section>

        <section className="rounded-xl border border-line bg-white shadow-sm">
          <div className="border-b border-line px-4 py-4 sm:px-5">
            <h2 className="text-sm font-semibold text-ink">Acessos do estabelecimento</h2>
            <p className="text-[11px] text-slate-500">
              O proprietário não pode ser removido. Administradores gerenciam a operação;
              profissionais veem apenas a própria agenda.
            </p>
          </div>
          <ul className="divide-y divide-line">
            {memberships.map((membership) => {
              const isOwner = membership.role === "OWNER";
              return (
                <li key={membership.id} className="px-4 py-4 sm:px-5">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-ink">
                            {membership.user.name}
                          </p>
                          <Badge tone={isOwner ? "brand" : "neutral"}>
                            {ROLE_LABELS[membership.role]}
                          </Badge>
                          {membership.professional && (
                            <Badge tone="info">{membership.professional.name}</Badge>
                          )}
                        </div>
                        <p className="mt-1 flex items-center gap-1.5 break-all text-xs text-slate-500">
                          <Mail className="h-3 w-3 shrink-0" />
                          {membership.user.email}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          Desde {formatDateInZone(membership.createdAt, establishment.timezone)}
                          {membership.user.lastLoginAt
                            ? ` · último acesso ${formatDateTimeInZone(
                                membership.user.lastLoginAt,
                                establishment.timezone,
                                "dd/MM/yyyy HH:mm",
                              )}`
                            : " · nunca acessou"}
                        </p>
                      </div>

                      {!isOwner && (
                        <form action={removeTeamMemberAction} className="shrink-0">
                          <input type="hidden" name="membershipId" value={membership.id} />
                          <ConfirmButton
                            confirmMessage={`Remover o acesso de ${membership.user.name}? A pessoa deixa de entrar neste estabelecimento imediatamente.`}
                            className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Remover
                          </ConfirmButton>
                        </form>
                      )}
                    </div>

                    {!isOwner && (
                      <div className="rounded-lg border border-line bg-paper p-3">
                        <p className="mb-2 text-[11px] leading-relaxed text-slate-500">
                          {ROLE_DESCRIPTIONS[membership.role]}
                        </p>
                        <TeamMemberRoleForm
                          membershipId={membership.id}
                          role={membership.role === "ADMIN" ? "ADMIN" : "PROFESSIONAL"}
                          professionalId={membership.professionalId}
                          professionals={professionals}
                        />
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="mt-6 rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Boas práticas de acesso</p>
            <ul className="mt-1 space-y-1 text-xs leading-relaxed text-slate-500">
              <li>Use um e-mail individual por pessoa. Evite contas compartilhadas.</li>
              <li>
                O perfil Administrador enxerga agenda, clientes, serviços e configurações.
                Use com critério.
              </li>
              <li>
                Ao desligar alguém da equipe, remova o acesso e também desative o
                profissional em{" "}
                <Link href="/painel/profissionais" className="font-semibold text-brand hover:underline">
                  Profissionais
                </Link>
                .
              </li>
              <li>
                <UserRound className="inline h-3 w-3" /> O profissional vinculado vê apenas
                os próprios atendimentos.
              </li>
            </ul>
            <Link
              href="/painel/plano"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-brand"
            >
              Comparar planos e limites <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
