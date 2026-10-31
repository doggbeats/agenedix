import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { formatDateTimeInZone } from "@/lib/format";
import { publicBookingUrl } from "@/lib/urls";

type NotifiableAppointment = {
  id: string;
  establishmentId: string;
  publicCode: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  professionalName: string;
  startAt: Date;
  customer: { email: string | null };
  establishment: {
    name: string;
    slug: string;
    timezone: string;
    email: string;
    emailNotifications: boolean;
    notifyBookingCreated: boolean;
    notifyBookingCancelled: boolean;
    notifyBookingRescheduled: boolean;
  };
};

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

function appointmentBody(
  appointment: NotifiableAppointment,
  intro: string,
  token?: string,
): string {
  const when = formatDateTimeInZone(
    appointment.startAt,
    appointment.establishment.timezone,
    "dd/MM/yyyy 'às' HH:mm",
  );
  const link = token
    ? `${publicBookingUrl(appointment.establishment.slug)}/confirmacao?${new URLSearchParams({
        protocolo: appointment.publicCode,
        token,
      }).toString()}`
    : publicBookingUrl(appointment.establishment.slug);

  return [
    `Olá, ${firstName(appointment.customerName)}!`,
    "",
    intro,
    "",
    `Estabelecimento: ${appointment.establishment.name}`,
    `Serviço: ${appointment.serviceName}`,
    `Profissional: ${appointment.professionalName}`,
    `Data: ${when}`,
    `Protocolo: ${appointment.publicCode}`,
    "",
    `Acompanhe seu agendamento: ${link}`,
    "",
    `Precisa falar com ${appointment.establishment.name}? Responda este e-mail.`,
  ].join("\n");
}

async function deliver(input: {
  establishmentId: string;
  appointmentId?: string | null;
  type: NotificationType;
  recipient: string;
  subject: string;
  body: string;
  dedupeKey: string;
}): Promise<void> {
  try {
    const existing = await prisma.notification.findUnique({
      where: { dedupeKey: input.dedupeKey },
      select: { id: true },
    });
    if (existing) return;

    const notification = await prisma.notification.create({
      data: {
        establishmentId: input.establishmentId,
        appointmentId: input.appointmentId ?? null,
        type: input.type,
        channel: "EMAIL",
        status: "PENDING",
        recipient: input.recipient,
        subject: input.subject,
        body: input.body,
        dedupeKey: input.dedupeKey,
      },
      select: { id: true },
    });

    const result = await sendEmail({
      to: input.recipient,
      subject: input.subject,
      text: input.body,
    });

    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: result.ok ? "SENT" : "FAILED",
        sentAt: result.ok ? new Date() : null,
        error: result.error?.slice(0, 500) ?? null,
      },
    });
  } catch (error) {
    console.error("Falha ao registrar notificação", input.type, error);
  }
}

const notificationInclude = {
  customer: { select: { email: true } },
  establishment: {
    select: {
      name: true,
      slug: true,
      timezone: true,
      email: true,
      emailNotifications: true,
      notifyBookingCreated: true,
      notifyBookingCancelled: true,
      notifyBookingRescheduled: true,
    },
  },
} as const;

async function loadAppointment(appointmentId: string) {
  return prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: notificationInclude,
  });
}

export async function notifyAppointmentCreated(
  appointment: NotifiableAppointment,
  token: string,
): Promise<void> {
  const settings = appointment.establishment;
  if (!settings.emailNotifications || !settings.notifyBookingCreated) return;
  if (!appointment.customer.email) return;

  await deliver({
    establishmentId: appointment.establishmentId,
    appointmentId: appointment.id,
    type: "BOOKING_CREATED",
    recipient: appointment.customer.email,
    subject: `Agendamento recebido — ${settings.name}`,
    body: appointmentBody(
      appointment,
      `Recebemos seu pedido de horário em ${settings.name}. O estabelecimento vai confirmar em breve.`,
      token,
    ),
    dedupeKey: `${appointment.id}:BOOKING_CREATED`,
  });
}

export async function notifyAppointmentConfirmed(
  appointment: NotifiableAppointment,
): Promise<void> {
  const settings = appointment.establishment;
  if (!settings.emailNotifications || !appointment.customer.email) return;

  await deliver({
    establishmentId: appointment.establishmentId,
    appointmentId: appointment.id,
    type: "BOOKING_CONFIRMED",
    recipient: appointment.customer.email,
    subject: `Horário confirmado — ${settings.name}`,
    body: appointmentBody(
      appointment,
      `Seu horário em ${settings.name} está confirmado. Esperamos por você!`,
    ),
    dedupeKey: `${appointment.id}:BOOKING_CONFIRMED`,
  });
}

