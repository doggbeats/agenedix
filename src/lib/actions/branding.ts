"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import {
  failure,
  formBoolean,
  formString,
  parseForm,
  success,
  type ActionState,
} from "@/lib/action-utils";
import {
  brandingSchema,
  notificationSettingsSchema,
  scheduleExceptionSchema,
} from "@/lib/validation";
import { safeImageUrl } from "@/lib/branding";
import { timeToMinutes } from "@/lib/format";

function parseGallery(text: string | undefined): string[] | null {
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const urls: string[] = [];
  for (const line of lines) {
    const url = safeImageUrl(line);
    if (!url) return null;
    urls.push(url);
  }
  return urls.slice(0, 12);
}

export async function updateBrandingAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireManager();
  const parsed = parseForm(brandingSchema, {
    primaryColor: formString(formData, "primaryColor"),
    secondaryColor: formString(formData, "secondaryColor"),
    backgroundColor: formString(formData, "backgroundColor"),
    textColor: formString(formData, "textColor"),
    buttonColor: formString(formData, "buttonColor"),
    fontFamily: formString(formData, "fontFamily") || "sans",
    buttonStyle: formString(formData, "buttonStyle") || "rounded",
    coverUrl: formString(formData, "coverUrl"),
    galleryText: formString(formData, "galleryText"),
    instagram: formString(formData, "instagram"),
    facebook: formString(formData, "facebook"),
    website: formString(formData, "website"),
    tagline: formString(formData, "tagline"),
    showTeam: formBoolean(formData, "showTeam"),
    showServices: formBoolean(formData, "showServices"),
    showGallery: formBoolean(formData, "showGallery"),
    showHours: formBoolean(formData, "showHours"),
    showAddress: formBoolean(formData, "showAddress"),
  });
  if (!parsed.data) return parsed.state ?? failure("Dados inválidos.");
  const input = parsed.data;

  const gallery = parseGallery(input.galleryText);
  if (gallery === null) {
    return failure("A galeria aceita apenas imagens anexadas, URLs http(s) ou caminhos iniciados por /.", {
      galleryText: ["Uma das linhas não é uma URL válida."],
    });
  }

  await prisma.$transaction([
    prisma.tenantBranding.upsert({
      where: { establishmentId: auth.establishment.id },
      create: {
        establishmentId: auth.establishment.id,
        primaryColor: input.primaryColor,
        secondaryColor: input.secondaryColor,
        backgroundColor: input.backgroundColor,
        textColor: input.textColor,
        buttonColor: input.buttonColor,
        fontFamily: input.fontFamily,
        buttonStyle: input.buttonStyle,
        coverUrl: input.coverUrl ?? null,
        gallery,
        instagram: input.instagram ?? null,
        facebook: input.facebook ?? null,
        website: input.website ?? null,
        tagline: input.tagline ?? null,
        showTeam: input.showTeam,
        showServices: input.showServices,
        showGallery: input.showGallery,
        showHours: input.showHours,
        showAddress: input.showAddress,
      },
      update: {
        primaryColor: input.primaryColor,
        secondaryColor: input.secondaryColor,
        backgroundColor: input.backgroundColor,
        textColor: input.textColor,
        buttonColor: input.buttonColor,
        fontFamily: input.fontFamily,
        buttonStyle: input.buttonStyle,
        coverUrl: input.coverUrl ?? null,
        gallery,
        instagram: input.instagram ?? null,
        facebook: input.facebook ?? null,
        website: input.website ?? null,
        tagline: input.tagline ?? null,
        showTeam: input.showTeam,
        showServices: input.showServices,
        showGallery: input.showGallery,
        showHours: input.showHours,
        showAddress: input.showAddress,
      },
    }),
    prisma.establishment.update({
      where: { id: auth.establishment.id },
      data: { brandColor: input.primaryColor },
    }),
  ]);

  await recordAudit({
    actorUserId: auth.user.id,
    establishmentId: auth.establishment.id,
    action: "branding.updated",
    entityType: "TenantBranding",
    entityId: auth.establishment.id,
    metadata: { primaryColor: parsed.data.primaryColor },
  });

  revalidatePath(`/agendar/${auth.establishment.slug}`);
  revalidatePath("/painel/personalizar");
  revalidatePath("/painel", "layout");
  return success("Identidade visual atualizada.");
}

