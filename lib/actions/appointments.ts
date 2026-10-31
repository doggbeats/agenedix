"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AppointmentStatus } from "@prisma/client";
import { requireManager, requirePanel } from "@/lib/auth/session";
import {
  failure,
  formString,
  parseForm,
  success,
  type ActionState,
} from "@/lib/action-utils";
import { ownerAppointmentSchema, rescheduleSchema } from "@/lib/validation";
import {
  BookingError,
  createPanelAppointment,
  rescheduleAppointment,
  updateAppointmentStatus,
} from "@/lib/booking";
import { appointmentMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import { confirmationUrl } from "@/lib/urls";

export type CreateAppointmentState = ActionState & {
  protocol?: string;
  token?: string;
  whatsappUrl?: string;
  confirmationUrl?: string;
};

const VALID_STATUSES: AppointmentStatus[] = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

function safeReturnTo(value: string): string {
  return value.startsWith("/painel") ? value : "/painel/agendamentos";
}

export async function updateStatusFormAction(formData: FormData): Promise<void> {
  const auth = await requirePanel();
  const appointmentId = formString(formData, "appointmentId");
  const status = formString(formData, "status") as AppointmentStatus;
  const reason = formString(formData, "reason") || undefined;
  const returnTo = safeReturnTo(formString(formData, "returnTo"));

  if (!appointmentId || !VALID_STATUSES.includes(status)) {
    redirect(`${returnTo}?erro=${encodeURIComponent("Dados do agendamento inválidos.")}`);
  }

  try {
    await updateAppointmentStatus(
      {
        userId: auth.user.id,
        establishmentId: auth.establishment.id,
        role: auth.role,
        professionalId: auth.professionalId,
      },
      appointmentId,
      status,
      reason,
    );
  } catch (error) {
    const message =
      error instanceof BookingError
        ? error.message
        : "Não foi possível atualizar o agendamento.";
    redirect(`${returnTo}?erro=${encodeURIComponent(message)}`);
  }

  revalidatePath("/painel");
  revalidatePath("/painel/agenda");
  revalidatePath("/painel/agendamentos");
  redirect(`${returnTo}?ok=${encodeURIComponent("Agendamento atualizado.")}`);
}

export async function createAppointmentAction(
  _prevState: CreateAppointmentState,
  formData: FormData,
): Promise<CreateAppointmentState> {
  const auth = await requireManager();
  const parsed = parseForm(ownerAppointmentSchema, {
    customerName: formString(formData, "customerName"),
    customerPhone: formString(formData, "customerPhone"),
    serviceId: formString(formData, "serviceId"),
    professionalId: formString(formData, "professionalId"),
    date: formString(formData, "date"),
    time: formString(formData, "time"),
    notes: formString(formData, "notes"),
  });
  if (!parsed.data) return parsed.state ?? failure("Dados inválidos.");

  try {
    const result = await createPanelAppointment(
      {
        userId: auth.user.id,
        establishmentId: auth.establishment.id,
        role: auth.role,
        professionalId: auth.professionalId,
      },
      parsed.data,
    );

    revalidatePath("/painel");
    revalidatePath("/painel/agenda");
    revalidatePath("/painel/agendamentos");

    const message = appointmentMessage({
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone,
      serviceName: result.serviceName,
      professionalName: result.professionalName,
      startAt: result.startAt,
      timezone: auth.establishment.timezone,
      protocol: result.protocol,
      establishmentName: auth.establishment.name,
      address: auth.establishment.address,
      policy: auth.establishment.cancellationPolicy,
      customTemplate: auth.establishment.whatsappMessage,
    });

    return {
      ok: true,
      message: "Agendamento criado e confirmado.",
      protocol: result.protocol,
      token: result.token,
      whatsappUrl: buildWhatsAppLink(parsed.data.customerPhone, message),
      confirmationUrl: confirmationUrl(
        auth.establishment.slug,
        result.protocol,
        result.token,
      ),
    };
  } catch (error) {
    if (error instanceof BookingError) {
      return failure(error.message);
    }
    console.error("Erro ao criar agendamento no painel", error);
    return failure("Não foi possível criar o agendamento.");
  }
}

export async function rescheduleFormAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireManager();
  const parsed = parseForm(rescheduleSchema, {
    appointmentId: formString(formData, "appointmentId"),
    professionalId: formString(formData, "professionalId"),
    date: formString(formData, "date"),
    time: formString(formData, "time"),
  });
  if (!parsed.data) return parsed.state ?? failure("Dados inválidos.");

  try {
    await rescheduleAppointment(
      {
        userId: auth.user.id,
        establishmentId: auth.establishment.id,
        role: auth.role,
        professionalId: auth.professionalId,
      },
      parsed.data.appointmentId,
      {
        professionalId: parsed.data.professionalId,
        date: parsed.data.date,
        time: parsed.data.time,
      },
    );
  } catch (error) {
    if (error instanceof BookingError) return failure(error.message);
    console.error("Erro ao reagendar", error);
    return failure("Não foi possível reagendar o atendimento.");
  }

  revalidatePath("/painel");
  revalidatePath("/painel/agenda");
  revalidatePath("/painel/agendamentos");
  return success("Agendamento reagendado.");
}
