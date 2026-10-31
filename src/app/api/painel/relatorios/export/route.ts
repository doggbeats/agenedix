import { requireManager } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDateTimeInZone } from "@/lib/format";
import { dateRangeInZone, isValidDateString, todayInZone } from "@/lib/timezone";
import { STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

function csvCell(value: string | number | null | undefined): string {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const auth = await requireManager();
  const url = new URL(request.url);
  const today = todayInZone(auth.establishment.timezone);
  const from = isValidDateString(url.searchParams.get("de") ?? "")
    ? (url.searchParams.get("de") as string)
    : `${today.slice(0, 7)}-01`;
  const to = isValidDateString(url.searchParams.get("ate") ?? "")
    ? (url.searchParams.get("ate") as string)
    : today;

  const range = dateRangeInZone(from, to, auth.establishment.timezone);
  const appointments = await prisma.appointment.findMany({
    where: {
      establishmentId: auth.establishment.id,
      startAt: { gte: range.start, lt: range.end },
    },
    orderBy: { startAt: "asc" },
  });

  const header = [
    "Protocolo",
    "Data",
    "Hora",
    "Cliente",
    "Telefone",
    "Servico",
    "Profissional",
    "Status",
    "Origem",
    "Valor",
  ];

  const lines = [
    header.map(csvCell).join(";"),
    ...appointments.map((appointment) =>
      [
        appointment.publicCode,
        formatDateTimeInZone(appointment.startAt, auth.establishment.timezone, "dd/MM/yyyy"),
        formatDateTimeInZone(appointment.startAt, auth.establishment.timezone, "HH:mm"),
        appointment.customerName,
        appointment.customerPhone,
        appointment.serviceName,
        appointment.professionalName,
        STATUS_LABELS[appointment.status],
        appointment.origin,
        Number(appointment.price).toFixed(2).replace(".", ","),
      ]
        .map(csvCell)
        .join(";"),
    ),
  ];

  const filename = `agendamentos-${from}-a-${to}.csv`;

  return new Response(`\uFEFF${lines.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
