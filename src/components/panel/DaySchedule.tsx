import Link from "next/link";
import type { Appointment, Professional, TimeBlock } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/constants";
import { formatDateTimeInZone, formatDuration, minutesToTime, timeToMinutes } from "@/lib/format";

const PX_PER_MINUTE = 1.15;

type AppointmentWithCustomer = Appointment & {
  customer: { name: string } | null;
};

const statusBlock: Record<string, string> = {
  PENDING: "border-amber-300 bg-amber-50 text-amber-900",
  CONFIRMED: "border-green-300 bg-green-50 text-green-950",
  COMPLETED: "border-slate-300 bg-slate-100 text-slate-600",
  CANCELLED: "border-red-200 bg-red-50 text-red-700 line-through",
  NO_SHOW: "border-orange-200 bg-orange-50 text-orange-800",
};

export function DaySchedule({
  timezone,
  openMinute,
  closeMinute,
  professionals,
  appointments,
  blocks,
}: {
  timezone: string;
  openMinute: number;
  closeMinute: number;
  professionals: Pick<Professional, "id" | "name" | "photoUrl">[];
  appointments: AppointmentWithCustomer[];
  blocks: TimeBlock[];
}) {
  const totalMinutes = Math.max(60, closeMinute - openMinute);
  const height = totalMinutes * PX_PER_MINUTE;
  const hourMarks: number[] = [];
  for (let minute = Math.ceil(openMinute / 60) * 60; minute <= closeMinute; minute += 60) {
    hourMarks.push(minute);
  }

  function offset(minute: number): number {
    return (minute - openMinute) * PX_PER_MINUTE;
  }

  function localMinute(value: Date): number {
    return timeToMinutes(formatDateTimeInZone(value, timezone, "HH:mm"));
  }

  if (professionals.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-white p-8 text-center text-sm text-slate-500">
        Nenhum profissional ativo para exibir na agenda.
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-xl border border-line bg-white shadow-sm"
      role="region"
      aria-label="Agenda do dia por profissional"
      tabIndex={0}
    >
      <div className="flex min-w-max">
        <div className="sticky left-0 z-10 w-14 shrink-0 border-r border-line bg-white">
          <div className="h-12 border-b border-line" />
          <div className="relative" style={{ height }}>
            {hourMarks.map((minute) => (
              <span
                key={minute}
                className="absolute -translate-y-2 pl-2 font-mono text-[10px] text-slate-500"
                style={{ top: offset(minute) }}
              >
                {minutesToTime(minute)}
              </span>
            ))}
          </div>
        </div>

        {professionals.map((professional) => {
          const ownAppointments = appointments.filter(
            (appointment) => appointment.professionalId === professional.id,
          );
          const ownBlocks = blocks.filter(
            (block) => block.professionalId === null || block.professionalId === professional.id,
          );

          return (
            <div key={professional.id} className="min-w-[220px] flex-1 border-r border-line last:border-r-0">
              <div className="flex h-12 items-center gap-2 border-b border-line px-3">
                {professional.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={professional.photoUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-paper text-[9px] font-bold text-slate-600">
                    {professional.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="truncate text-xs font-semibold text-ink">{professional.name}</span>
              </div>

              <div
                className="relative bg-[linear-gradient(to_bottom,transparent_calc(100%-1px),#0000000a_calc(100%-1px))] bg-[length:100%_69px]"
                style={{ height }}
              >
                {hourMarks.map((minute) => (
                  <div
                    key={minute}
                    className="absolute inset-x-0 border-t border-line"
                    style={{ top: offset(minute) }}
                  />
                ))}

                {ownBlocks.map((block) => {
                  const startMinute = Math.max(openMinute, localMinute(block.startsAt));
                  const endMinute = Math.min(closeMinute, localMinute(block.endsAt));
                  if (endMinute <= startMinute) return null;
                  return (
                    <div
                      key={block.id}
                      title={block.reason ?? "Horário bloqueado"}
                      className="absolute inset-x-1 z-10 overflow-hidden rounded-lg border border-slate-300 bg-[repeating-linear-gradient(45deg,#f5f5f4,#f5f5f4_6px,#e7e5e4_6px,#e7e5e4_12px)] px-2 py-1 text-[9px] font-semibold text-slate-500"
                      style={{
                        top: offset(startMinute),
                        height: Math.max(18, (endMinute - startMinute) * PX_PER_MINUTE),
                      }}
                    >
                      {block.reason ?? "Bloqueado"}
                    </div>
                  );
                })}

                {ownAppointments.map((appointment) => {
                  const startMinute = Math.max(openMinute, localMinute(appointment.startAt));
                  const endMinute = Math.min(closeMinute, localMinute(appointment.endAt));
                  if (endMinute <= startMinute) return null;
                  return (
                    <Link
                      key={appointment.id}
                      href={`/painel/agendamentos?protocolo=${encodeURIComponent(appointment.publicCode)}`}
                      className={`absolute inset-x-1 z-20 overflow-hidden rounded-lg border px-2 py-1.5 shadow-sm transition hover:brightness-[0.98] ${statusBlock[appointment.status] ?? statusBlock.CONFIRMED}`}
                      style={{
                        top: offset(startMinute) + 1,
                        height: Math.max(26, (endMinute - startMinute) * PX_PER_MINUTE - 2),
                      }}
                    >
                      <p className="truncate text-[10px] font-bold leading-tight">
                        {formatDateTimeInZone(appointment.startAt, timezone, "HH:mm")} ·{" "}
                        {appointment.customerName}
                      </p>
                      <p className="truncate text-[9px] leading-tight opacity-70">
                        {appointment.serviceName} · {formatDuration(appointment.durationMin)}
                      </p>
                      <p className="mt-0.5 inline-flex rounded-full bg-white/60 px-1.5 text-[8px] font-semibold uppercase tracking-wide">
                        {STATUS_LABELS[appointment.status as keyof typeof STATUS_LABELS]}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-line px-3 py-2 text-[10px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm border border-amber-300 bg-amber-50" /> Pendente
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm border border-green-300 bg-green-50" /> Confirmado
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm border border-slate-300 bg-slate-100" /> Concluído
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm border border-slate-300 bg-[repeating-linear-gradient(45deg,#f5f5f4,#f5f5f4_3px,#e7e5e4_3px,#e7e5e4_6px)]" />{" "}
          Bloqueio
        </span>
        <span className="ml-auto">Clique em um atendimento para ver os detalhes.</span>
      </div>
    </div>
  );
}
