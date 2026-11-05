"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import {
  failure,
  formBoolean,
  formList,
  formString,
  parseForm,
  success,
  type ActionState,
} from "@/lib/action-utils";
import {
  businessHoursSchema,
  establishmentSettingsSchema,
  timeBlockSchema,
} from "@/lib/validation";
import { ensureUniqueSlug } from "@/lib/slug";
import { normalizePhone, timeToMinutes } from "@/lib/format";
import { zonedTimeToUtc } from "@/lib/timezone";

function validTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("pt-BR", { timeZone: timezone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export async function updateSettingsAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireManager();

  const parsed = parseForm(establishmentSettingsSchema, {
    name: formString(formData, "name"),
    slug: formString(formData, "slug"),
    segment: formString(formData, "segment"),
    ownerName: formString(formData, "ownerName"),
    phone: formString(formData, "phone"),
    whatsapp: formString(formData, "whatsapp"),
    email: formString(formData, "email"),
    address: formString(formData, "address"),
    description: formString(formData, "description"),
    logoUrl: formString(formData, "logoUrl"),
    brandColor: formString(formData, "brandColor"),
    timezone: formString(formData, "timezone"),
    autoConfirmBookings: formBoolean(formData, "autoConfirmBookings"),
    publicPageEnabled: formBoolean(formData, "publicPageEnabled"),
    minAdvanceMinutes: formString(formData, "minAdvanceMinutes"),
    maxAdvanceDays: formString(formData, "maxAdvanceDays"),
    cancellationNoticeHours: formString(formData, "cancellationNoticeHours"),
    defaultServiceMin: formString(formData, "defaultServiceMin"),
    slotIntervalMinutes: formString(formData, "slotIntervalMinutes"),
    cancellationPolicy: formString(formData, "cancellationPolicy"),
    customerContactMessage: formString(formData, "customerContactMessage"),
  });

  if (!parsed.data) return parsed.state ?? failure("Dados inválidos.");
  if (!validTimezone(parsed.data.timezone)) {
    return failure("Fuso horário inválido. Exemplo: America/Sao_Paulo.", {
      timezone: ["Fuso horário inválido."],
    });
  }

  const slug = await ensureUniqueSlug(
    prisma,
    parsed.data.slug,
    auth.establishment.id,
  );
  const oldSlug = auth.establishment.slug;

  await prisma.establishment.update({
    where: { id: auth.establishment.id },
    data: {
      name: parsed.data.name,
      slug,
      segment: parsed.data.segment,
      ownerName: parsed.data.ownerName,
      phone: normalizePhone(parsed.data.phone),
      whatsapp: normalizePhone(parsed.data.whatsapp),
      email: parsed.data.email,
      address: parsed.data.address ?? null,
      description: parsed.data.description ?? null,
      logoUrl: parsed.data.logoUrl ?? null,
      brandColor: parsed.data.brandColor,
      timezone: parsed.data.timezone,
      autoConfirmBookings: parsed.data.autoConfirmBookings,
      publicPageEnabled: parsed.data.publicPageEnabled,
      minAdvanceMinutes: parsed.data.minAdvanceMinutes,
      maxAdvanceDays: parsed.data.maxAdvanceDays,
      cancellationNoticeHours: parsed.data.cancellationNoticeHours,
      defaultServiceMin: parsed.data.defaultServiceMin,
      slotIntervalMinutes: parsed.data.slotIntervalMinutes,
      cancellationPolicy: parsed.data.cancellationPolicy ?? null,
      customerContactMessage: parsed.data.customerContactMessage ?? null,
    },
  });

  await recordAudit({
    actorUserId: auth.user.id,
    establishmentId: auth.establishment.id,
    action: "establishment.settings.updated",
    entityType: "Establishment",
    entityId: auth.establishment.id,
    metadata: {
      slug,
      autoConfirmBookings: parsed.data.autoConfirmBookings,
      publicPageEnabled: parsed.data.publicPageEnabled,
    },
  });

  revalidatePath(`/agendar/${oldSlug}`);
  revalidatePath(`/agendar/${slug}`);
  revalidatePath("/painel/configuracoes");
  revalidatePath("/painel", "layout");

  return success("Configurações salvas.");
}

export async function updateBusinessHoursAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireManager();
  const errors: Record<string, string[]> = {};

  for (let weekday = 0; weekday < 7; weekday += 1) {
    const parsed = businessHoursSchema.safeParse({
      weekday,
      isOpen: formBoolean(formData, `isOpen_${weekday}`),
      openTime: formString(formData, `openTime_${weekday}`) || "09:00",
      closeTime: formString(formData, `closeTime_${weekday}`) || "18:00",
      breakStart: formString(formData, `breakStart_${weekday}`),
      breakEnd: formString(formData, `breakEnd_${weekday}`),
    });
    if (!parsed.success) {
      errors[`hours_${weekday}`] = parsed.error.issues.map((issue) => issue.message);
      continue;
    }
    const item = parsed.data;
    if (!item.isOpen) continue;
    const open = timeToMinutes(item.openTime);
    const close = timeToMinutes(item.closeTime);
    if (close <= open) {
      errors[`hours_${weekday}`] = ["O fechamento deve ser depois da abertura."];
      continue;
    }
    if (item.breakStart && item.breakEnd) {
      const breakStart = timeToMinutes(item.breakStart);
      const breakEnd = timeToMinutes(item.breakEnd);
      if (breakStart < open || breakEnd > close || breakEnd <= breakStart) {
        errors[`hours_${weekday}`] = ["Intervalo inválido para este dia."];
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return failure("Revise os horários de funcionamento.", errors);
  }

  await prisma.$transaction(
    Array.from({ length: 7 }, (_, weekday) =>
      prisma.businessHours.upsert({
        where: {
          establishmentId_weekday: {
            establishmentId: auth.establishment.id,
            weekday,
          },
        },
        create: {
          establishmentId: auth.establishment.id,
          weekday,
          isOpen: formBoolean(formData, `isOpen_${weekday}`),
          openMinute: timeToMinutes(formString(formData, `openTime_${weekday}`) || "09:00"),
          closeMinute: timeToMinutes(formString(formData, `closeTime_${weekday}`) || "18:00"),
          breakStartMinute: formString(formData, `breakStart_${weekday}`)
            ? timeToMinutes(formString(formData, `breakStart_${weekday}`))
            : null,
          breakEndMinute: formString(formData, `breakEnd_${weekday}`)
            ? timeToMinutes(formString(formData, `breakEnd_${weekday}`))
            : null,
        },
        update: {
          isOpen: formBoolean(formData, `isOpen_${weekday}`),
          openMinute: timeToMinutes(formString(formData, `openTime_${weekday}`) || "09:00"),
          closeMinute: timeToMinutes(formString(formData, `closeTime_${weekday}`) || "18:00"),
          breakStartMinute: formString(formData, `breakStart_${weekday}`)
            ? timeToMinutes(formString(formData, `breakStart_${weekday}`))
            : null,
          breakEndMinute: formString(formData, `breakEnd_${weekday}`)
            ? timeToMinutes(formString(formData, `breakEnd_${weekday}`))
            : null,
        },
      }),
    ),
  );

  await recordAudit({
    actorUserId: auth.user.id,
    establishmentId: auth.establishment.id,
    action: "establishment.hours.updated",
    entityType: "BusinessHours",
    entityId: auth.establishment.id,
  });

  revalidatePath("/painel/configuracoes");
  revalidatePath(`/agendar/${auth.establishment.slug}`);
  return success("Horários de funcionamento atualizados.");
}

export async function createTimeBlockAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireManager();
  const parsed = parseForm(timeBlockSchema, {
    professionalId: formString(formData, "professionalId"),
    date: formString(formData, "date"),
    startTime: formString(formData, "startTime"),
    endTime: formString(formData, "endTime"),
    reason: formString(formData, "reason"),
  });
  if (!parsed.data) return parsed.state ?? failure("Dados inválidos.");

  if (parsed.data.professionalId) {
    const professional = await prisma.professional.findFirst({
      where: {
        id: parsed.data.professionalId,
        establishmentId: auth.establishment.id,
      },
      select: { id: true },
    });
    if (!professional) return failure("Profissional inválido.");
  }

  const startsAt = zonedTimeToUtc(
    parsed.data.date,
    parsed.data.startTime,
    auth.establishment.timezone,
  );
  const endsAt = zonedTimeToUtc(
    parsed.data.date,
    parsed.data.endTime,
    auth.establishment.timezone,
  );
  if (endsAt <= startsAt) return failure("O fim do bloqueio deve ser depois do início.");

  await prisma.timeBlock.create({
    data: {
      establishmentId: auth.establishment.id,
      professionalId: parsed.data.professionalId ?? null,
      startsAt,
      endsAt,
      reason: parsed.data.reason,
    },
  });

  await recordAudit({
    actorUserId: auth.user.id,
    establishmentId: auth.establishment.id,
    action: "timeblock.created",
    entityType: "TimeBlock",
    metadata: {
      professionalId: parsed.data.professionalId ?? "todos",
      date: parsed.data.date,
    },
  });

  revalidatePath("/painel/agenda");
  revalidatePath("/painel/configuracoes");
  return success("Bloqueio de agenda criado.");
}

export async function deleteTimeBlockAction(formData: FormData): Promise<void> {
  const auth = await requireManager();
  const id = formString(formData, "id");
  const result = await prisma.timeBlock.deleteMany({
    where: { id, establishmentId: auth.establishment.id },
  });
  if (result.count > 0) {
    await recordAudit({
      actorUserId: auth.user.id,
      establishmentId: auth.establishment.id,
      action: "timeblock.deleted",
      entityType: "TimeBlock",
      entityId: id,
    });
  }
  revalidatePath("/painel/configuracoes");
  revalidatePath("/painel/agenda");
  redirect(
    `/painel/configuracoes?ok=${encodeURIComponent(
      result.count > 0 ? "Bloqueio removido." : "Bloqueio não encontrado.",
    )}#bloqueios`,
  );
}

export async function updateProfessionalAvailabilityAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireManager();
  const professionalId = formString(formData, "professionalId");
  const professional = await prisma.professional.findFirst({
    where: { id: professionalId, establishmentId: auth.establishment.id },
  });
  if (!professional) return failure("Profissional não encontrado.");

  const workdays = formList(formData, "workdays").map(Number);
  const start = timeToMinutes(formString(formData, "startTime") || "09:00");
  const end = timeToMinutes(formString(formData, "endTime") || "18:00");
  const breakStart = formString(formData, "breakStart");
  const breakEnd = formString(formData, "breakEnd");
  if (end <= start) return failure("O fim do expediente deve ser depois do início.");

  const startMinute = breakStart ? timeToMinutes(breakStart) : null;
  const endMinute = breakEnd ? timeToMinutes(breakEnd) : null;
  if (
    startMinute !== null &&
    endMinute !== null &&
    (endMinute <= startMinute || startMinute < start || endMinute > end)
  ) {
    return failure("Intervalo inválido para o profissional.");
  }

  await prisma.$transaction(
    Array.from({ length: 7 }, (_, weekday) =>
      prisma.professionalAvailability.upsert({
        where: {
          professionalId_weekday: { professionalId, weekday },
        },
        create: {
          establishmentId: auth.establishment.id,
          professionalId,
          weekday,
          isWorking: workdays.includes(weekday),
          startMinute: start,
          endMinute: end,
          breakStartMinute: startMinute,
          breakEndMinute: endMinute,
        },
        update: {
          isWorking: workdays.includes(weekday),
          startMinute: start,
          endMinute: end,
          breakStartMinute: startMinute,
          breakEndMinute: endMinute,
        },
      }),
    ),
  );

  revalidatePath("/painel/profissionais");
  revalidatePath("/painel/agenda");
  revalidatePath(`/agendar/${auth.establishment.slug}`);
  return success("Disponibilidade atualizada.");
}
