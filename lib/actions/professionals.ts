"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import {
  failure,
  formBoolean,
  formCheckboxNumberList,
  formList,
  formString,
  parseForm,
  success,
  type ActionState,
} from "@/lib/action-utils";
import { professionalSchema } from "@/lib/validation";
import { timeToMinutes } from "@/lib/format";

async function validServiceIds(establishmentId: string, ids: string[]) {
  if (ids.length === 0) return true;
  const count = await prisma.service.count({
    where: { establishmentId, id: { in: ids }, deletedAt: null },
  });
  return count === ids.length;
}

function parseProfessionalInput(formData: FormData) {
  return parseForm(professionalSchema, {
    name: formString(formData, "name"),
    bio: formString(formData, "bio"),
    photoUrl: formString(formData, "photoUrl"),
    specialties: formString(formData, "specialties"),
    active: formBoolean(formData, "active"),
    serviceIds: formList(formData, "serviceIds"),
    workdays: formCheckboxNumberList(formData, "workdays"),
    startTime: formString(formData, "startTime") || "09:00",
    endTime: formString(formData, "endTime") || "18:00",
    breakStart: formString(formData, "breakStart"),
    breakEnd: formString(formData, "breakEnd"),
  });
}

export async function createProfessionalAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireManager();
  const parsed = parseProfessionalInput(formData);
  if (!parsed.data) return parsed.state ?? failure("Dados inválidos.");
  const data = parsed.data;

  const start = timeToMinutes(data.startTime);
  const end = timeToMinutes(data.endTime);
  if (end <= start) return failure("O fim do expediente deve ser depois do início.");
  const breakStart = data.breakStart ? timeToMinutes(data.breakStart) : null;
  const breakEnd = data.breakEnd ? timeToMinutes(data.breakEnd) : null;
  if (
    breakStart !== null &&
    breakEnd !== null &&
    (breakEnd <= breakStart || breakStart < start || breakEnd > end)
  ) {
    return failure("Intervalo inválido para o profissional.");
  }

  if (!(await validServiceIds(auth.establishment.id, data.serviceIds))) {
    return failure("Um ou mais serviços selecionados são inválidos.");
  }

  const professional = await prisma.$transaction(async (tx) => {
    const created = await tx.professional.create({
      data: {
        establishmentId: auth.establishment.id,
        name: data.name,
        bio: data.bio,
        photoUrl: data.photoUrl,
        specialties: data.specialties,
        active: data.active,
      },
    });

    if (data.serviceIds.length > 0) {
      await tx.professionalService.createMany({
        data: data.serviceIds.map((serviceId) => ({
          establishmentId: auth.establishment.id,
          professionalId: created.id,
          serviceId,
        })),
      });
    }

    await tx.professionalAvailability.createMany({
      data: Array.from({ length: 7 }, (_, weekday) => ({
        establishmentId: auth.establishment.id,
        professionalId: created.id,
        weekday,
        isWorking: data.workdays.includes(weekday),
        startMinute: start,
        endMinute: end,
        breakStartMinute: breakStart,
        breakEndMinute: breakEnd,
      })),
    });

    return created;
  });

  await recordAudit({
    actorUserId: auth.user.id,
    establishmentId: auth.establishment.id,
    action: "professional.created",
    entityType: "Professional",
    entityId: professional.id,
  });

  revalidatePath("/painel/profissionais");
  revalidatePath("/painel/agenda");
  revalidatePath(`/agendar/${auth.establishment.slug}`);
  return success("Profissional cadastrado.");
}

export async function updateProfessionalAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireManager();
  const id = formString(formData, "id");
  const parsed = parseProfessionalInput(formData);
  if (!parsed.data) return parsed.state ?? failure("Dados inválidos.");
  const data = parsed.data;

  const existing = await prisma.professional.findFirst({
    where: { id, establishmentId: auth.establishment.id },
  });
  if (!existing) return failure("Profissional não encontrado.");

  const start = timeToMinutes(data.startTime);
  const end = timeToMinutes(data.endTime);
  if (end <= start) return failure("O fim do expediente deve ser depois do início.");
  const breakStart = data.breakStart ? timeToMinutes(data.breakStart) : null;
  const breakEnd = data.breakEnd ? timeToMinutes(data.breakEnd) : null;
  if (
    breakStart !== null &&
    breakEnd !== null &&
    (breakEnd <= breakStart || breakStart < start || breakEnd > end)
  ) {
    return failure("Intervalo inválido para o profissional.");
  }

  if (!(await validServiceIds(auth.establishment.id, data.serviceIds))) {
    return failure("Um ou mais serviços selecionados são inválidos.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.professional.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        bio: data.bio,
        photoUrl: data.photoUrl,
        specialties: data.specialties,
        active: data.active,
      },
    });

    await tx.professionalService.deleteMany({
      where: { establishmentId: auth.establishment.id, professionalId: existing.id },
    });
    if (data.serviceIds.length > 0) {
      await tx.professionalService.createMany({
        data: data.serviceIds.map((serviceId) => ({
          establishmentId: auth.establishment.id,
          professionalId: existing.id,
          serviceId,
        })),
      });
    }

    for (let weekday = 0; weekday < 7; weekday += 1) {
      await tx.professionalAvailability.upsert({
        where: {
          professionalId_weekday: {
            professionalId: existing.id,
            weekday,
          },
        },
        create: {
          establishmentId: auth.establishment.id,
          professionalId: existing.id,
          weekday,
          isWorking: data.workdays.includes(weekday),
          startMinute: start,
          endMinute: end,
          breakStartMinute: breakStart,
          breakEndMinute: breakEnd,
        },
        update: {
          isWorking: data.workdays.includes(weekday),
          startMinute: start,
          endMinute: end,
          breakStartMinute: breakStart,
          breakEndMinute: breakEnd,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorUserId: auth.user.id,
        establishmentId: auth.establishment.id,
        action: "professional.updated",
        entityType: "Professional",
        entityId: existing.id,
      },
    });
  });

  revalidatePath("/painel/profissionais");
  revalidatePath("/painel/agenda");
  revalidatePath(`/agendar/${auth.establishment.slug}`);
  return success("Profissional atualizado.");
}

export async function toggleProfessionalActiveAction(formData: FormData): Promise<void> {
  const auth = await requireManager();
  const id = formString(formData, "id");
  const professional = await prisma.professional.findFirst({
    where: { id, establishmentId: auth.establishment.id },
  });
  if (!professional) {
    redirect(
      `/painel/profissionais?erro=${encodeURIComponent("Profissional não encontrado.")}`,
    );
  }

  await prisma.professional.update({
    where: { id: professional.id },
    data: { active: !professional.active },
  });

  await recordAudit({
    actorUserId: auth.user.id,
    establishmentId: auth.establishment.id,
    action: "professional.toggled",
    entityType: "Professional",
    entityId: professional.id,
    metadata: { active: !professional.active },
  });

  revalidatePath("/painel/profissionais");
  revalidatePath("/painel/agenda");
  revalidatePath(`/agendar/${auth.establishment.slug}`);
  redirect(
    `/painel/profissionais?ok=${encodeURIComponent(
      !professional.active ? "Profissional ativado." : "Profissional desativado.",
    )}`,
  );
}
