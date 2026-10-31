import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

interface AuditInput {
  actorUserId?: string | null;
  establishmentId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Log administrativo sem dados pessoais desnecessários.
 * Falhas de auditoria não devem derrubar a operação principal.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        establishmentId: input.establishmentId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: input.metadata,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (error) {
    console.error("Falha ao registrar auditoria", input.action, error);
  }
}
