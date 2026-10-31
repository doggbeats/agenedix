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
import { serviceSchema } from "@/lib/validation";

async function validProfessionalIds(
  establishmentId: string,
  ids: string[],
): Promise<boolean> {
  if (ids.length === 0) return true;
  const count = await prisma.professional.count({
    where: { establishmentId, id: { in: ids } },
  });
  return count === ids.length;
}

export async function createServiceAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireManager();
  const parsed = parseForm(serviceSchema, {
    name: formString(formData, "name"),
    description: formString(formData, "description"),
    category: formString(formData, "category"),
    price: formString(formData, "price"),
    durationMin: formString(formData, "durationMin"),
    bufferMin: formString(formData, "bufferMin") || "0",
    imageUrl: formString(formData, "imageUrl"),
    onlineEnabled: formBoolean(formData, "onlineEnabled"),
    active: formBoolean(formData, "active"),
    professionalIds: formList(formData, "professionalIds"),
  });
  if (!parsed.data) return parsed.state ?? failure("Dados inválidos.");
  const data = parsed.data;

  if (!(await validProfessionalIds(auth.establishment.id, data.professionalIds))) {
    return failure("Um ou mais profissionais selecionados são inválidos.");
  }

  const service = await prisma.$transaction(async (tx) => {
    const created = await tx.service.create({
      data: {
        establishmentId: auth.establishment.id,
        name: data.name,
        description: data.description,
        category: data.category,
        price: data.price,
        durationMin: data.durationMin,
        bufferMin: data.bufferMin,
        imageUrl: data.imageUrl,
        onlineEnabled: data.onlineEnabled,
        active: data.active,
      },
    });

    if (data.professionalIds.length > 0) {
      await tx.professionalService.createMany({
        data: data.professionalIds.map((professionalId) => ({
          establishmentId: auth.establishment.id,
          professionalId,
          serviceId: created.id,
        })),
      });
    }
    return created;
  });

  await recordAudit({
    actorUserId: auth.user.id,
    establishmentId: auth.establishment.id,
    action: "service.created",
    entityType: "Service",
    entityId: service.id,
    metadata: { price: Number(service.price), duration: service.durationMin },
  });

  revalidatePath("/painel/servicos");
  revalidatePath(`/agendar/${auth.establishment.slug}`);
  return success("Serviço criado.");
}

export async function updateServiceAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireManager();
  const id = formString(formData, "id");
  const parsed = parseForm(serviceSchema, {
    name: formString(formData, "name"),
    description: formString(formData, "description"),
    category: formString(formData, "category"),
    price: formString(formData, "price"),
    durationMin: formString(formData, "durationMin"),
    bufferMin: formString(formData, "bufferMin") || "0",
    imageUrl: formString(formData, "imageUrl"),
    onlineEnabled: formBoolean(formData, "onlineEnabled"),
    active: formBoolean(formData, "active"),
    professionalIds: formList(formData, "professionalIds"),
  });
  if (!parsed.data) return parsed.state ?? failure("Dados inválidos.");
  const data = parsed.data;

  const existing = await prisma.service.findFirst({
    where: { id, establishmentId: auth.establishment.id, deletedAt: null },
  });
  if (!existing) return failure("Serviço não encontrado.");

  if (!(await validProfessionalIds(auth.establishment.id, data.professionalIds))) {
    return failure("Um ou mais profissionais selecionados são inválidos.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.service.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        price: data.price,
        durationMin: data.durationMin,
        bufferMin: data.bufferMin,
        imageUrl: data.imageUrl,
        onlineEnabled: data.onlineEnabled,
        active: data.active,
      },
    });

    await tx.professionalService.deleteMany({
      where: {
        establishmentId: auth.establishment.id,
        serviceId: existing.id,
      },
    });
    if (data.professionalIds.length > 0) {
      await tx.professionalService.createMany({
        data: data.professionalIds.map((professionalId) => ({
          establishmentId: auth.establishment.id,
          professionalId,
          serviceId: existing.id,
        })),
      });
    }

    await tx.auditLog.create({
      data: {
        actorUserId: auth.user.id,
        establishmentId: auth.establishment.id,
        action: "service.updated",
        entityType: "Service",
        entityId: existing.id,
        metadata: {
          oldPrice: Number(existing.price),
          newPrice: data.price,
          oldDuration: existing.durationMin,
          newDuration: data.durationMin,
        },
      },
    });
  });

  revalidatePath("/painel/servicos");
  revalidatePath(`/agendar/${auth.establishment.slug}`);
  return success("Serviço atualizado.");
}

