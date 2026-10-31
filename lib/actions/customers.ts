"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/auth/session";
import {
  failure,
  formString,
  parseForm,
  success,
  type ActionState,
} from "@/lib/action-utils";
import { customerAnonymizeSchema } from "@/lib/validation";

export async function anonymizeCustomerAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireManager();
  const parsed = parseForm(customerAnonymizeSchema, {
    customerId: formString(formData, "customerId"),
    confirmation: formString(formData, "confirmation"),
  });
  if (!parsed.data) return parsed.state ?? failure("Dados inválidos.");

  const customer = await prisma.customer.findFirst({
    where: {
      id: parsed.data.customerId,
      establishmentId: auth.establishment.id,
    },
  });
  if (!customer) return failure("Cliente não encontrado.");
  if (customer.anonymizedAt) return failure("Este cliente já foi anonimizado.");

  const future = await prisma.appointment.count({
    where: {
      establishmentId: auth.establishment.id,
      customerId: customer.id,
      startAt: { gte: new Date() },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });
  if (future > 0) {
    return failure(
      "Cancele os agendamentos futuros deste cliente antes de excluir os dados pessoais.",
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.customer.update({
      where: { id: customer.id },
      data: {
        name: "Cliente removido",
        phone: `anonimizado-${customer.id}`,
        email: null,
        notes: null,
        anonymizedAt: new Date(),
      },
    });

    await tx.appointment.updateMany({
      where: {
        establishmentId: auth.establishment.id,
        customerId: customer.id,
      },
      data: {
        customerName: "Cliente removido",
        customerPhone: "removido",
        notes: null,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: auth.user.id,
        establishmentId: auth.establishment.id,
        action: "customer.anonymized",
        entityType: "Customer",
        entityId: customer.id,
        metadata: { lgpd: true },
      },
    });
  });

  revalidatePath("/painel/clientes");
  revalidatePath("/painel/agendamentos");
  return success("Dados pessoais removidos. O histórico de atendimentos foi mantido de forma anônima.");
}
