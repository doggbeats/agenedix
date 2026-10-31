import { sendDueReminders } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request, secret: string): boolean {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    return header.slice(7).trim() === secret;
  }
  return request.headers.get("x-cron-secret") === secret;
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
