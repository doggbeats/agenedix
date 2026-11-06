import crypto from "node:crypto";
import { sendDueReminders } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Compara segredos em tempo constante. Comparar com `===` vaza, pelo tempo de
 * resposta, quantos caracteres do segredo o atacante já acertou.
 */
function secretMatches(candidate: string | null, secret: string): boolean {
  if (!candidate) return false;
  const provided = Buffer.from(candidate);
  const expected = Buffer.from(secret);
  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(provided, expected);
}

function authorized(request: Request, secret: string): boolean {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    return secretMatches(header.slice(7).trim(), secret);
  }
  return secretMatches(request.headers.get("x-cron-secret"), secret);
}

async function run(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return Response.json(
      { error: "Cron de lembretes não configurado." },
      { status: 503 },
    );
  }
  if (!authorized(request, secret)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const result = await sendDueReminders();
    return Response.json(
      { ok: true, ...result, ranAt: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Erro no cron de lembretes", error);
    return Response.json(
      { error: "Não foi possível processar os lembretes." },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
