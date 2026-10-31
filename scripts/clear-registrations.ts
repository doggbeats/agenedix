/**
 * Zera os cadastros da plataforma.
 *
 * Apaga estabelecimentos e todos os dados vinculados (membros, clientes,
 * agendamentos, serviços, profissionais, unidades, assinaturas, pagamentos,
 * notificações e auditoria). Mantém os planos de assinatura e os usuários
 * com isPlatformAdmin = true.
 *
 * Uso:
 *   npm run db:clear-registrations -- --confirm
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (!process.argv.includes("--confirm")) {
    console.error(
      "Nada foi apagado. Rode novamente com --confirm para confirmar a limpeza dos cadastros.",
    );
    process.exitCode = 1;
    return;
  }

  const before = {
    establishments: await prisma.establishment.count(),
    users: await prisma.user.count(),
    platformAdmins: await prisma.user.count({ where: { isPlatformAdmin: true } }),
    plans: await prisma.subscriptionPlan.count(),
    appointments: await prisma.appointment.count(),
  };

  console.log("Antes da limpeza:", before);

  const deleted = await prisma.$transaction(
    async (tx) => {
      const counts: Record<string, number> = {};
      const run = async (label: string, action: () => Promise<{ count: number }>) => {
        counts[label] = (await action()).count;
      };

      // Ordem respeita as chaves estrangeiras (filhos antes dos pais).
      await run("notifications", () => tx.notification.deleteMany());
      await run("appointmentEvents", () => tx.appointmentEvent.deleteMany());
      await run("appointments", () => tx.appointment.deleteMany());
      await run("payments", () => tx.payment.deleteMany());
      await run("subscriptions", () => tx.subscription.deleteMany());
      await run("timeBlocks", () => tx.timeBlock.deleteMany());
      await run("scheduleExceptions", () => tx.scheduleException.deleteMany());
      await run("professionalAvailability", () => tx.professionalAvailability.deleteMany());
      await run("professionalServices", () => tx.professionalService.deleteMany());
      await run("memberships", () => tx.membership.deleteMany());
      await run("businessHours", () => tx.businessHours.deleteMany());
      await run("branding", () => tx.tenantBranding.deleteMany());
      await run("auditLogs", () => tx.auditLog.deleteMany());
      await run("customers", () => tx.customer.deleteMany());
      await run("services", () => tx.service.deleteMany());
      await run("professionals", () => tx.professional.deleteMany());
      await run("units", () => tx.unit.deleteMany());
      await run("users", () => tx.user.deleteMany({ where: { isPlatformAdmin: false } }));
      await run("establishments", () => tx.establishment.deleteMany());

      return counts;
    },
    { maxWait: 15_000, timeout: 180_000 },
  );

  console.log("Registros apagados:", deleted);

  const after = {
    establishments: await prisma.establishment.count(),
    users: await prisma.user.count(),
    platformAdmins: await prisma.user.findMany({
      where: { isPlatformAdmin: true },
      select: { email: true },
    }),
    plans: await prisma.subscriptionPlan.count(),
    appointments: await prisma.appointment.count(),
  };

  console.log("Depois da limpeza:", after);
  console.log("Cadastros zerados. Planos e superadmins foram preservados.");
}

main()
  .catch((error) => {
    console.error("Falha ao zerar os cadastros:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
