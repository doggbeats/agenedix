import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildAvailability,
  pickLeastBusyProfessional,
  type AvailabilityInput,
  type Slot,
} from "./availability";
import { endOfDayInZone, startOfDayInZone } from "./timezone";

type Db = PrismaClient | Prisma.TransactionClient;

export interface AvailabilityParams {
  establishment: {
    id: string;
    timezone: string;
    minAdvanceMinutes: number;
    maxAdvanceDays: number;
    slotIntervalMinutes: number;
  };
  serviceId: string;
  professionalId: string;
  date: string;
  now?: Date;
  publicOnly?: boolean;
  excludeAppointmentId?: string;
}

export interface AvailabilityResult {
  service: {
    id: string;
    name: string;
    durationMin: number;
    bufferMin: number;
    price: Prisma.Decimal;
  } | null;
  professionals: Array<{
    id: string;
    name: string;
    photoUrl: string | null;
    specialties: string | null;
  }>;
  slots: Array<Slot & { suggestedProfessionalId: string | null }>;
}

export async function computeAvailability(
  db: Db,
  params: AvailabilityParams,
): Promise<AvailabilityResult> {
  const now = params.now ?? new Date();
  const service = await db.service.findFirst({
    where: {
      id: params.serviceId,
      establishmentId: params.establishment.id,
      active: true,
      deletedAt: null,
      ...(params.publicOnly ? { onlineEnabled: true } : {}),
    },
    select: {
      id: true,
      name: true,
      durationMin: true,
      bufferMin: true,
      price: true,
    },
  });

  if (!service) {
    return { service: null, professionals: [], slots: [] };
  }

  const links = await db.professionalService.findMany({
    where: {
      establishmentId: params.establishment.id,
      serviceId: service.id,
      professional: { active: true },
      ...(params.professionalId !== "any"
        ? { professionalId: params.professionalId }
        : {}),
    },
    select: {
      professional: {
        select: {
          id: true,
          name: true,
          photoUrl: true,
          specialties: true,
        },
      },
    },
    orderBy: { professional: { sortOrder: "asc" } },
  });

  const professionals = links.map((link) => link.professional);
  if (professionals.length === 0) {
    return { service, professionals: [], slots: [] };
  }

  const professionalIds = professionals.map((professional) => professional.id);
  const weekday = new Date(`${params.date}T12:00:00.000Z`).getUTCDay();
  const dayStart = startOfDayInZone(params.date, params.establishment.timezone);
  const dayEnd = endOfDayInZone(params.date, params.establishment.timezone);

  const [businessHours, windows, appointments, blocks, exceptions] = await Promise.all([
    db.businessHours.findUnique({
      where: {
        establishmentId_weekday: {
          establishmentId: params.establishment.id,
          weekday,
        },
      },
    }),
    db.professionalAvailability.findMany({
      where: {
        establishmentId: params.establishment.id,
        professionalId: { in: professionalIds },
        weekday,
      },
    }),
    db.appointment.findMany({
      where: {
        establishmentId: params.establishment.id,
        professionalId: { in: professionalIds },
        status: { in: ["PENDING", "CONFIRMED"] },
        startAt: { lt: dayEnd },
        endAt: { gt: dayStart },
        ...(params.excludeAppointmentId
          ? { id: { not: params.excludeAppointmentId } }
          : {}),
      },
      select: {
        professionalId: true,
        startAt: true,
        endAt: true,
        status: true,
      },
    }),
    db.timeBlock.findMany({
      where: {
        establishmentId: params.establishment.id,
        startsAt: { lt: dayEnd },
        endsAt: { gt: dayStart },
        OR: [{ professionalId: null }, { professionalId: { in: professionalIds } }],
      },
      select: {
        professionalId: true,
        startsAt: true,
        endsAt: true,
      },
    }),
    db.scheduleException.findMany({
      where: {
        establishmentId: params.establishment.id,
        date: new Date(`${params.date}T00:00:00.000Z`),
        OR: [{ professionalId: null }, { professionalId: { in: professionalIds } }],
      },
      select: {
        professionalId: true,
        isClosed: true,
        openMinute: true,
        closeMinute: true,
      },
    }),
  ]);

  const businessHoursInput = businessHours
    ? {
        isOpen: businessHours.isOpen,
        openMinute: businessHours.openMinute,
        closeMinute: businessHours.closeMinute,
        breakStartMinute: businessHours.breakStartMinute,
        breakEndMinute: businessHours.breakEndMinute,
      }
    : null;

  const defaultWindow = businessHours
    ? {
        isWorking: businessHours.isOpen,
        startMinute: businessHours.openMinute,
        endMinute: businessHours.closeMinute,
        breakStartMinute: businessHours.breakStartMinute,
        breakEndMinute: businessHours.breakEndMinute,
      }
    : null;

  const input: AvailabilityInput = {
    date: params.date,
    timezone: params.establishment.timezone,
    now,
    serviceDurationMin: service.durationMin,
    serviceBufferMin: service.bufferMin,
    slotIntervalMinutes: params.establishment.slotIntervalMinutes,
    businessHours: businessHoursInput,
    professionals: professionals.map((professional) => {
      const window = windows.find(
        (item) => item.professionalId === professional.id,
      );
      return {
        professionalId: professional.id,
        isWorking: window?.isWorking ?? defaultWindow?.isWorking ?? false,
        startMinute: window?.startMinute ?? defaultWindow?.startMinute ?? 540,
        endMinute: window?.endMinute ?? defaultWindow?.endMinute ?? 1140,
        breakStartMinute:
          window?.breakStartMinute ?? defaultWindow?.breakStartMinute ?? null,
        breakEndMinute:
          window?.breakEndMinute ?? defaultWindow?.breakEndMinute ?? null,
      };
    }),
    appointments,
    blocks,
    exceptions,
    minAdvanceMinutes: params.establishment.minAdvanceMinutes,
    maxAdvanceDays: params.establishment.maxAdvanceDays,
  };

  const slots = buildAvailability(input).map((slot) => ({
    ...slot,
    suggestedProfessionalId:
      params.professionalId === "any"
        ? pickLeastBusyProfessional(
            slot.professionalIds,
            appointments,
            params.establishment.timezone,
            params.date,
          )
        : params.professionalId,
  }));

  return { service, professionals, slots };
}

export async function getAvailability(params: AvailabilityParams) {
  return computeAvailability(prisma, params);
}
