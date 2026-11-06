import crypto from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isManagerRole } from "@/lib/permissions";
import { isSubscriptionUsable } from "@/lib/subscription";
import { isPlatformAdminUser } from "@/lib/auth/platform-admin";
import { requiresEmailVerification } from "@/lib/auth/email-verification";

export const SESSION_COOKIE = "agendix_session";
export const ESTABLISHMENT_COOKIE = "agendix_establishment";
export const ADMIN_IMPERSONATION_COOKIE = "agendix_admin_impersonation";
export const ADMIN_IMPERSONATION_MAX_AGE = 60 * 60 * 2;
const SESSION_DAYS = 7;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function newToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export async function createSession(userId: string): Promise<void> {
  const token = newToken();
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || null;
  const userAgent = requestHeaders.get("user-agent")?.slice(0, 300) ?? null;
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      ip,
      userAgent,
    },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export const getSession = cache(async () => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: {
          memberships: {
            include: {
              establishment: true,
              professional: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => null);
    return null;
  }
  return session;
});

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session
      .delete({ where: { tokenHash: hashToken(token) } })
      .catch(() => null);
  }
  store.delete(SESSION_COOKIE);
  store.delete(ESTABLISHMENT_COOKIE);
  store.delete(ADMIN_IMPERSONATION_COOKIE);
}

export async function setActiveEstablishment(establishmentId: string): Promise<void> {
  const store = await cookies();
  store.set(ESTABLISHMENT_COOKIE, establishmentId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export type AuthContext = NonNullable<Awaited<ReturnType<typeof getSession>>>;
export type AuthMembership = AuthContext["user"]["memberships"][number];

export const getAuthContext = cache(async () => {
  const session = await getSession();
  if (!session) return null;

  const store = await cookies();
  const requested = store.get(ESTABLISHMENT_COOKIE)?.value;
  // Estabelecimentos arquivados não dão mais acesso ao painel.
  const memberships = session.user.memberships.filter(
    (membership) => membership.establishment.archivedAt === null,
  );

  // O administrador da plataforma pode abrir o painel de qualquer cliente.
  // A sessão continua sendo dele; apenas trocamos o contexto ativo para o
  // estabelecimento escolhido, sem criar vínculo ou alterar a equipe real.
  const impersonationId = store.get(ADMIN_IMPERSONATION_COOKIE)?.value;
  if (isPlatformAdminUser(session.user) && impersonationId) {
    const establishment = await prisma.establishment.findFirst({
      where: { id: impersonationId, archivedAt: null },
    });

    if (establishment) {
      const impersonatedMembership: AuthMembership = {
        id: `admin-impersonation-${establishment.id}`,
        userId: session.user.id,
        establishmentId: establishment.id,
        role: "OWNER",
        professionalId: null,
        createdAt: session.user.createdAt,
        establishment,
        professional: null,
      };

      return {
        user: session.user,
        memberships,
        activeMembership: impersonatedMembership,
        establishment,
        role: "OWNER" as const,
        professionalId: null,
        impersonating: true,
      };
    }
  }

  const active =
    memberships.find((membership) => membership.establishmentId === requested) ??
    memberships[0] ??
    null;

  return {
    user: session.user,
    memberships,
    activeMembership: active,
    establishment: active?.establishment ?? null,
    role: active?.role ?? null,
    professionalId: active?.professionalId ?? null,
    impersonating: false,
  };
});

export async function requireUser() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  return auth;
}

const getPanelSubscription = cache(async (establishmentId: string) =>
  prisma.subscription.findUnique({
    where: { establishmentId },
    select: {
      status: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
      toleranceDays: true,
    },
  }),
);

export async function requirePanel() {
  const auth = await requireUser();
  if (!auth.activeMembership || !auth.establishment) {
    redirect("/login?erro=sem-estabelecimento");
  }

  // Contas novas só usam o painel depois de confirmar o e-mail.
  // O admin da plataforma e o modo administrador ficam dispensados.
  if (
    !auth.impersonating &&
    !isPlatformAdminUser(auth.user) &&
    requiresEmailVerification(auth.user)
  ) {
    redirect("/verificar-email/pendente");
  }

  // O painel só abre depois que o plano está pago ou em teste válido.
  // Sem isso, qualquer conta recém-criada teria acesso mesmo sem pagar.
  // O administrador da plataforma entra mesmo sem assinatura para poder
  // diagnosticar e corrigir o cadastro do cliente.
  if (!auth.impersonating) {
    const subscription = await getPanelSubscription(auth.establishment.id);
    if (!isSubscriptionUsable(subscription)) {
      redirect("/checkout");
    }
  }

  return {
    ...auth,
    activeMembership: auth.activeMembership,
    establishment: auth.establishment,
    role: auth.activeMembership.role,
    professionalId: auth.activeMembership.professionalId,
  };
}

export async function requireOwner() {
  const auth = await requirePanel();
  if (auth.role !== "OWNER") redirect("/painel");
  return auth;
}

export async function requireManager() {
  const auth = await requirePanel();
  if (!isManagerRole(auth.role)) redirect("/painel");
  return auth;
}

export async function requirePlatformAdmin() {
  const auth = await requireUser();
  if (!isPlatformAdminUser(auth.user)) redirect("/painel");
  return auth;
}

export async function getRequestMeta(): Promise<{ ip: string | null; userAgent: string | null }> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || null;
  const userAgent = requestHeaders.get("user-agent")?.slice(0, 300) ?? null;
  return { ip, userAgent };
}
