import { NextResponse } from "next/server";

/**
 * IP do cliente para rate limit e auditoria.
 *
 * Prefere `x-real-ip` (definido pela plataforma/proxy) e só então o primeiro
 * item de `x-forwarded-for`. Um valor sempre é devolvido para que o chamador
 * não caia em um balde compartilhado sem limite.
 */
export function clientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "sem-ip";
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