export async function notifyAppointmentCancelled(
  appointment: NotifiableAppointment,
  reason?: string | null,
): Promise<void> {
  const settings = appointment.establishment;
  if (!settings.emailNotifications || !settings.notifyBookingCancelled) return;
  if (!appointment.customer.email) return;

  const extra = reason?.trim() ? `\n\nMotivo informado: ${reason.trim()}` : "";
  await deliver({
    establishmentId: appointment.establishmentId,
    appointmentId: appointment.id,
    type: "BOOKING_CANCELLED",
    recipient: appointment.customer.email,
    subject: `Agendamento cancelado — ${settings.name}`,
    body:
      appointmentBody(
        appointment,
        `Seu agendamento em ${settings.name} foi cancelado.${extra}`,
      ) + "\n\nSe precisar, escolha um novo horário pelo link abaixo.",
    dedupeKey: `${appointment.id}:BOOKING_CANCELLED`,
  });
}

export async function notifyAppointmentRescheduled(
  appointment: NotifiableAppointment,
  previousStartAt: Date,
): Promise<void> {
  const settings = appointment.establishment;
  if (!settings.emailNotifications || !settings.notifyBookingRescheduled) return;
  if (!appointment.customer.email) return;

  const previous = formatDateTimeInZone(
    previousStartAt,
    settings.timezone,
    "dd/MM/yyyy 'às' HH:mm",
  );
  await deliver({
    establishmentId: appointment.establishmentId,
    appointmentId: appointment.id,
    type: "BOOKING_RESCHEDULED",
    recipient: appointment.customer.email,
    subject: `Novo horário — ${settings.name}`,
    body: appointmentBody(
      appointment,
      `Seu agendamento em ${settings.name} foi remarcado. O horário anterior era ${previous}.`,
    ),
    dedupeKey: `${appointment.id}:BOOKING_RESCHEDULED:${appointment.startAt.getTime()}`,
  });
}

/**
 * Envia lembretes para agendamentos dentro da janela configurada por
 * estabelecimento. Idempotente pela chave de deduplicação.
 */
export async function sendDueReminders(now = new Date()): Promise<{
  scanned: number;
  sent: number;
}> {
  const horizon = new Date(now.getTime() + 7 * 86_400_000);
  const appointments = await prisma.appointment.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      startAt: { gt: now, lte: horizon },
      customer: { email: { not: null } },
      establishment: { status: "ACTIVE", emailNotifications: true },
    },
    include: {
      customer: { select: { email: true } },
      establishment: {
        select: {
          name: true,
          slug: true,
          timezone: true,
          email: true,
          emailNotifications: true,
          notifyBookingCreated: true,
          notifyBookingCancelled: true,
          notifyBookingRescheduled: true,
          reminderHours: true,
        },
      },
    },
    orderBy: { startAt: "asc" },
    take: 200,
  });

  let sent = 0;
  for (const appointment of appointments) {
    const reminderHours = Math.max(1, appointment.establishment.reminderHours);
    const sendAt = appointment.startAt.getTime() - reminderHours * 3_600_000;
    if (sendAt > now.getTime()) continue;

    const before = await prisma.notification.findUnique({
      where: { dedupeKey: `${appointment.id}:BOOKING_REMINDER` },
      select: { id: true },
    });
    if (before) continue;

    await deliver({
      establishmentId: appointment.establishmentId,
      appointmentId: appointment.id,
      type: "BOOKING_REMINDER",
      recipient: appointment.customer.email as string,
      subject: `Lembrete do seu horário — ${appointment.establishment.name}`,
      body: appointmentBody(
        appointment,
        `Passando para lembrar do seu horário em ${appointment.establishment.name}. Se não puder comparecer, avise com antecedência.`,
      ),
      dedupeKey: `${appointment.id}:BOOKING_REMINDER`,
    });
    sent += 1;
  }

  return { scanned: appointments.length, sent };
}

export async function notifyCreatedById(
  appointmentId: string,
  token: string,
): Promise<void> {
  try {
    const appointment = await loadAppointment(appointmentId);
    if (appointment) await notifyAppointmentCreated(appointment, token);
  } catch (error) {
    console.error("Falha ao notificar criação", appointmentId, error);
  }
}

export async function notifyStatusById(
  appointmentId: string,
  status: "CONFIRMED" | "CANCELLED",
  reason?: string | null,
): Promise<void> {
  try {
    const appointment = await loadAppointment(appointmentId);
    if (!appointment) return;
    if (status === "CONFIRMED") {
      await notifyAppointmentConfirmed(appointment);
    } else {
      await notifyAppointmentCancelled(appointment, reason);
    }
  } catch (error) {
    console.error("Falha ao notificar status", appointmentId, error);
  }
}

export async function notifyRescheduledById(
  appointmentId: string,
  previousStartAt: Date,
): Promise<void> {
  try {
    const appointment = await loadAppointment(appointmentId);
    if (appointment) await notifyAppointmentRescheduled(appointment, previousStartAt);
  } catch (error) {
    console.error("Falha ao notificar remarcação", appointmentId, error);
  }
}
