"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";
import { sendEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/urls";
import {
  failure,
  formString,
  parseForm,
  success,
  type ActionState,
} from "@/lib/action-utils";
import { teamMemberSchema } from "@/lib/validation";
import { ROLE_LABELS } from "@/lib/constants";

async function userLimitReached(establishmentId: string): Promise<string | null> {
  const subscription = await prisma.subscription.findUnique({
    where: { establishmentId },
    include: { plan: true },
  });
  if (!subscription) {
    return "O estabelecimento não possui um plano vinculado. Fale com o suporte.";
  }
  const count = await prisma.membership.count({ where: { establishmentId } });
  if (count >= subscription.plan.maxUsers) {
    return `Seu plano ${subscription.plan.name} permite até ${subscription.plan.maxUsers} acessos. Remova um membro ou altere o plano para adicionar outra pessoa.`;
  }
  return null;
}

export async function inviteTeamMemberAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireOwner();
  const parsed = parseForm(teamMemberSchema, {
    name: formString(formData, "name"),
    email: formString(formData, "email"),
    password: formString(formData, "password"),
    role: formString(formData, "role"),
    professionalId: formString(formData, "professionalId"),
  });
  if (!parsed.data) return parsed.state ?? failure("Dados inválidos.");
  const input = parsed.data;

  const limit = await userLimitReached(auth.establishment.id);
  if (limit) return failure(limit);

  if (input.role === "PROFESSIONAL" && !input.professionalId) {
    return failure("Escolha o profissional que este acesso representa.", {
      professionalId: ["Selecione um profissional."],
    });
  }

  let professionalId: string | null = null;
  if (input.professionalId) {
    const professional = await prisma.professional.findFirst({
      where: { id: input.professionalId, establishmentId: auth.establishment.id },
      select: { id: true, name: true },
    });
    if (!professional) return failure("Profissional inválido.");
    const linked = await prisma.membership.findFirst({
      where: { professionalId: professional.id },
      select: { id: true },
    });
    if (linked) {
      return failure(`${professional.name} já possui um acesso vinculado.`, {
        professionalId: ["Este profissional já está vinculado a um usuário."],
      });
    }
    professionalId = professional.id;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    include: {
      memberships: { where: { establishmentId: auth.establishment.id }, select: { id: true } },
    },
  });
  if (existingUser?.memberships.length) {
    return failure("Esta pessoa já possui acesso a este estabelecimento.", {
      email: ["E-mail já vinculado à equipe."],
    });
  }

  const passwordHash = await hashPassword(input.password);

  try {
    await prisma.$transaction(async (tx) => {
      const user =
        existingUser ??
        (await tx.user.create({
          data: {
            name: input.name,
            email: input.email,
            passwordHash,
          },
        }));

      await tx.membership.create({
        data: {
          userId: user.id,
          establishmentId: auth.establishment.id,
          role: input.role,
          professionalId,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: auth.user.id,
          establishmentId: auth.establishment.id,
          action: "team.member.invited",
          entityType: "Membership",
          metadata: {
            email: input.email,
            role: input.role,
            professionalId,
          },
        },
      });
    });
  } catch (error) {
    console.error("Falha ao convidar membro", error);
    return failure("Não foi possível criar o acesso. Tente novamente.");
  }

  await sendEmail({
    to: input.email,
    subject: `Seu acesso ao painel ${auth.establishment.name}`,
    text: existingUser
      ? [
          `Olá, ${existingUser.name}!`,
          "",
          `Você recebeu acesso ao painel de ${auth.establishment.name} na Agendix.`,
          "",
          `Perfil: ${ROLE_LABELS[input.role]}`,
          `E-mail: ${input.email}`,
          "",
          `Use sua senha atual para entrar em ${getAppUrl()}/login.`,
          "",
          "Se você não esperava este convite, ignore esta mensagem.",
        ].join("\n")
      : [
          `Olá, ${input.name}!`,
          "",
          `Você recebeu acesso ao painel de ${auth.establishment.name} na Agendix.`,
          "",
          `Perfil: ${ROLE_LABELS[input.role]}`,
          `E-mail: ${input.email}`,
          `Senha temporária: ${input.password}`,
          "",
          `Entre em ${getAppUrl()}/login e altere sua senha após o primeiro acesso.`,
          "",
          "Se você não esperava este convite, ignore esta mensagem.",
        ].join("\n"),
  }).catch((error) => console.error("Falha ao enviar convite", error));

  revalidatePath("/painel/equipe");
  revalidatePath("/painel", "layout");
  return success(`Acesso de ${input.name} criado. Enviamos as instruções para ${input.email}.`);
}

export async function updateTeamMemberAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireOwner();
  const membershipId = formString(formData, "membershipId");
  const role = formString(formData, "role");
  const professionalId = formString(formData, "professionalId");

  if (role !== "ADMIN" && role !== "PROFESSIONAL") {
    return failure("Perfil inválido.");
  }

  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, establishmentId: auth.establishment.id },
    include: { user: { select: { name: true } } },
  });
  if (!membership) return failure("Acesso não encontrado.");
  if (membership.role === "OWNER") {
    return failure("O acesso do proprietário não pode ser alterado por aqui.");
  }

  let linkedProfessionalId: string | null = null;
  if (role === "PROFESSIONAL") {
    if (!professionalId) {
      return failure("Escolha o profissional que este acesso representa.");
    }
    const professional = await prisma.professional.findFirst({
      where: { id: professionalId, establishmentId: auth.establishment.id },
      select: { id: true },
    });
    if (!professional) return failure("Profissional inválido.");
    const linked = await prisma.membership.findFirst({
      where: { professionalId, id: { not: membership.id } },
      select: { id: true },
    });
    if (linked) return failure("Este profissional já está vinculado a outro acesso.");
    linkedProfessionalId = professional.id;
  }

  await prisma.membership.update({
    where: { id: membership.id },
    data: { role, professionalId: linkedProfessionalId },
  });

  await recordAudit({
    actorUserId: auth.user.id,
    establishmentId: auth.establishment.id,
    action: "team.member.updated",
    entityType: "Membership",
    entityId: membership.id,
    metadata: { role, professionalId: linkedProfessionalId },
  });

  revalidatePath("/painel/equipe");
  revalidatePath("/painel", "layout");
  return success(`Acesso de ${membership.user.name} atualizado.`);
}

export async function removeTeamMemberAction(formData: FormData): Promise<void> {
  const auth = await requireOwner();
  const membershipId = formString(formData, "membershipId");

  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, establishmentId: auth.establishment.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!membership || membership.role === "OWNER") {
    revalidatePath("/painel/equipe");
    return;
  }

  await prisma.$transaction([
    prisma.membership.delete({ where: { id: membership.id } }),
    prisma.auditLog.create({
      data: {
        actorUserId: auth.user.id,
        establishmentId: auth.establishment.id,
        action: "team.member.removed",
        entityType: "Membership",
        entityId: membership.id,
        metadata: { email: membership.user.email },
      },
    }),
  ]);

  revalidatePath("/painel/equipe");
  revalidatePath("/painel", "layout");
}
