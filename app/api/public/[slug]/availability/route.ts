import { prisma } from "@/lib/prisma";
import { getAvailability } from "@/lib/availability-service";
import { enforceRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { clientIp, jsonError } from "@/lib/http";
import { isValidDateString } from "@/lib/timezone";
import { isSubscriptionUsable, subscriptionBlockedMessage } from "@/lib/subscription";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(request.url);
  const serviceId = url.searchParams.get("serviceId") ?? "";
  const professionalId = url.searchParams.get("professionalId") ?? "any";
  const date = url.searchParams.get("date") ?? "";

  const limit = await enforceRateLimit("public.availability", clientIp(request), 240, 60);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

  if (!serviceId || !isValidDateString(date)) {
    return jsonError("Informe serviço e data válidos.");
  }

  const establishment = await prisma.establishment.findFirst({
    where: { slug, archivedAt: null, status: "ACTIVE", publicPageEnabled: true },
    include: {
      subscription: {
        select: {
          status: true,
          trialEndsAt: true,
          currentPeriodEnd: true,
          toleranceDays: true,
        },
      },
    },
  });

  if (!establishment) {
    return jsonError("Agenda indisponível.", 404);
  }

  if (!isSubscriptionUsable(establishment.subscription)) {
    return jsonError(
      `${subscriptionBlockedMessage(establishment.subscription)} A agenda online está indisponível.`,
      403,
    );
  }

  const availability = await getAvailability({
    establishment,
    serviceId,
    professionalId,
    date,
    publicOnly: true,
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
        photoUrl: professional.photoUrl,
        specialties: professional.specialties,
      })),
      slots: availability.slots.map((slot) => ({
        time: slot.time,
        professionalIds: slot.professionalIds,
        suggestedProfessionalId: slot.suggestedProfessionalId,
      })),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
