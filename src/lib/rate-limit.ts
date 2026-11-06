import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export async function enforceRateLimit(
  scope: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; retryAfter: number }> {
  const windowMs = Math.max(1, windowSeconds) * 1000;
  const now = Date.now();
  const windowStartMs = Math.floor(now / windowMs) * windowMs;
  const windowStart = new Date(windowStartMs);
  const expiresAt = new Date(windowStartMs + windowMs);
  const key = crypto
    .createHash("sha256")
    .update(`${scope}:${identifier || "anon"}:${windowStartMs}`)
    .digest("hex");

  try {
    const bucket = await prisma.rateLimitBucket.upsert({
      where: { key },
      create: { key, count: 1, windowStart, expiresAt },
      update: { count: { increment: 1 } },
      select: { count: true },
    });

    if (Math.random() < 0.02) {
      await prisma.rateLimitBucket
        .deleteMany({ where: { expiresAt: { lt: new Date(now - 3600000) } } })
        .catch(() => null);
    }

    return {
      allowed: bucket.count <= limit,
      retryAfter: Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000)),
    };
  } catch (error) {
    // Falha fechada: se o contador não pode ser gravado, é mais seguro negar a
    // operação do que liberar tentativas ilimitadas de login/cadastro/booking.
    console.error("Rate limit indisponível", error);
    return { allowed: false, retryAfter: Math.max(30, windowSeconds) };
  }
}

export function rateLimitResponse(retryAfter: number): Response {
  return Response.json(
    {
      error: "Muitas solicitações em pouco tempo. Aguarde alguns minutos e tente novamente.",
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    },
  );
}
