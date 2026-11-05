import { prisma } from "@/lib/prisma";
import { bookingSchema } from "@/lib/validation";
import { BookingError, createPublicBooking } from "@/lib/booking";
import { enforceRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { clientIp, jsonError, readJson } from "@/lib/http";
import { confirmationUrl, publicBookingUrl } from "@/lib/urls";
import { appointmentMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import { formatDateTimeInZone } from "@/lib/format";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const ip = clientIp(request);
  const limit = await enforceRateLimit("public.booking", ip, 8, 3600);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

  const body = await readJson(request);
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: parsed.error.issues[0]?.message ?? "Verifique os dados informados.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  try {
    const result = await createPublicBooking(slug, parsed.data);
    const establishment = await prisma.establishment.findUnique({
      where: { slug },
      select: {
        name: true,
        slug: true,
        whatsapp: true,
        timezone: true,
        address: true,
        cancellationPolicy: true,
      },
    });

    const message = establishment
      ? appointmentMessage({
          customerName: parsed.data.name,
          customerPhone: parsed.data.phone,
          serviceName: result.serviceName,
          serviceDuration: result.durationMin,
          servicePrice: result.price,
          professionalName: result.professionalName,
          startAt: result.startAt,
          endAt: result.endAt,
          timezone: establishment.timezone,
          protocol: result.protocol,
          establishmentName: establishment.name,
          address: establishment.address,
          policy: establishment.cancellationPolicy,
        })
      : "";

    return Response.json(
      {
        ok: true,
        protocol: result.protocol,
        status: result.status,
        requiresConfirmation: result.requiresConfirmation,
        serviceName: result.serviceName,
        professionalName: result.professionalName,
        startAt: result.startAt.toISOString(),
        startAtLabel: establishment
          ? formatDateTimeInZone(result.startAt, establishment.timezone)
          : result.startAt.toISOString(),
        confirmationPath: confirmationUrl(slug, result.protocol, result.token).replace(
          /^https?:\/\/[^/]+/,
          "",
        ),
        whatsappUrl: establishment
          ? buildWhatsAppLink(establishment.whatsapp, message)
          : "",
        bookingPageUrl: publicBookingUrl(slug),
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BookingError) {
      return jsonError(error.message, error.status);
    }
    console.error("Erro ao criar agendamento público", error);
    return jsonError("Não foi possível concluir o agendamento. Tente novamente.", 500);
  }
}
