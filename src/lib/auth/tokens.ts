import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function newToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = newToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({
      where: { userId, usedAt: null },
    }),
    prisma.passwordResetToken.create({
      data: { tokenHash: hashToken(token), userId, expiresAt },
    }),
  ]);

  return token;
}

export async function consumePasswordResetToken(
  token: string,
): Promise<{ userId: string } | null> {
  if (!token || token.length < 20) return null;
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  const updated = await prisma.passwordResetToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (updated.count !== 1) return null;
  return { userId: record.userId };
}

export async function createEmailVerificationToken(userId: string): Promise<string> {
  const token = newToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({
      where: { userId, usedAt: null },
    }),
    prisma.emailVerificationToken.create({
      data: { tokenHash: hashToken(token), userId, expiresAt },
    }),
  ]);

  return token;
}

export async function consumeEmailVerificationToken(
  token: string,
): Promise<{ userId: string } | null> {
  if (!token || token.length < 20) return null;
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  const updated = await prisma.emailVerificationToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (updated.count !== 1) return null;

  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerifiedAt: new Date(), emailVerificationExempt: false },
  });
  return { userId: record.userId };
}
