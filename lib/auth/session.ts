import crypto from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isManagerRole } from "@/lib/permissions";
import { isSubscriptionUsable } from "@/lib/subscription";

export const SESSION_COOKIE = "agendix_session";
export const ESTABLISHMENT_COOKIE = "agendix_establishment";
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
  const memberships = session.user.memberships;
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

  // O painel só abre depois que o plano está pago ou em teste válido.
  // Sem isso, qualquer conta recém-criada teria acesso mesmo sem pagar.
  const subscription = await getPanelSubscription(auth.establishment.id);
  if (!isSubscriptionUsable(subscription)) {
    redirect("/checkout");
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
  if (!auth.user.isPlatformAdmin) redirect("/painel");
  return auth;
}

export async function getRequestMeta(): Promise<{ ip: string | null; userAgent: string | null }> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || null;
  const userAgent = requestHeaders.get("user-agent")?.slice(0, 300) ?? null;
  return { ip, userAgent };
}
