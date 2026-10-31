import crypto from "node:crypto";
import { Prisma, type AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/format";
import type { BookingInput } from "@/lib/validation";
import { computeAvailability } from "./availability-service";
import { isWithinCancellationWindow } from "./availability";
import {
  canAccessAppointment,
  canMoveStatus,
  canTransitionStatus,
  isManagerRole,
  type MembershipRole,
} from "./permissions";
import { recordAudit } from "./audit";
import { ROLE_LABELS } from "./constants";
import { isSubscriptionUsable, subscriptionBlockedMessage } from "./subscription";
import {
  notifyCreatedById,
  notifyRescheduledById,
  notifyStatusById,
} from "./notifications";
import { formatInTimeZone } from "date-fns-tz";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length = 7): string {
  let result = "";
  for (let index = 0; index < length; index += 1) {
    result += CODE_ALPHABET[crypto.randomInt(0, CODE_ALPHABET.length)];
  }
  return result;
}

export function generateProtocol(): string {
  return `CP-${randomCode(6)}`;
}

export function generateAccessToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashAccessToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export class BookingError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "BookingError";
    this.status = status;
  }
}

function isOverlapConstraintError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return (
      error.code === "P2004" ||
      error.code === "P2034" ||
      error.message.includes("Appointment_professional_no_overlap") ||
      error.message.includes("could not serialize")
    );
  }
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return (
      error.message.includes("Appointment_professional_no_overlap") ||
      error.message.includes("23P01")
    );
  }
  return error instanceof Error && error.message.includes("Appointment_professional_no_overlap");
}

export interface BookingResult {
  protocol: string;
  token: string;
  appointmentId: string;
  status: AppointmentStatus;
  professionalId: string;
  professionalName: string;
  serviceName: string;
  startAt: Date;
  requiresConfirmation: boolean;
}

export async function createPublicBooking(
  slug: string,
  input: BookingInput,
): Promise<BookingResult> {
  const establishment = await prisma.establishment.findFirst({
    where: { slug, archivedAt: null },
    include: { subscription: true },
  });

  if (!establishment) {
    throw new BookingError("Estabelecimento não encontrado.", 404);
  }
  if (establishment.status !== "ACTIVE" || !establishment.publicPageEnabled) {
    throw new BookingError("A agenda online deste estabelecimento está indisponível.", 403);
  }
  if (!isSubscriptionUsable(establishment.subscription)) {
    throw new BookingError(
      `${subscriptionBlockedMessage(establishment.subscription)} A agenda online está indisponível.`,
      403,
    );
  }
  const now = new Date();
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const result = await prisma.$transaction(
        async (tx) => {
          const fresh = await tx.establishment.findUnique({
            where: { id: establishment.id },
            include: { subscription: true },
          });
          if (!fresh || fresh.status !== "ACTIVE" || !fresh.publicPageEnabled) {
            throw new BookingError("A agenda online está indisponível.", 403);
          }
          if (!isSubscriptionUsable(fresh.subscription)) {
            throw new BookingError(
              `${subscriptionBlockedMessage(fresh.subscription)} A agenda online está indisponível.`,
              403,
            );
          }

          const availability = await computeAvailability(tx, {
            establishment: fresh,
            serviceId: input.serviceId,
            professionalId: input.professionalId,
            date: input.date,
            now,
            publicOnly: true,
          });

          if (!availability.service) {
            throw new BookingError("Serviço não encontrado ou indisponível.", 404);
          }

          const slot = availability.slots.find((item) => item.time === input.time);
          if (!slot) {
            throw new BookingError(
              "Este horário não está mais disponível. Escolha outro.",
              409,
            );
          }

          const professionalId =
            input.professionalId === "any"
              ? slot.suggestedProfessionalId
              : input.professionalId;

          if (!professionalId || !slot.professionalIds.includes(professionalId)) {
            throw new BookingError(
              "Este horário não está mais disponível. Escolha outro.",
              409,
            );
          }

          const professional = availability.professionals.find(
            (item) => item.id === professionalId,
          );
          if (!professional) {
            throw new BookingError(
              "Profissional indisponível para este serviço.",
              400,
            );
          }

          const phone = normalizePhone(input.phone);
          const customer = await tx.customer.upsert({
            where: {
              establishmentId_phone: {
                establishmentId: fresh.id,
                phone,
              },
            },
            create: {
              establishmentId: fresh.id,
              name: input.name,
              phone,
              email: input.email,
            },
            update: {
              name: input.name,
              ...(input.email ? { email: input.email } : {}),
            },
          });

          const token = generateAccessToken();
          const protocol = generateProtocol();
          const status: AppointmentStatus = fresh.autoConfirmBookings
            ? "CONFIRMED"
            : "PENDING";

          const appointment = await tx.appointment.create({
            data: {
              publicCode: protocol,
              accessTokenHash: hashAccessToken(token),
              establishmentId: fresh.id,
              customerId: customer.id,
              professionalId,
              serviceId: availability.service.id,
              startAt: slot.startAt,
              endAt: slot.endAt,
              durationMin: availability.service.durationMin,
              bufferMin: availability.service.bufferMin,
              price: availability.service.price,
              status,
              origin: "ONLINE",
              notes: input.notes,
              serviceName: availability.service.name,
              professionalName: professional.name,
              customerName: input.name,
              customerPhone: phone,
              confirmedAt: status === "CONFIRMED" ? now : null,
            },
            select: {
              id: true,
              publicCode: true,
              startAt: true,
              status: true,
            },
          });

          await tx.appointmentEvent.create({
            data: {
              establishmentId: fresh.id,
              appointmentId: appointment.id,
              type: "CREATED",
              actorLabel: "Cliente (página pública)",
              toStartAt: slot.startAt,
              toEndAt: slot.endAt,
              metadata: { origin: "ONLINE", status },
            },
          });

          return {
            protocol,
            token,
            appointmentId: appointment.id,
            status: appointment.status,
            professionalId,
            professionalName: professional.name,
            serviceName: availability.service.name,
            startAt: appointment.startAt,
            requiresConfirmation: status === "PENDING",
          } satisfies BookingResult;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 20000,
        },
      );

      await recordAudit({
        establishmentId: establishment.id,
        action: "appointment.public.created",
        entityType: "Appointment",
        entityId: result.appointmentId,
        metadata: {
          protocol: result.protocol,
          status: result.status,
          professionalId: result.professionalId,
        },
      });

      await notifyCreatedById(result.appointmentId, result.token);

      return result;
    } catch (error) {
      if (error instanceof BookingError) throw error;
      if (isOverlapConstraintError(error)) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  console.error("Conflito persistente ao reservar", lastError);
  throw new BookingError(
    "Este horário acabou de ser reservado por outra pessoa. Escolha outro horário.",
    409,
  );
}