export async function updateNotificationSettingsAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireManager();
  const parsed = parseForm(notificationSettingsSchema, {
    emailNotifications: formBoolean(formData, "emailNotifications"),
    notifyBookingCreated: formBoolean(formData, "notifyBookingCreated"),
    notifyBookingCancelled: formBoolean(formData, "notifyBookingCancelled"),
    notifyBookingRescheduled: formBoolean(formData, "notifyBookingRescheduled"),
    reminderHours: formString(formData, "reminderHours"),
  });
  if (!parsed.data) return parsed.state ?? failure("Dados inválidos.");

  await prisma.establishment.update({
    where: { id: auth.establishment.id },
    data: {
      emailNotifications: parsed.data.emailNotifications,
      notifyBookingCreated: parsed.data.notifyBookingCreated,
      notifyBookingCancelled: parsed.data.notifyBookingCancelled,
      notifyBookingRescheduled: parsed.data.notifyBookingRescheduled,
      reminderHours: parsed.data.reminderHours,
    },
  });

  await recordAudit({
    actorUserId: auth.user.id,
    establishmentId: auth.establishment.id,
    action: "notifications.settings.updated",
    entityType: "Establishment",
    entityId: auth.establishment.id,
    metadata: {
      emailNotifications: parsed.data.emailNotifications,
      reminderHours: parsed.data.reminderHours,
    },
  });

  revalidatePath("/painel/configuracoes");
  return success("Preferências de notificação salvas.");
}

export async function createScheduleExceptionAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireManager();
  const parsed = parseForm(scheduleExceptionSchema, {
    professionalId: formString(formData, "professionalId"),
    date: formString(formData, "date"),
    isClosed: formBoolean(formData, "isClosed"),
    openTime: formString(formData, "openTime"),
    closeTime: formString(formData, "closeTime"),
    reason: formString(formData, "reason"),
  });
  if (!parsed.data) return parsed.state ?? failure("Dados inválidos.");
  const input = parsed.data;

  if (input.professionalId) {
    const professional = await prisma.professional.findFirst({
      where: {
        id: input.professionalId,
        establishmentId: auth.establishment.id,
      },
      select: { id: true },
    });
    if (!professional) return failure("Profissional inválido.");
  }

  const date = new Date(`${input.date}T00:00:00.000Z`);
  const openMinute =
    !input.isClosed && input.openTime ? timeToMinutes(input.openTime) : null;
  const closeMinute =
    !input.isClosed && input.closeTime ? timeToMinutes(input.closeTime) : null;

  await prisma.$transaction(async (tx) => {
    await tx.scheduleException.deleteMany({
      where: {
        establishmentId: auth.establishment.id,
        professionalId: input.professionalId ?? null,
        date,
      },
    });
    await tx.scheduleException.create({
      data: {
        establishmentId: auth.establishment.id,
        professionalId: input.professionalId ?? null,
        date,
        isClosed: input.isClosed,
        openMinute,
        closeMinute,
        reason: input.reason,
      },
    });
  });

  await recordAudit({
    actorUserId: auth.user.id,
    establishmentId: auth.establishment.id,
    action: "schedule.exception.created",
    entityType: "ScheduleException",
    metadata: {
      date: input.date,
      professionalId: input.professionalId ?? "todos",
      isClosed: input.isClosed,
    },
  });

  revalidatePath("/painel/configuracoes");
  revalidatePath(`/agendar/${auth.establishment.slug}`);
  return success(
    input.isClosed
      ? "Exceção de fechamento registrada."
      : "Horário especial registrado.",
  );
}

export async function deleteScheduleExceptionAction(formData: FormData): Promise<void> {
  const auth = await requireManager();
  const id = formString(formData, "id");
  await prisma.scheduleException.deleteMany({
    where: { id, establishmentId: auth.establishment.id },
  });
  await recordAudit({
    actorUserId: auth.user.id,
    establishmentId: auth.establishment.id,
    action: "schedule.exception.deleted",
    entityType: "ScheduleException",
    entityId: id,
  });
  revalidatePath("/painel/configuracoes");
  revalidatePath(`/agendar/${auth.establishment.slug}`);
}
