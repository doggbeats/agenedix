import { publicCancelSchema } from "@/lib/validation";
import { BookingError, cancelPublicAppointment } from "@/lib/booking";
import { enforceRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { clientIp, jsonError, readJson } from "@/lib/http";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const limit = await enforceRateLimit("public.cancel", clientIp(request), 10, 900);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

  const body = await readJson(request);
  const parsed = publicCancelSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Verifique os dados informados.",
      422,
    );
  }

  try {
    const result = await cancelPublicAppointment(
      slug,
      parsed.data.protocol,
      parsed.data.token,
      parsed.data.reason,
    );
    return Response.json(
      {
        ok: true,
        alreadyCancelled: result.alreadyCancelled ?? false,
        message: result.alreadyCancelled
          ? "Este agendamento já estava cancelado."
          : "Agendamento cancelado.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BookingError) {
      return jsonError(error.message, error.status);
    }
    console.error("Erro ao cancelar agendamento público", error);
    return jsonError("Não foi possível cancelar o agendamento.", 500);
  }
}
