"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  destroySession,
  getAuthContext,
  getRequestMeta,
  requireUser,
  setActiveEstablishment,
} from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/rate-limit";
import { recordAudit } from "@/lib/audit";
import { failure, parseForm, success, type ActionState } from "@/lib/action-utils";
import { loginSchema, passwordRecoverySchema, passwordResetSchema, signupSchema } from "@/lib/validation";
import { ensureUniqueSlug } from "@/lib/slug";
import { normalizePhone } from "@/lib/format";
import { BRAND_COLOR } from "@/lib/constants";
import {
  consumePasswordResetToken,
  createEmailVerificationToken,
  createPasswordResetToken,
} from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/urls";

export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseForm(loginSchema, {
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.data) return parsed.state ?? failure("Dados inválidos.");

  const { ip } = await getRequestMeta();
  const limit = await enforceRateLimit(
    "login",
    `${ip ?? "sem-ip"}:${parsed.data.email}`,
    10,
    900,
  );
  if (!limit.allowed) {
    return failure("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: {
      memberships: {
        include: { establishment: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return failure("E-mail ou senha inválidos.");
  }

  if (user.memberships.length === 0) {
    return failure(
      "Esta conta não está vinculada a nenhum estabelecimento. Fale com o responsável pelo negócio.",
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  await createSession(user.id);
  if (user.memberships[0]) {
    await setActiveEstablishment(user.memberships[0].establishmentId);
  }
  await recordAudit({
    actorUserId: user.id,
    action: "auth.login",
    entityType: "User",
    entityId: user.id,
    ip,
  });

  redirect("/painel");
}

export async function signupAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseForm(signupSchema, {
    businessName: formData.get("businessName"),
    segment: formData.get("segment"),
    ownerName: formData.get("ownerName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    address: formData.get("address"),
    timezone: formData.get("timezone") || "America/Sao_Paulo",
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    acceptTerms: formData.get("acceptTerms") === "on",
  });

  if (!parsed.data) return parsed.state ?? failure("Dados inválidos.");
  const input = parsed.data;

  const { ip } = await getRequestMeta();
  const limit = await enforceRateLimit("signup", ip ?? "sem-ip", 5, 3600);
  if (!limit.allowed) {
    return failure("Muitas tentativas de cadastro. Tente novamente mais tarde.");
  }

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) {
    return failure("Já existe uma conta com este e-mail. Faça login.", {
      email: ["E-mail já cadastrado."],
    });
  }

  const plan = await prisma.subscriptionPlan.findFirst({
    where: { active: true, isDemo: false },
    orderBy: [{ sortOrder: "asc" }, { priceMonthly: "asc" }],
  });
  if (!plan) {
    return failure(
      "Nenhum plano está disponível no momento. Fale com o suporte pelo WhatsApp.",
    );
  }

  const phone = normalizePhone(input.phone);
  const whatsapp = input.whatsapp ? normalizePhone(input.whatsapp) : phone;
  const passwordHash = await hashPassword(input.password);
  const now = new Date();

  let result: { user: { id: string }; establishment: { id: string } };
  try {
    result = await prisma.$transaction(async (tx) => {
      const slug = await ensureUniqueSlug(tx, input.businessName);
      const establishment = await tx.establishment.create({
        data: {
          slug,
          name: input.businessName,
          segment: input.segment,
          ownerName: input.ownerName,
          email: input.email,
          phone,
          whatsapp,
          address: input.address,
          timezone: input.timezone,
          brandColor: BRAND_COLOR,
          status: "ACTIVE",
          publicPageEnabled: true,
          autoConfirmBookings: false,
          minAdvanceMinutes: 60,
          maxAdvanceDays: 60,
          cancellationNoticeHours: 4,
          defaultServiceMin: 30,
          slotIntervalMinutes: 15,
          cancellationPolicy:
            "Cancelamentos com até 4 horas de antecedência podem ser feitos online. Depois desse prazo, fale diretamente com o estabelecimento.",
        },
      });

      const user = await tx.user.create({
        data: {
          name: input.ownerName,
          email: input.email,
          passwordHash,
        },
      });

      await tx.membership.create({
        data: {
          userId: user.id,
          establishmentId: establishment.id,
          role: "OWNER",
        },
      });

      await tx.businessHours.createMany({
        data: Array.from({ length: 7 }, (_, weekday) => ({
          establishmentId: establishment.id,
          weekday,
          isOpen: weekday !== 0,
          openMinute: 540,
          closeMinute: 1080,
          breakStartMinute: weekday !== 0 ? 720 : null,
          breakEndMinute: weekday !== 0 ? 780 : null,
        })),
      });

      await tx.tenantBranding.create({
        data: {
          establishmentId: establishment.id,
          primaryColor: BRAND_COLOR,
          secondaryColor: "#C4A484",
          backgroundColor: "#FFFFFF",
          textColor: "#0B0B0B",
          buttonColor: "#0B0B0B",
          gallery: [],
        },
      });

      await tx.unit.create({
        data: {
          establishmentId: establishment.id,
          name: "Unidade principal",
          address: input.address ?? null,
          phone,
          timezone: input.timezone,
          isDefault: true,
        },
      });

      const trialEndsAt = new Date(
        now.getTime() + Math.max(1, plan.trialDays) * 86400000,
      );
      await tx.subscription.create({
        data: {
          establishmentId: establishment.id,
          planId: plan.id,
          status: "TRIALING",
          billingCycle: "MONTHLY",
          trialEndsAt,
          currentPeriodStart: now,
          currentPeriodEnd: trialEndsAt,
          provider: "MANUAL",
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          establishmentId: establishment.id,
          action: "establishment.created",
          entityType: "Establishment",
          entityId: establishment.id,
          metadata: { plan: plan.slug, trial: true },
          ip,
        },
      });

      return { user, establishment };
    });
  } catch (error) {
    console.error("Erro no cadastro", error);
    return failure("Não foi possível concluir o cadastro. Tente novamente.");
  }

  await createSession(result.user.id);
  await setActiveEstablishment(result.establishment.id);

  try {
    const verificationToken = await createEmailVerificationToken(result.user.id);
    const verifyUrl = `${getAppUrl()}/verificar-email?token=${encodeURIComponent(verificationToken)}`;
    await sendEmail({
      to: input.email,
      subject: "Confirme seu e-mail na Agendix",
      text: [
        `Olá, ${input.ownerName}!`,
        "",
        `Sua conta em ${input.businessName} foi criada na Agendix.`,
        "",
        "Confirme seu e-mail para garantir o acesso e o recebimento de avisos:",
        verifyUrl,
        "",
        "O link expira em 24 horas. Se você não criou esta conta, ignore esta mensagem.",
      ].join("\n"),
    });
  } catch (error) {
    console.error("Falha ao enviar verificação de e-mail", error);
  }

  revalidatePath("/", "layout");
  redirect("/painel/onboarding?boas-vindas=1");
}

export async function logoutAction(): Promise<void> {
  const auth = await getAuthContext();
  if (auth) {
    await recordAudit({
      actorUserId: auth.user.id,
      establishmentId: auth.establishment?.id,
      action: "auth.logout",
      entityType: "User",
      entityId: auth.user.id,
    });
  }
  await destroySession();
  redirect("/");
}

export async function switchEstablishmentAction(formData: FormData): Promise<void> {
  const auth = await requireUser();
  const establishmentId = String(formData.get("establishmentId") ?? "");
  const membership = auth.memberships.find(
    (item) => item.establishmentId === establishmentId,
  );
  if (!membership) redirect("/painel");
  await setActiveEstablishment(membership.establishmentId);
  revalidatePath("/painel", "layout");
  redirect("/painel");
}

export async function requestPlanChangeAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await getAuthContext();
  if (!auth?.establishment) return failure("Sessão expirada.");

  const planId = String(formData.get("planId") ?? "");
  const plan = await prisma.subscriptionPlan.findFirst({
    where: { id: planId, active: true },
  });
  if (!plan) return failure("Plano indisponível.");

  await recordAudit({
    actorUserId: auth.user.id,
    establishmentId: auth.establishment.id,
    action: "subscription.change_requested",
    entityType: "SubscriptionPlan",
    entityId: plan.id,
    metadata: { plan: plan.slug },
  });

  return success(
    `Solicitação do plano ${plan.name} registrada. A equipe Agendix entrará em contato para confirmar o pagamento antes de qualquer ativação.`,
  );
}

export async function requestPasswordResetAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseForm(passwordRecoverySchema, {
    email: formData.get("email"),
  });
  if (!parsed.data) return parsed.state ?? failure("Informe um e-mail válido.");

  const { ip } = await getRequestMeta();
  const limit = await enforceRateLimit(
    "password-reset",
    `${ip ?? "sem-ip"}:${parsed.data.email}`,
    5,
    3600,
  );
  if (!limit.allowed) {
    return failure("Muitas solicitações. Aguarde alguns minutos e tente novamente.");
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true, email: true },
  });

  if (user) {
    const token = await createPasswordResetToken(user.id);
    const resetUrl = `${getAppUrl()}/redefinir-senha?token=${encodeURIComponent(token)}`;
    await sendEmail({
      to: user.email,
      subject: "Redefinição de senha na Agendix",
      text: [
        `Olá, ${user.name}!`,
        "",
        "Recebemos uma solicitação para redefinir sua senha na Agendix.",
        "",
        `Crie uma nova senha por este link: ${resetUrl}`,
        "",
        "O link expira em 1 hora e só pode ser usado uma vez. Se você não solicitou, ignore esta mensagem: sua senha continua a mesma.",
      ].join("\n"),
    }).catch((error) => console.error("Falha ao enviar recuperação de senha", error));

    await recordAudit({
      actorUserId: user.id,
      action: "auth.password_reset.requested",
      entityType: "User",
      entityId: user.id,
      ip,
    });
  }

  return success(
    "Se houver uma conta com este e-mail, enviaremos as instruções para redefinir a senha. Verifique também a caixa de spam.",
  );
}