export async function getPublicAppointment(
  slug: string,
  protocol: string,
  token: string,
  now = new Date(),
) {
  if (!protocol || !token) return null;

  const appointment = await prisma.appointment.findFirst({
    where: {
      publicCode: protocol.toUpperCase(),
      accessTokenHash: hashAccessToken(token),
      establishment: { slug },
    },
    include: {
      establishment: true,
      professional: true,
      service: true,
    },
  });

  if (!appointment) return null;

  const noticeHours = appointment.establishment.cancellationNoticeHours;
  const cancellable =
    (appointment.status === "PENDING" || appointment.status === "CONFIRMED") &&
    appointment.startAt.getTime() > now.getTime() &&
    isWithinCancellationWindow(appointment.startAt, noticeHours, now);

  return {
    appointment,
    canCancel: cancellable,
    cancellationDeadline: new Date(
      appointment.startAt.getTime() - noticeHours * 3600000,
    ),
  };
}

export async function cancelPublicAppointment(
  slug: string,
  protocol: string,
  token: string,
  reason?: string,
): Promise<{ ok: true; alreadyCancelled?: boolean }> {
  const data = await getPublicAppointment(slug, protocol, token);
  if (!data) throw new BookingError("Agendamento não encontrado.", 404);

  const { appointment, canCancel } = data;
  if (appointment.status === "CANCELLED") {
    return { ok: true, alreadyCancelled: true };
  }
  if (!canCancel) {
    throw new BookingError(
      `Este agendamento não pode mais ser cancelado online. O prazo mínimo é de ${appointment.establishment.cancellationNoticeHours} hora(s) antes do atendimento. Fale com o estabelecimento pelo WhatsApp.`,
      409,
    );
  }

  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.appointment.updateMany({
      where: {
        id: appointment.id,
        establishmentId: appointment.establishmentId,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      data: {
        status: "CANCELLED",
        cancelledAt: now,
        cancellationReason: reason?.slice(0, 300) ?? "Cancelado pelo cliente",
      },
    });

    if (result.count > 0) {
      await tx.appointmentEvent.create({
        data: {
          establishmentId: appointment.establishmentId,
          appointmentId: appointment.id,
          type: "CANCELLED",
          actorLabel: "Cliente (página pública)",
          fromStartAt: appointment.startAt,
          fromEndAt: appointment.endAt,
          metadata: { reason: reason?.slice(0, 300) ?? "Cancelado pelo cliente" },
        },
      });
    }
    return result.count;
  });

  if (updated > 0) {
    await recordAudit({
      establishmentId: appointment.establishmentId,
      action: "appointment.public.cancelled",
      entityType: "Appointment",
      entityId: appointment.id,
      metadata: { protocol: appointment.publicCode },
    });
    await notifyStatusById(appointment.id, "CANCELLED", reason);
  }

  return { ok: true };
}

