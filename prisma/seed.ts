/**
 * Dados de demonstração do AgendamentoON.
 *
 * O script é idempotente: pode ser executado várias vezes. Todos os registros
 * de demonstração usam IDs fixos e são atualizados no lugar.
 *
 * Credenciais podem ser trocadas por variáveis de ambiente. Nunca reutilize as
 * senhas de demonstração em produção.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDaysToDate, todayInZone, zonedTimeToUtc } from "../src/lib/timezone";

const prisma = new PrismaClient();
const ROUNDS = 10;

function env(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim().length >= 4 ? value.trim() : fallback;
}

const ADMIN_EMAIL = env("SEED_ADMIN_EMAIL", "admin@agendix.app");
const ADMIN_PASSWORD = env("SEED_ADMIN_PASSWORD", "Admin@2026");
const OWNER_PASSWORD = env("SEED_OWNER_PASSWORD", "Demo@2026");
const PROFESSIONAL_PASSWORD = env("SEED_PROFESSIONAL_PASSWORD", "Demo@2026");

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
  isDemo: boolean;
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
    isDemo: false,
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
    isDemo: false,
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
    isDemo: false,
  },
  {
    id: "plan-premium",
    slug: "premium",
    name: "Premium",
    description: "Para redes e operações que precisam de escala e personalização.",
    priceMonthly: 189.9,
    priceYearly: 1899,
    maxProfessionals: 20,
    maxServices: 200,
    maxUnits: 5,
    maxUsers: 20,
    maxAppointmentsMonth: null,
    trialDays: 7,
    features: [
      "20 profissionais ativos",
      "200 serviços cadastrados",
      "Múltiplas cores e identidade visual",
      "Relatórios completos",
      "Suporte prioritário AgendamentoON",
    ],
    sortOrder: 4,
    highlight: false,
    isDemo: false,
  },
];

async function seedPlans() {
  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { id: plan.id },
      create: {
        id: plan.id,
        slug: plan.slug,
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
        active: true,
        isDemo: plan.isDemo,
        highlight: plan.highlight,
        sortOrder: plan.sortOrder,
      },
      update: {
        slug: plan.slug,
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
        active: true,
        isDemo: plan.isDemo,
        highlight: plan.highlight,
        sortOrder: plan.sortOrder,
      },
    });
  }
}

async function seedUser(input: {
  id: string;
  name: string;
  email: string;
  password: string;
  isPlatformAdmin?: boolean;
}) {
  const passwordHash = await bcrypt.hash(input.password, ROUNDS);
  await prisma.user.upsert({
    where: { email: input.email },
    create: {
      id: input.id,
      name: input.name,
      email: input.email,
      passwordHash,
      isPlatformAdmin: input.isPlatformAdmin ?? false,
    },
    update: {
      name: input.name,
      passwordHash,
      isPlatformAdmin: input.isPlatformAdmin ?? false,
    },
  });
}

async function seedBrandingAndUnit(input: {
  establishmentId: string;
  brandColor: string;
  address: string | null;
  phone: string;
  timezone: string;
}) {
  await prisma.tenantBranding.upsert({
    where: { establishmentId: input.establishmentId },
    create: {
      establishmentId: input.establishmentId,
      primaryColor: input.brandColor,
      secondaryColor: "#C4A484",
      backgroundColor: "#FFFFFF",
      textColor: "#0B0B0B",
      buttonColor: "#0B0B0B",
      gallery: [],
    },
    update: {},
  });

  const existing = await prisma.unit.findFirst({
    where: { establishmentId: input.establishmentId, isDefault: true },
    select: { id: true },
  });
  if (!existing) {
    await prisma.unit.create({
      data: {
        establishmentId: input.establishmentId,
        name: "Unidade principal",
        address: input.address,
        phone: input.phone,
        timezone: input.timezone,
        isDefault: true,
      },
    });
  }
}

function businessHours(
  establishmentId: string,
  open: number,
  close: number,
  breakStart: number,
  breakEnd: number,
) {
  return Array.from({ length: 7 }, (_, weekday) => ({
    id: `${establishmentId}-hours-${weekday}`,
    establishmentId,
    weekday,
    isOpen: weekday !== 0,
    openMinute: weekday === 6 ? open - 60 : open,
    closeMinute: weekday === 6 ? close - 60 : close,
    breakStartMinute: weekday !== 0 ? breakStart : null,
    breakEndMinute: weekday !== 0 ? breakEnd : null,
  }));
}

function availability(
  establishmentId: string,
  professionalId: string,
  workdays: number[],
  open: number,
  close: number,
  breakStart: number,
  breakEnd: number,
) {
  return Array.from({ length: 7 }, (_, weekday) => ({
    id: `${professionalId}-availability-${weekday}`,
    establishmentId,
    professionalId,
    weekday,
    isWorking: workdays.includes(weekday),
    startMinute: weekday === 6 ? open - 60 : open,
    endMinute: weekday === 6 ? close - 60 : close,
    breakStartMinute: breakStart,
    breakEndMinute: breakEnd,
  }));
}

type DemoAppointment = {
  id: string;
  code: string;
  dayOffset: number;
  time: string;
  professionalId: string;
  serviceId: string;
  customerId: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED";
};

async function seedAppointments(
  establishmentId: string,
  timezone: string,
  serviceDuration: Record<string, number>,
  rows: DemoAppointment[],
) {
  const today = todayInZone(timezone);
  for (const row of rows) {
    const date = addDaysToDate(today, row.dayOffset);
    const startAt = zonedTimeToUtc(date, row.time, timezone);
    const duration = serviceDuration[row.serviceId] ?? 30;
    const endAt = new Date(startAt.getTime() + duration * 60000);
    const customer = await prisma.customer.findUnique({
      where: { id: row.customerId },
      select: { name: true, phone: true },
    });
    const service = await prisma.service.findUnique({
      where: { id: row.serviceId },
      select: { name: true, price: true, bufferMin: true },
    });
    const professional = await prisma.professional.findUnique({
      where: { id: row.professionalId },
      select: { name: true },
    });
    if (!customer || !service || !professional) continue;

    await prisma.appointment.upsert({
      where: { id: row.id },
      create: {
        id: row.id,
        publicCode: row.code,
        accessTokenHash: `seed-token-${row.id}`,
        establishmentId,
        customerId: row.customerId,
        professionalId: row.professionalId,
        serviceId: row.serviceId,
        startAt,
        endAt,
        durationMin: duration,
        bufferMin: service.bufferMin,
        price: service.price,
        status: row.status,
        origin: "PANEL",
        serviceName: service.name,
        professionalName: professional.name,
        customerName: customer.name,
        customerPhone: customer.phone,
        confirmedAt: row.status === "CONFIRMED" ? new Date() : null,
        completedAt: row.status === "COMPLETED" ? new Date() : null,
      },
      update: {
        startAt,
        endAt,
        status: row.status,
        professionalName: professional.name,
        serviceName: service.name,
        customerName: customer.name,
        customerPhone: customer.phone,
        price: service.price,
      },
    });
  }
}

async function seedNobre() {
  const establishmentId = "estab-barbearia-nobre";
  const slug = "barbearia-nobre";
  const tz = "America/Sao_Paulo";

  await prisma.establishment.upsert({
    where: { id: establishmentId },
    create: {
      id: establishmentId,
      slug,
      name: "Barbearia Nobre",
      segment: "Barbearia",
      ownerName: "Rafael Nogueira",
      email: "contato@barbearianobre.com.br",
      phone: "5561988887700",
      whatsapp: "5561988887700",
      address: "SQN 208, Bloco C, Loja 12 — Asa Norte, Brasília/DF",
      description:
        "Barbearia clássica com atendimento personalizado, produtos profissionais e uma agenda feita para o seu tempo.",
      brandColor: "#9A6B4F",
      timezone: tz,
      status: "ACTIVE",
      publicPageEnabled: true,
      autoConfirmBookings: false,
      minAdvanceMinutes: 60,
      maxAdvanceDays: 60,
      cancellationNoticeHours: 4,
      defaultServiceMin: 30,
      slotIntervalMinutes: 15,
      cancellationPolicy:
        "Cancelamentos e remarcações podem ser feitos online com até 4 horas de antecedência. Depois desse prazo, fale com a barbearia pelo WhatsApp.",
      whatsappMessage:
        "Olá, {primeiro_nome}! Seu horário na {estabelecimento} está reservado.\n\nServiço: {servico}\nProfissional: {profissional}\nData: {data}\nProtocolo: {protocolo}\n\nQualquer dúvida, é só responder esta mensagem.",
    },
    update: {
      name: "Barbearia Nobre",
      status: "ACTIVE",
      publicPageEnabled: true,
      brandColor: "#9A6B4F",
      timezone: tz,
    },
  });

  await seedBrandingAndUnit({
    establishmentId,
    brandColor: "#9A6B4F",
    address: "SQN 208, Bloco C, Loja 12 — Asa Norte, Brasília/DF",
    phone: "5561988887700",
    timezone: tz,
  });

  const now = new Date();
  await prisma.subscription.upsert({
    where: { establishmentId },
    create: {
      id: "sub-nobre",
      establishmentId,
      planId: "plan-profissional",
      status: "ACTIVE",
      billingCycle: "MONTHLY",
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 30 * 86400000),
      provider: "MANUAL",
    },
    update: {
      planId: "plan-profissional",
      status: "ACTIVE",
      currentPeriodEnd: new Date(now.getTime() + 30 * 86400000),
    },
  });

  await seedUser({
    id: "user-nobre-owner",
    name: "Rafael Nogueira",
    email: "dono@barbearianobre.com.br",
    password: OWNER_PASSWORD,
  });
  await seedUser({
    id: "user-nobre-admin",
    name: "Marina Costa",
    email: "admin@barbearianobre.com.br",
    password: OWNER_PASSWORD,
  });
  await seedUser({
    id: "user-nobre-bruno",
    name: "Bruno Salles",
    email: "bruno@barbearianobre.com.br",
    password: PROFESSIONAL_PASSWORD,
  });

  await prisma.membership.upsert({
    where: { userId_establishmentId: { userId: "user-nobre-owner", establishmentId } },
    create: {
      id: "membership-nobre-owner",
      userId: "user-nobre-owner",
      establishmentId,
      role: "OWNER",
    },
    update: { role: "OWNER", professionalId: null },
  });

  await prisma.membership.upsert({
    where: { userId_establishmentId: { userId: "user-nobre-admin", establishmentId } },
    create: {
      id: "membership-nobre-admin",
      userId: "user-nobre-admin",
      establishmentId,
      role: "ADMIN",
    },
    update: { role: "ADMIN", professionalId: null },
  });

  const professionals = [
    {
      id: "nobre-prof-rafael",
      name: "Rafael Nogueira",
      bio: "Fundador da Nobre. Especialista em cortes clássicos e barba desenhada.",
      specialties: "Corte clássico, barba, navalha",
      sortOrder: 1,
    },
    {
      id: "nobre-prof-bruno",
      name: "Bruno Salles",
      bio: "Cortes modernos, textura e finalização com produtos profissionais.",
      specialties: "Corte moderno, degradê, styling",
      sortOrder: 2,
    },
    {
      id: "nobre-prof-diego",
      name: "Diego Martins",
      bio: "Barba, pigmentação e cuidados com a pele.",
      specialties: "Barba, pigmentação, skincare",
      sortOrder: 3,
    },
  ];

  for (const professional of professionals) {
    await prisma.professional.upsert({
      where: { id: professional.id },
      create: {
        ...professional,
        establishmentId,
        active: true,
      },
      update: {
        name: professional.name,
        bio: professional.bio,
        specialties: professional.specialties,
        sortOrder: professional.sortOrder,
        active: true,
      },
    });
  }

  await prisma.membership.upsert({
    where: { userId_establishmentId: { userId: "user-nobre-bruno", establishmentId } },
    create: {
      id: "membership-nobre-bruno",
      userId: "user-nobre-bruno",
      establishmentId,
      role: "PROFESSIONAL",
      professionalId: "nobre-prof-bruno",
    },
    update: { role: "PROFESSIONAL", professionalId: "nobre-prof-bruno" },
  });

  const services = [
    {
      id: "nobre-svc-corte",
      name: "Corte masculino",
      description: "Corte na tesoura ou máquina, lavagem e finalização.",
      category: "Cabelo",
      price: 70,
      durationMin: 40,
      bufferMin: 10,
      sortOrder: 1,
      professionalIds: ["nobre-prof-rafael", "nobre-prof-bruno", "nobre-prof-diego"],
    },
    {
      id: "nobre-svc-barba",
      name: "Barba completa",
      description: "Modelagem, toalha quente, navalha e hidratação.",
      category: "Barba",
      price: 55,
      durationMin: 30,
      bufferMin: 10,
      sortOrder: 2,
      professionalIds: ["nobre-prof-rafael", "nobre-prof-diego"],
    },
    {
      id: "nobre-svc-combo",
      name: "Corte + barba",
      description: "O combo completo com corte, barba e finalização.",
      category: "Combo",
      price: 110,
      durationMin: 70,
      bufferMin: 10,
      sortOrder: 3,
      professionalIds: ["nobre-prof-rafael", "nobre-prof-bruno"],
    },
    {
      id: "nobre-svc-pigmentacao",
      name: "Pigmentação de barba",
      description: "Correção de falhas e uniformização da cor.",
      category: "Barba",
      price: 65,
      durationMin: 35,
      bufferMin: 10,
      sortOrder: 4,
      professionalIds: ["nobre-prof-diego"],
    },
    {
      id: "nobre-svc-sobrancelha",
      name: "Sobrancelha na navalha",
      description: "Design e limpeza com acabamento discreto.",
      category: "Detalhes",
      price: 30,
      durationMin: 15,
      bufferMin: 5,
      sortOrder: 5,
      professionalIds: ["nobre-prof-rafael", "nobre-prof-bruno", "nobre-prof-diego"],
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { id: service.id },
      create: {
        id: service.id,
        establishmentId,
        name: service.name,
        description: service.description,
        category: service.category,
        price: service.price,
        durationMin: service.durationMin,
        bufferMin: service.bufferMin,
        sortOrder: service.sortOrder,
        onlineEnabled: true,
        active: true,
      },
      update: {
        name: service.name,
        description: service.description,
        category: service.category,
        price: service.price,
        durationMin: service.durationMin,
        bufferMin: service.bufferMin,
        sortOrder: service.sortOrder,
        onlineEnabled: true,
        active: true,
        deletedAt: null,
      },
    });

    for (const professionalId of service.professionalIds) {
      await prisma.professionalService.upsert({
        where: {
          professionalId_serviceId: { professionalId, serviceId: service.id },
        },
        create: { establishmentId, professionalId, serviceId: service.id },
        update: {},
      });
    }
  }

  const hours = businessHours(establishmentId, 540, 1140, 720, 780);
  for (const hour of hours) {
    await prisma.businessHours.upsert({
      where: {
        establishmentId_weekday: { establishmentId, weekday: hour.weekday },
      },
      create: hour,
      update: {
        isOpen: hour.isOpen,
        openMinute: hour.openMinute,
        closeMinute: hour.closeMinute,
        breakStartMinute: hour.breakStartMinute,
        breakEndMinute: hour.breakEndMinute,
      },
    });
  }

  for (const professional of professionals) {
    const windows = availability(
      establishmentId,
      professional.id,
      [2, 3, 4, 5, 6],
      540,
      1140,
      720,
      780,
    );
    for (const window of windows) {
      await prisma.professionalAvailability.upsert({
        where: {
          professionalId_weekday: {
            professionalId: professional.id,
            weekday: window.weekday,
          },
        },
        create: window,
        update: {
          isWorking: window.isWorking,
          startMinute: window.startMinute,
          endMinute: window.endMinute,
          breakStartMinute: window.breakStartMinute,
          breakEndMinute: window.breakEndMinute,
        },
      });
    }
  }

  const customers = [
    {
      id: "nobre-customer-lucas",
      name: "Lucas Ferreira",
      phone: "5561991112233",
      email: "lucas.ferreira@example.com",
      notes: "Prefere corte na tesoura.",
    },
    {
      id: "nobre-customer-andre",
      name: "André Lima",
      phone: "5561992223344",
      email: "andre.lima@example.com",
      notes: null,
    },
    {
      id: "nobre-customer-marcos",
      name: "Marcos Paulo",
      phone: "5561993334455",
      email: null,
      notes: "Alergia a produtos com álcool.",
    },
    {
      id: "nobre-customer-joao",
      name: "João Vitor",
      phone: "5561994445566",
      email: "joao.vitor@example.com",
      notes: null,
    },
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { id: customer.id },
      create: { ...customer, establishmentId },
      update: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        notes: customer.notes,
      },
    });
  }

  await seedAppointments(
    establishmentId,
    tz,
    { "nobre-svc-corte": 40, "nobre-svc-barba": 30, "nobre-svc-combo": 70 },
    [
      {
        id: "nobre-appt-1",
        code: "AGX-NOB001",
        dayOffset: 1,
        time: "09:00",
        professionalId: "nobre-prof-rafael",
        serviceId: "nobre-svc-corte",
        customerId: "nobre-customer-lucas",
        status: "CONFIRMED",
      },
      {
        id: "nobre-appt-2",
        code: "AGX-NOB002",
        dayOffset: 1,
        time: "10:30",
        professionalId: "nobre-prof-bruno",
        serviceId: "nobre-svc-combo",
        customerId: "nobre-customer-andre",
        status: "PENDING",
      },
      {
        id: "nobre-appt-3",
        code: "AGX-NOB003",
        dayOffset: 2,
        time: "14:00",
        professionalId: "nobre-prof-diego",
        serviceId: "nobre-svc-barba",
        customerId: "nobre-customer-marcos",
        status: "CONFIRMED",
      },
      {
        id: "nobre-appt-4",
        code: "AGX-NOB004",
        dayOffset: 3,
        time: "16:00",
        professionalId: "nobre-prof-rafael",
        serviceId: "nobre-svc-corte",
        customerId: "nobre-customer-joao",
        status: "PENDING",
      },
    ],
  );
}

async function seedAurora() {
  const establishmentId = "estab-studio-aurora";
  const tz = "America/Sao_Paulo";

  await prisma.establishment.upsert({
    where: { id: establishmentId },
    create: {
      id: establishmentId,
      slug: "studio-aurora",
      name: "Studio Aurora",
      segment: "Salão de beleza",
      ownerName: "Camila Duarte",
      email: "contato@studioaurora.com.br",
      phone: "5561977776600",
      whatsapp: "5561977776600",
      address: "Rua das Palmeiras, 240 — Jardim Botânico, Brasília/DF",
      description:
        "Beleza com cuidado: cortes, coloração e tratamentos em um espaço tranquilo.",
      brandColor: "#9A6B4F",
      timezone: tz,
      status: "ACTIVE",
      publicPageEnabled: true,
      autoConfirmBookings: true,
      minAdvanceMinutes: 120,
      maxAdvanceDays: 45,
      cancellationNoticeHours: 8,
      defaultServiceMin: 45,
      slotIntervalMinutes: 30,
      cancellationPolicy:
        "Cancelamentos online até 8 horas antes do horário. Depois disso, entre em contato pelo WhatsApp.",
    },
    update: {
      name: "Studio Aurora",
      status: "ACTIVE",
      publicPageEnabled: true,
      brandColor: "#9A6B4F",
      timezone: tz,
    },
  });

  await seedBrandingAndUnit({
    establishmentId,
    brandColor: "#9A6B4F",
    address: "Rua das Palmeiras, 240 — Jardim Botânico, Brasília/DF",
    phone: "5561977776600",
    timezone: tz,
  });

  await prisma.subscription.upsert({
    where: { establishmentId },
    create: {
      id: "sub-aurora",
      establishmentId,
      planId: "plan-essencial",
      status: "TRIALING",
      billingCycle: "MONTHLY",
      trialEndsAt: new Date(Date.now() + 7 * 86400000),
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 7 * 86400000),
      provider: "MANUAL",
    },
    update: {
      planId: "plan-essencial",
      status: "TRIALING",
      trialEndsAt: new Date(Date.now() + 7 * 86400000),
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 7 * 86400000),
    },
  });

  await seedUser({
    id: "user-aurora-owner",
    name: "Camila Duarte",
    email: "dono@studioaurora.com.br",
    password: OWNER_PASSWORD,
  });

  await prisma.membership.upsert({
    where: {
      userId_establishmentId: {
        userId: "user-aurora-owner",
        establishmentId,
      },
    },
    create: {
      id: "membership-aurora-owner",
      userId: "user-aurora-owner",
      establishmentId,
      role: "OWNER",
    },
    update: { role: "OWNER", professionalId: null },
  });

  await prisma.professional.upsert({
    where: { id: "aurora-prof-camila" },
    create: {
      id: "aurora-prof-camila",
      establishmentId,
      name: "Camila Duarte",
      bio: "Especialista em cortes e coloração.",
      specialties: "Corte, coloração, mechas",
      active: true,
      sortOrder: 1,
    },
    update: { name: "Camila Duarte", active: true },
  });

  await prisma.professional.upsert({
    where: { id: "aurora-prof-livia" },
    create: {
      id: "aurora-prof-livia",
      establishmentId,
      name: "Lívia Castro",
      bio: "Tratamentos, escova e maquiagem.",
      specialties: "Tratamento, escova, make",
      active: true,
      sortOrder: 2,
    },
    update: { name: "Lívia Castro", active: true },
  });

  const services = [
    {
      id: "aurora-svc-corte",
      name: "Corte feminino",
      category: "Cabelo",
      price: 120,
      durationMin: 50,
      bufferMin: 10,
      professionalIds: ["aurora-prof-camila"],
    },
    {
      id: "aurora-svc-coloracao",
      name: "Coloração",
      category: "Cabelo",
      price: 240,
      durationMin: 120,
      bufferMin: 15,
      professionalIds: ["aurora-prof-camila"],
    },
    {
      id: "aurora-svc-escova",
      name: "Escova e finalização",
      category: "Cabelo",
      price: 80,
      durationMin: 45,
      bufferMin: 10,
      professionalIds: ["aurora-prof-camila", "aurora-prof-livia"],
    },
    {
      id: "aurora-svc-tratamento",
      name: "Tratamento capilar",
      category: "Tratamento",
      price: 150,
      durationMin: 60,
      bufferMin: 10,
      professionalIds: ["aurora-prof-livia"],
    },
  ];

  for (const [index, service] of services.entries()) {
    await prisma.service.upsert({
      where: { id: service.id },
      create: {
        id: service.id,
        establishmentId,
        name: service.name,
        category: service.category,
        price: service.price,
        durationMin: service.durationMin,
        bufferMin: service.bufferMin,
        sortOrder: index + 1,
        active: true,
        onlineEnabled: true,
      },
      update: {
        name: service.name,
        price: service.price,
        durationMin: service.durationMin,
        bufferMin: service.bufferMin,
        active: true,
        onlineEnabled: true,
        deletedAt: null,
      },
    });
    for (const professionalId of service.professionalIds) {
      await prisma.professionalService.upsert({
        where: {
          professionalId_serviceId: { professionalId, serviceId: service.id },
        },
        create: { establishmentId, professionalId, serviceId: service.id },
        update: {},
      });
    }
  }

  const hours = businessHours(establishmentId, 540, 1140, 720, 780);
  for (const hour of hours) {
    await prisma.businessHours.upsert({
      where: {
        establishmentId_weekday: { establishmentId, weekday: hour.weekday },
      },
      create: hour,
      update: {
        isOpen: hour.isOpen,
        openMinute: hour.openMinute,
        closeMinute: hour.closeMinute,
        breakStartMinute: hour.breakStartMinute,
        breakEndMinute: hour.breakEndMinute,
      },
    });
  }

  for (const professionalId of ["aurora-prof-camila", "aurora-prof-livia"]) {
    const windows = availability(establishmentId, professionalId, [1, 2, 3, 4, 5], 540, 1140, 720, 780);
    for (const window of windows) {
      await prisma.professionalAvailability.upsert({
        where: {
          professionalId_weekday: { professionalId, weekday: window.weekday },
        },
        create: window,
        update: {
          isWorking: window.isWorking,
          startMinute: window.startMinute,
          endMinute: window.endMinute,
          breakStartMinute: window.breakStartMinute,
          breakEndMinute: window.breakEndMinute,
        },
      });
    }
  }

  const customer = await prisma.customer.upsert({
    where: { id: "aurora-customer-helena" },
    create: {
      id: "aurora-customer-helena",
      establishmentId,
      name: "Helena Ribeiro",
      phone: "5561988889900",
      email: "helena.ribeiro@example.com",
    },
    update: { name: "Helena Ribeiro", phone: "5561988889900" },
  });

  await seedAppointments(
    establishmentId,
    tz,
    { "aurora-svc-corte": 50 },
    [
      {
        id: "aurora-appt-1",
        code: "AGX-AUR001",
        dayOffset: 2,
        time: "10:00",
        professionalId: "aurora-prof-camila",
        serviceId: "aurora-svc-corte",
        customerId: customer.id,
        status: "CONFIRMED",
      },
    ],
  );

  await prisma.auditLog.create({
    data: {
      establishmentId,
      action: "seed.demo.created",
      entityType: "Establishment",
      entityId: establishmentId,
      metadata: { demo: true },
    },
  });
}

async function main() {
  const withExtraDemo = process.env.SEED_EXTRA_DEMO === "true";

  console.log("Semeando planos da plataforma...");
  await seedPlans();

  if (withExtraDemo) {
    console.log("Semeando dados opcionais de demonstração da plataforma...");
    await seedUser({
      id: "user-platform-admin",
      name: "Administrador da plataforma",
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      isPlatformAdmin: true,
    });
    await seedAurora();
  }

  console.log("Semeando Barbearia Nobre...");
  await seedNobre();

  console.log("\nSeed concluído.");
  console.log("Dono da Barbearia Nobre: dono@barbearianobre.com.br");
  console.log("Administrador da Nobre: admin@barbearianobre.com.br");
  console.log("Profissional da Nobre: bruno@barbearianobre.com.br");
  if (withExtraDemo) {
    console.log(`Admin opcional da plataforma: ${ADMIN_EMAIL}`);
    console.log("Dona do Studio Aurora (opcional): dono@studioaurora.com.br");
  }
  console.log("As senhas vêm de SEED_* ou dos padrões de demonstração documentados no README.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