export async function resetPasswordAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseForm(passwordResetSchema, {
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.data) return parsed.state ?? failure("Dados inválidos.");

  const consumed = await consumePasswordResetToken(parsed.data.token);
  if (!consumed) {
    return failure("Este link de redefinição é inválido ou expirou. Solicite um novo link.");
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: consumed.userId },
      data: { passwordHash },
    }),
    prisma.session.deleteMany({ where: { userId: consumed.userId } }),
    prisma.passwordResetToken.updateMany({
      where: { userId: consumed.userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  await recordAudit({
    actorUserId: consumed.userId,
    action: "auth.password_reset.completed",
    entityType: "User",
    entityId: consumed.userId,
  });

  return success("Senha alterada. Você já pode entrar com a nova senha.");
}

export async function completeOnboardingAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireUser();
  if (!auth.establishment) return failure("Sessão expirada.");

  const skip = formData.get("skip") === "true";
  const [services, professionals] = await Promise.all([
    prisma.service.count({
      where: { establishmentId: auth.establishment.id, deletedAt: null },
    }),
    prisma.professional.count({
      where: { establishmentId: auth.establishment.id, active: true },
    }),
  ]);

  if (!skip && (services === 0 || professionals === 0)) {
    return failure(
      "Cadastre pelo menos um serviço e um profissional para começar a receber agendamentos.",
    );
  }

  await prisma.establishment.update({
    where: { id: auth.establishment.id },
    data: { onboardingCompletedAt: new Date() },
  });

  await recordAudit({
    actorUserId: auth.user.id,
    establishmentId: auth.establishment.id,
    action: skip ? "onboarding.skipped" : "onboarding.completed",
    entityType: "Establishment",
    entityId: auth.establishment.id,
    metadata: { services, professionals },
  });

  revalidatePath("/painel", "layout");
  redirect("/painel?ok=" + encodeURIComponent("Configuração concluída. Bom trabalho!"));
}