interface PanelActor {
  userId: string;
  establishmentId: string;
  role: MembershipRole;
  professionalId: string | null;
}

export async function updateAppointmentStatus(
  actor: PanelActor,
  appointmentId: string,
  nextStatus: AppointmentStatus,
  reason?: string,
) {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, establishmentId: actor.establishmentId },
  });
  if (!appointment) throw new BookingError("Agendamento não encontrado.", 404);
  if (
    !canAccessAppointment(actor.role, actor.professionalId, appointment.professionalId)
  ) {
    throw new BookingError("Você não tem permissão para este agendamento.", 403);
  }
  if (appointment.status === nextStatus) {
    return { ok: true, unchanged: true };
  }
  if (!canTransitionStatus(appointment.status, nextStatus)) {
    throw new BookingError("Esta alteração de status não é permitida.", 409);
  }
  if (!canMoveStatus(actor.role, appointment.status, nextStatus)) {
    throw new BookingError("Seu perfil não pode aplicar este status.", 403);
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.appointment.update({
      where: { id: appointment.id },
      data: {
        status: nextStatus,
        ...(nextStatus === "CONFIRMED" ? { confirmedAt: now } : {}),
        ...(nextStatus === "COMPLETED" ? { completedAt: now } : {}),
        ...(nextStatus === "CANCELLED"
          ? {
              cancelledAt: now,
              cancellationReason: reason?.slice(0, 300) ?? "Cancelado pelo estabelecimento",
            }
          : {}),
      },
    });

    await tx.appointmentEvent.create({
      data: {
        establishmentId: actor.establishmentId,
        appointmentId: appointment.id,
        type: nextStatus === "PENDING" ? "UPDATED" : nextStatus,
        actorUserId: actor.userId,
        actorLabel: ROLE_LABELS[actor.role],
        metadata: reason ? { reason: reason.slice(0, 300) } : undefined,
      },
    });
  });

  await recordAudit({
    actorUserId: actor.userId,
    establishmentId: actor.establishmentId,
    action: `appointment.status.${nextStatus.toLowerCase()}`,
    entityType: "Appointment",
    entityId: appointment.id,
    metadata: { from: appointment.status, to: nextStatus },
  });

  if (nextStatus === "CONFIRMED" || nextStatus === "CANCELLED") {
    await notifyStatusById(appointment.id, nextStatus, reason);
  }

  return { ok: true };
}

export async function rescheduleAppointment(
  actor: PanelActor,
  appointmentId: string,
  input: { professionalId: string; date: string; time: string },
) {
  if (!isManagerRole(actor.role)) {
    throw new BookingError("Apenas proprietários e administradores podem reagendar.", 403);
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, establishmentId: actor.establishmentId },
    include: { establishment: true },
  });
  if (!appointment) throw new BookingError("Agendamento não encontrado.", 404);
  if (appointment.status !== "PENDING" && appointment.status !== "CONFIRMED") {
    throw new BookingError("Este agendamento não pode mais ser reagendado.", 409);
  }

  const now = new Date();

  try {
    const updated = await prisma.$transaction(
      async (tx) => {
        const availability = await computeAvailability(tx, {
          establishment: appointment.establishment,
          serviceId: appointment.serviceId,
          professionalId: input.professionalId,
          date: input.date,
          now,
          excludeAppointmentId: appointment.id,
        });

        const slot = availability.slots.find((item) => item.time === input.time);
        if (!slot) {
          throw new BookingError("O novo horário não está disponível.", 409);
        }

        const professionalId =
          input.professionalId === "any"
            ? slot.suggestedProfessionalId
            : input.professionalId;
        const professional = availability.professionals.find(
          (item) => item.id === professionalId,
        );
        if (!professional || !professionalId || !slot.professionalIds.includes(professionalId)) {
          throw new BookingError("Profissional indisponível neste horário.", 409);
        }

        const updated = await tx.appointment.update({
          where: { id: appointment.id },
          data: {
            professionalId,
            professionalName: professional.name,
            startAt: slot.startAt,
            endAt: slot.endAt,
          },
          select: { id: true, startAt: true, endAt: true },
        });

        await tx.appointmentEvent.create({
          data: {
            establishmentId: actor.establishmentId,
            appointmentId: appointment.id,
            type: "RESCHEDULED",
            actorUserId: actor.userId,
            actorLabel: ROLE_LABELS[actor.role],
            fromStartAt: appointment.startAt,
            fromEndAt: appointment.endAt,
            toStartAt: slot.startAt,
            toEndAt: slot.endAt,
            metadata: { professionalId },
          },
        });

        return { appointment: updated, slotStartAt: slot.startAt };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 20000,
      },
    );

    await recordAudit({
      actorUserId: actor.userId,
      establishmentId: actor.establishmentId,
      action: "appointment.rescheduled",
      entityType: "Appointment",
      entityId: appointment.id,
      metadata: {
        from: formatInTimeZone(
          appointment.startAt,
          appointment.establishment.timezone,
          "yyyy-MM-dd HH:mm",
        ),
        to: formatInTimeZone(
          updated.slotStartAt,
          appointment.establishment.timezone,
          "yyyy-MM-dd HH:mm",
        ),
      },
    });

    await notifyRescheduledById(appointment.id, appointment.startAt);

    return updated.appointment;
  } catch (error) {
    if (error instanceof BookingError) throw error;
    if (isOverlapConstraintError(error)) {
      throw new BookingError("O novo horário acabou de ser ocupado. Escolha outro.", 409);
    }
    throw error;
  }
}

