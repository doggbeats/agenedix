import { formatInTimeZone } from "date-fns-tz";
import { isValidDateString, zonedMinutesToUtc } from "./timezone";

export interface DayHours {
  isOpen: boolean;
  openMinute: number;
  closeMinute: number;
  breakStartMinute?: number | null;
  breakEndMinute?: number | null;
}

export interface ProfessionalWindow {
  professionalId: string;
  isWorking: boolean;
  startMinute: number;
  endMinute: number;
  breakStartMinute?: number | null;
  breakEndMinute?: number | null;
}

export interface BusyAppointment {
  professionalId: string;
  startAt: Date;
  endAt: Date;
  status: string;
}

export interface BlockedPeriod {
  professionalId: string | null;
  startsAt: Date;
  endsAt: Date;
}

export interface ScheduleExceptionWindow {
  professionalId: string | null;
  isClosed: boolean;
  openMinute?: number | null;
  closeMinute?: number | null;
}

export interface AvailabilityInput {
  date: string;
  timezone: string;
  now: Date;
  serviceDurationMin: number;
  serviceBufferMin: number;
  slotIntervalMinutes: number;
  businessHours: DayHours | null;
  professionals: ProfessionalWindow[];
  appointments: BusyAppointment[];
  blocks: BlockedPeriod[];
  exceptions?: ScheduleExceptionWindow[];
  minAdvanceMinutes: number;
  maxAdvanceDays: number;
}

export interface Slot {
  time: string;
  startAt: Date;
  endAt: Date;
  professionalIds: string[];
}

export function overlaps(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA < endB && startB < endA;
}

function overlapsMinutes(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
): boolean {
  return startA < endB && startB < endA;
}

function hasBreakConflict(
  startMinute: number,
  endMinute: number,
  breakStart?: number | null,
  breakEnd?: number | null,
): boolean {
  if (breakStart == null || breakEnd == null) return false;
  return overlapsMinutes(startMinute, endMinute, breakStart, breakEnd);
}

/**
 * Calcula horários realmente disponíveis. Função pura, usada no servidor
 * para montar a página pública e revalidada dentro da transação de reserva.
 */
export function buildAvailability(input: AvailabilityInput): Slot[] {
  if (!isValidDateString(input.date)) return [];
  if (input.serviceDurationMin <= 0) return [];

  const total = input.serviceDurationMin + Math.max(0, input.serviceBufferMin);
  const interval = Math.max(5, Math.min(120, input.slotIntervalMinutes || 15));
  const exceptions = input.exceptions ?? [];
  const establishmentException = exceptions.find((item) => item.professionalId === null);

  if (establishmentException?.isClosed) return [];
  if (!input.businessHours) return [];

  const exceptionOverride =
    establishmentException &&
    !establishmentException.isClosed &&
    establishmentException.openMinute != null &&
    establishmentException.closeMinute != null;

  if (!input.businessHours.isOpen && !exceptionOverride) return [];

  const business = {
    ...input.businessHours,
    ...(exceptionOverride
      ? {
          openMinute: establishmentException.openMinute as number,
          closeMinute: establishmentException.closeMinute as number,
        }
      : {}),
  };
  if (business.closeMinute <= business.openMinute) return [];

  const dayStart = input.now.getTime();
  const minStart = dayStart + Math.max(0, input.minAdvanceMinutes) * 60000;
  const maxStart = dayStart + Math.max(1, input.maxAdvanceDays) * 86400000;

  const activeWindows = input.professionals
    .map((professional) => {
      const exception = exceptions.find(
        (item) => item.professionalId === professional.professionalId,
      );
      if (!exception) return professional;
      if (exception.isClosed) return { ...professional, isWorking: false };
      return {
        ...professional,
        ...(exception.openMinute != null && exception.closeMinute != null
          ? {
              startMinute: exception.openMinute,
              endMinute: exception.closeMinute,
            }
          : {}),
      };
    })
    .filter((professional) => professional.isWorking);
  if (activeWindows.length === 0) return [];

  const appointments = input.appointments.filter(
    (appointment) =>
      appointment.status === "PENDING" || appointment.status === "CONFIRMED",
  );

  const slots: Slot[] = [];
  const seen = new Set<number>();

  for (
    let minute = business.openMinute;
    minute + total <= business.closeMinute;
    minute += interval
  ) {
    const endMinute = minute + total;

    if (hasBreakConflict(minute, endMinute, business.breakStartMinute, business.breakEndMinute)) {
      continue;
    }

    const startAt = zonedMinutesToUtc(input.date, minute, input.timezone);
    const endAt = new Date(startAt.getTime() + total * 60000);

    if (startAt.getTime() < minStart) continue;
    if (startAt.getTime() > maxStart) continue;
    if (seen.has(startAt.getTime())) continue;

    const availableProfessionals = activeWindows
      .filter((professional) => {
        if (minute < professional.startMinute) return false;
        if (endMinute > professional.endMinute) return false;
        if (
          hasBreakConflict(
            minute,
            endMinute,
            professional.breakStartMinute,
            professional.breakEndMinute,
          )
        ) {
          return false;
        }

        const blocked = input.blocks.some(
          (block) =>
            (block.professionalId === null ||
              block.professionalId === professional.professionalId) &&
            overlaps(startAt, endAt, block.startsAt, block.endsAt),
        );
        if (blocked) return false;

        const busy = appointments.some(
          (appointment) =>
            appointment.professionalId === professional.professionalId &&
            overlaps(startAt, endAt, appointment.startAt, appointment.endAt),
        );
        return !busy;
      })
      .map((professional) => professional.professionalId);

    if (availableProfessionals.length === 0) continue;

    seen.add(startAt.getTime());
    slots.push({
      time: `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`,
      startAt,
      endAt,
      professionalIds: availableProfessionals,
    });
  }

  return slots.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}

export function pickLeastBusyProfessional(
  professionalIds: string[],
  appointments: BusyAppointment[],
  timezone: string,
  date: string,
): string | null {
  if (professionalIds.length === 0) return null;
  const counts = new Map<string, number>(professionalIds.map((id) => [id, 0]));

  for (const appointment of appointments) {
    if (!counts.has(appointment.professionalId)) continue;
    if (appointment.status !== "PENDING" && appointment.status !== "CONFIRMED") {
      continue;
    }
    if (formatInTimeZone(appointment.startAt, timezone, "yyyy-MM-dd") !== date) {
      continue;
    }
    counts.set(
      appointment.professionalId,
      (counts.get(appointment.professionalId) ?? 0) + 1,
    );
  }

  return [...counts.entries()].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))[0][0];
}

export function isWithinCancellationWindow(
  startAt: Date,
  noticeHours: number,
  now = new Date(),
): boolean {
  const limit = startAt.getTime() - Math.max(0, noticeHours) * 3600000;
  return now.getTime() <= limit;
}
