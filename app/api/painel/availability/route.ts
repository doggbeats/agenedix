import { getAuthContext } from "@/lib/auth/session";
import { getAvailability } from "@/lib/availability-service";
import { jsonError } from "@/lib/http";
import { isValidDateString } from "@/lib/timezone";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await getAuthContext();
  if (!auth?.establishment) {
    return jsonError("Sessão expirada.", 401);
  }
  if (auth.role !== "OWNER") {
    return jsonError("Somente o proprietário pode consultar horários.", 403);
  }

  const url = new URL(request.url);
  const serviceId = url.searchParams.get("serviceId") ?? "";
  const professionalId = url.searchParams.get("professionalId") ?? "any";
  const date = url.searchParams.get("date") ?? "";
  const excludeAppointmentId = url.searchParams.get("exclude") ?? undefined;

  if (!serviceId || !isValidDateString(date)) {
    return jsonError("Informe serviço e data válidos.");
  }

  const availability = await getAvailability({
    establishment: auth.establishment,
    serviceId,
    professionalId,
    date,
    excludeAppointmentId,
  });

  if (!availability.service) {
    return jsonError("Serviço não encontrado.", 404);
  }

  return Response.json(
    {
      date,
      service: {
        id: availability.service.id,
        name: availability.service.name,
        durationMin: availability.service.durationMin,
        price: Number(availability.service.price),
      },
      professionals: availability.professionals.map((professional) => ({
        id: professional.id,
        name: professional.name,
      })),
      slots: availability.slots.map((slot) => ({
        time: slot.time,
        professionalIds: slot.professionalIds,
        suggestedProfessionalId: slot.suggestedProfessionalId,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
