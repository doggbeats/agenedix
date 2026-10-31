import { getPublicAppointment } from "@/lib/booking";

export const dynamic = "force-dynamic";

function icsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldLine(line: string): string {
  if (line.length <= 74) return line;
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    parts.push(rest.slice(0, 74));
    rest = ` ${rest.slice(74)}`;
  }
  parts.push(rest);
  return parts.join("\r\n");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(request.url);
  const protocol = url.searchParams.get("protocolo") ?? "";
  const token = url.searchParams.get("token") ?? "";

  const data = await getPublicAppointment(slug, protocol, token);
  if (!data) {
    return Response.json({ error: "Agendamento não encontrado." }, { status: 404 });
  }

  const { appointment } = data;
  const status =
    appointment.status === "CANCELLED"
      ? "CANCELLED"
      : appointment.status === "CONFIRMED"
        ? "CONFIRMED"
        : "TENTATIVE";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Agendix//Agenda online//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcs(`${appointment.publicCode}@${slug}`)}`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(appointment.startAt)}`,
    `DTEND:${icsDate(appointment.endAt)}`,
    foldLine(
      `SUMMARY:${escapeIcs(`${appointment.serviceName} — ${appointment.establishment.name}`)}`,
    ),
    foldLine(
      `DESCRIPTION:${escapeIcs(
        [
          `Protocolo: ${appointment.publicCode}`,
          `Profissional: ${appointment.professionalName}`,
          `Estabelecimento: ${appointment.establishment.name}`,
          `Contato: ${appointment.establishment.phone}`,
        ].join("\n"),
      )}`,
    ),
    foldLine(
      `LOCATION:${escapeIcs(
        appointment.establishment.address ?? appointment.establishment.name,
      )}`,
    ),
    `STATUS:${status}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return new Response(`${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="agendamento-${appointment.publicCode}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
