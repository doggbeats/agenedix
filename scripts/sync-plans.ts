/**
 * Atualiza os planos comerciais no banco configurado em .env.local.
 *
 * Não cria estabelecimentos, usuários ou dados de demonstração. Pode ser
 * executado com segurança em produção: os planos são atualizados pelo slug.
 *
 * Uso: npx dotenv -e .env.local -- npx tsx scripts/sync-plans.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type PlanSeed = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  maxProfessionals: number;
  maxServices: number;
  maxUnits: number;
  maxUsers: number;
  maxAppointmentsMonth: number | null;
  trialDays: number;
  features: string[];
  sortOrder: number;
  highlight: boolean;
};

const plans: PlanSeed[] = [
  {
    id: "plan-essencial",
    slug: "essencial",
    name: "Essencial",
    description: "Para quem está começando a organizar a agenda.",
    priceMonthly: 79.9,
    priceYearly: 799,
    maxProfessionals: 1,
    maxServices: 15,
    maxUnits: 1,
    maxUsers: 2,
    maxAppointmentsMonth: 300,
    trialDays: 7,
    features: [
      "1 profissional ativo",
      "15 serviços cadastrados",
      "Página pública com a sua marca",
      "Até 300 agendamentos por mês",
      "Bloqueios de agenda e horários de funcionamento",
    ],
    sortOrder: 1,
    highlight: false,
  },
  {
    id: "plan-profissional",
    slug: "profissional",
    name: "Profissional",
    description: "A escolha de salões e barbearias em crescimento.",
    priceMonthly: 109.9,
    priceYearly: 1099,
    maxProfessionals: 5,
    maxServices: 60,
    maxUnits: 1,
    maxUsers: 5,
    maxAppointmentsMonth: null,
    trialDays: 7,
    features: [
      "5 profissionais ativos",
      "60 serviços cadastrados",
      "Agendamentos sem limite mensal",
      "Relatórios de faturamento e ocupação",
      "Mensagens de WhatsApp personalizadas",
    ],
    sortOrder: 2,
    highlight: true,
  },
  {
    id: "plan-equipe",
    slug: "equipe",
    name: "Equipe",
    description: "Para operações com várias equipes e alto volume.",
    priceMonthly: 139.9,
    priceYearly: 1399,
    maxProfessionals: 15,
    maxServices: 200,
    maxUnits: 3,
    maxUsers: 15,
    maxAppointmentsMonth: null,
    trialDays: 7,
    features: [
      "15 profissionais ativos",
      "200 serviços cadastrados",
      "Até 3 unidades",
      "Relatórios completos",
      "Suporte prioritário AgendamentoON",
    ],
    sortOrder: 3,
    highlight: false,
  },
];

async function main() {
  for (const plan of plans) {
    const existing = await prisma.subscriptionPlan.findUnique({
      where: { slug: plan.slug },
      select: {
        id: true,
        priceMonthly: true,
        priceYearly: true,
        providerPlanIdMonthly: true,
        providerPlanIdYearly: true,
      },
    });

    const priceChanged =
      !existing ||
      Number(existing.priceMonthly) !== plan.priceMonthly ||
      Number(existing.priceYearly) !== plan.priceYearly;

    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      create: {
        ...plan,
        active: true,
        isDemo: false,
      },
      update: {
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        maxProfessionals: plan.maxProfessionals,
        maxServices: plan.maxServices,
        maxUnits: plan.maxUnits,
        maxUsers: plan.maxUsers,
        maxAppointmentsMonth: plan.maxAppointmentsMonth,
        trialDays: plan.trialDays,
        features: plan.features,
        sortOrder: plan.sortOrder,
        highlight: plan.highlight,
        active: true,
        isDemo: false,
        // Preços novos exigem planos novos no Pagar.me. Sem isso, o gateway
        // continuaria cobrando o valor antigo do plano em cache.
        ...(priceChanged
          ? { providerPlanIdMonthly: null, providerPlanIdYearly: null }
          : {}),
      },
    });

    console.log(
      `${plan.slug}: R$ ${plan.priceMonthly.toFixed(2)}/mês · R$ ${plan.priceYearly.toFixed(2)}/ano · ${plan.trialDays} dias${priceChanged ? " (IDs do Pagar.me limpos)" : ""}`,
    );
  }
  await prisma.subscriptionPlan.updateMany({
    where: { slug: "premium" },
    data: { active: false },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