export async function createPanelAppointment(
  actor: PanelActor,
  input: {
    customerName: string;
    customerPhone: string;
    serviceId: string;
    professionalId: string;
    date: string;
    time: string;
    notes?: string;
  },
): Promise<BookingResult> {
  if (!isManagerRole(actor.role)) {
    throw new BookingError(
      "Somente proprietários e administradores podem criar agendamentos.",
      403,
    );
  }

  const establishment = await prisma.establishment.findFirst({
    where: { id: actor.establishmentId, archivedAt: null },
  });
  if (!establishment) throw new BookingError("Estabelecimento não encontrado.", 404);

  const now = new Date();

  const result = await prisma.$transaction(
    async (tx) => {
      const availability = await computeAvailability(tx, {
        establishment,
        serviceId: input.serviceId,
        professionalId: input.professionalId,
        date: input.date,
        now,
      });
      if (!availability.service) {
        throw new BookingError("Serviço indisponível.", 404);
      }
      const slot = availability.slots.find((item) => item.time === input.time);
      if (!slot) throw new BookingError("Horário indisponível.", 409);

      const professionalId =
        input.professionalId === "any"
          ? slot.suggestedProfessionalId
          : input.professionalId;
      const professional = availability.professionals.find(
        (item) => item.id === professionalId,
      );
      if (!professional || !professionalId) {
        throw new BookingError("Profissional indisponível.", 409);
      }

      const phone = normalizePhone(input.customerPhone);
      const customer = await tx.customer.upsert({
        where: {
          establishmentId_phone: { establishmentId: establishment.id, phone },
        },
        create: {
          establishmentId: establishment.id,
          name: input.customerName,
          phone,
        },
        update: { name: input.customerName },
      });

      const token = generateAccessToken();
      const protocol = generateProtocol();
      const appointment = await tx.appointment.create({
        data: {
          publicCode: protocol,
          accessTokenHash: hashAccessToken(token),
          establishmentId: establishment.id,
          customerId: customer.id,
          professionalId,
          serviceId: availability.service.id,
          createdByUserId: actor.userId,
          startAt: slot.startAt,
          endAt: slot.endAt,
          durationMin: availability.service.durationMin,
          bufferMin: availability.service.bufferMin,
          price: availability.service.price,
          status: "CONFIRMED",
          origin: "PANEL",
          notes: input.notes,
          serviceName: availability.service.name,
          professionalName: professional.name,
          customerName: input.customerName,
          customerPhone: phone,
          confirmedAt: now,
        },
      });

      await tx.appointmentEvent.create({
        data: {
          establishmentId: establishment.id,
          appointmentId: appointment.id,
          type: "CREATED",
          actorUserId: actor.userId,
          actorLabel: ROLE_LABELS[actor.role],
          toStartAt: slot.startAt,
          toEndAt: slot.endAt,
          metadata: { origin: "PANEL", status: "CONFIRMED" },
        },
      });

      return {
        protocol,
        token,
        appointmentId: appointment.id,
        status: appointment.status,
        professionalId,
        professionalName: professional.name,
        serviceName: availability.service.name,
        startAt: appointment.startAt,
        requiresConfirmation: false,
      } satisfies BookingResult;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 20000,
    },
  );

  await recordAudit({
    actorUserId: actor.userId,
    establishmentId: establishment.id,
    action: "appointment.panel.created",
    entityType: "Appointment",
    entityId: result.appointmentId,
    metadata: { protocol: result.protocol },
  });

  await notifyStatusById(result.appointmentId, "CONFIRMED");

  return result;
}