export async function toggleServiceActiveAction(formData: FormData): Promise<void> {
  const auth = await requireManager();
  const id = formString(formData, "id");
  const service = await prisma.service.findFirst({
    where: { id, establishmentId: auth.establishment.id, deletedAt: null },
  });
  if (!service) {
    redirect(`/painel/servicos?erro=${encodeURIComponent("Serviço não encontrado.")}`);
  }

  await prisma.service.update({
    where: { id: service.id },
    data: { active: !service.active, onlineEnabled: !service.active ? true : service.onlineEnabled },
  });
  await recordAudit({
    actorUserId: auth.user.id,
    establishmentId: auth.establishment.id,
    action: "service.toggled",
    entityType: "Service",
    entityId: service.id,
    metadata: { active: !service.active },
  });
  revalidatePath("/painel/servicos");
  revalidatePath(`/agendar/${auth.establishment.slug}`);
  redirect(
    `/painel/servicos?ok=${encodeURIComponent(
      !service.active ? "Serviço ativado." : "Serviço desativado.",
    )}`,
  );
}

export async function toggleServiceOnlineAction(formData: FormData): Promise<void> {
  const auth = await requireManager();
  const id = formString(formData, "id");
  const service = await prisma.service.findFirst({
    where: { id, establishmentId: auth.establishment.id, deletedAt: null },
  });
  if (!service) {
    redirect(`/painel/servicos?erro=${encodeURIComponent("Serviço não encontrado.")}`);
  }
  await prisma.service.update({
    where: { id: service.id },
    data: { onlineEnabled: !service.onlineEnabled },
  });
  await recordAudit({
    actorUserId: auth.user.id,
    establishmentId: auth.establishment.id,
    action: "service.online.toggled",
    entityType: "Service",
    entityId: service.id,
    metadata: { onlineEnabled: !service.onlineEnabled },
  });
  revalidatePath("/painel/servicos");
  revalidatePath(`/agendar/${auth.establishment.slug}`);
  redirect(
    `/painel/servicos?ok=${encodeURIComponent(
      service.onlineEnabled
        ? "Serviço ocultado da página pública."
        : "Serviço liberado na página pública.",
    )}`,
  );
}

export async function deleteServiceAction(formData: FormData): Promise<void> {
  const auth = await requireManager();
  const id = formString(formData, "id");
  const service = await prisma.service.findFirst({
    where: { id, establishmentId: auth.establishment.id, deletedAt: null },
  });
  if (!service) {
    redirect(`/painel/servicos?erro=${encodeURIComponent("Serviço não encontrado.")}`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.service.update({
      where: { id: service.id },
      data: {
        active: false,
        onlineEnabled: false,
        deletedAt: new Date(),
      },
    });
    await tx.professionalService.deleteMany({
      where: { establishmentId: auth.establishment.id, serviceId: service.id },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: auth.user.id,
        establishmentId: auth.establishment.id,
        action: "service.soft_deleted",
        entityType: "Service",
        entityId: service.id,
        metadata: { name: service.name },
      },
    });
  });

  revalidatePath("/painel/servicos");
  revalidatePath(`/agendar/${auth.establishment.slug}`);
  redirect(`/painel/servicos?ok=${encodeURIComponent("Serviço removido.")}`);
}
