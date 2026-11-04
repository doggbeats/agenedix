import { z } from "zod";
import { isValidPhone } from "./format";
import { isValidDateString, isValidTimeString } from "./timezone";

const time = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe um horário válido (HH:MM).");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres.`)
    .optional()
    .transform((value) => (value === "" ? undefined : value));

const phone = z
  .string()
  .trim()
  .min(10, "Informe um telefone com DDD.")
  .refine(isValidPhone, "Informe um telefone válido com DDD.");

const email = z.string().trim().toLowerCase().email("Informe um e-mail válido.");
const optionalEmail = z
  .union([z.literal(""), email])
  .optional()
  .transform((value) => (value ? value : undefined));

const dataImage = /^data:image\/(?:png|jpe?g|webp);base64,/i;

// Imagens enviadas por anexo (data URL) ou URLs/caminhos antigos.
const uploadedImage = z
  .union([
    z.literal(""),
    z
      .string()
      .trim()
      .max(2_500_000, "A imagem é muito grande. Envie um arquivo menor.")
      .refine(
        (value) =>
          /^https?:\/\//i.test(value) ||
          value.startsWith("/") ||
          dataImage.test(value),
        "Envie uma imagem PNG, JPG ou WebP.",
      ),
  ])
  .optional()
  .transform((value) => (value === "" ? undefined : value));

const galleryText = z
  .string()
  .trim()
  .max(6_000_000, "A galeria é muito grande. Envie menos imagens.")
  .optional()
  .transform((value) => (value === "" ? undefined : value));

export const loginSchema = z.object({
  email: email,
  password: z.string().min(1, "Informe sua senha."),
});

export const signupSchema = z
  .object({
    businessName: z.string().trim().min(2, "Informe o nome do estabelecimento.").max(120),
    planSlug: z.string().trim().min(1, "Escolha um plano para continuar."),
    segment: z.string().trim().min(2, "Informe o segmento."),
    ownerName: z.string().trim().min(2, "Informe o nome do responsável.").max(120),
    email: email,
    phone: phone,
    whatsapp: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value === "" ? undefined : value))
      .refine((value) => value === undefined || isValidPhone(value), "WhatsApp inválido."),
    address: optionalText(200),
    timezone: z.string().trim().min(3, "Informe o fuso horário.").default("America/Sao_Paulo"),
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres.")
      .regex(/[A-Za-z]/, "A senha deve conter letras.")
      .regex(/[0-9]/, "A senha deve conter números."),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine(Boolean, "Aceite os termos para continuar."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem.",
  });

export const establishmentSettingsSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do estabelecimento.").max(120),
  slug: z.string().trim().min(3, "Informe o endereço público.").max(60),
  segment: z.string().trim().min(2),
  ownerName: z.string().trim().min(2, "Informe o responsável.").max(120),
  phone: phone,
  whatsapp: phone,
  email: email,
  address: optionalText(200),
  description: optionalText(500),
  logoUrl: uploadedImage,
  brandColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use uma cor hexadecimal, como #9A6B4F."),
  timezone: z.string().trim().min(3, "Informe o fuso horário."),
  autoConfirmBookings: z.boolean().default(false),
  publicPageEnabled: z.boolean().default(true),
  minAdvanceMinutes: z.coerce
    .number()
    .int()
    .min(0, "Antecedência mínima inválida.")
    .max(60 * 24 * 30, "Antecedência máxima de 30 dias."),
  maxAdvanceDays: z.coerce
    .number()
    .int()
    .min(1, "Use pelo menos 1 dia.")
    .max(365, "Use no máximo 365 dias."),
  cancellationNoticeHours: z.coerce
    .number()
    .int()
    .min(0, "Tempo mínimo inválido.")
    .max(720, "Use no máximo 720 horas."),
  defaultServiceMin: z.coerce
    .number()
    .int()
    .min(5, "Duração mínima de 5 minutos.")
    .max(480, "Duração máxima de 8 horas."),
  slotIntervalMinutes: z.coerce
    .number()
    .int()
    .refine((value) => [5, 10, 15, 20, 30, 60].includes(value), "Intervalo inválido."),
  cancellationPolicy: optionalText(1000),
  whatsappMessage: optionalText(1000),
});

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do serviço.").max(120),
  description: optionalText(500),
  category: optionalText(80),
  price: z.coerce
    .number()
    .min(0, "O preço não pode ser negativo.")
    .max(1_000_000, "Preço inválido."),
  durationMin: z.coerce
    .number()
    .int()
    .min(5, "Duração mínima de 5 minutos.")
    .max(720, "Duração máxima de 12 horas."),
  bufferMin: z.coerce
    .number()
    .int()
    .min(0, "Intervalo inválido.")
    .max(240, "Intervalo máximo de 4 horas."),
  imageUrl: uploadedImage,
  onlineEnabled: z.boolean().default(true),
  active: z.boolean().default(true),
  professionalIds: z.array(z.string()).default([]),
});

export const professionalSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do profissional.").max(120),
  bio: optionalText(500),
  photoUrl: uploadedImage,
  specialties: optionalText(200),
  active: z.boolean().default(true),
  serviceIds: z.array(z.string()).default([]),
  workdays: z.array(z.coerce.number().int().min(0).max(6)).default([]),
  startTime: time,
  endTime: time,
  breakStart: z.string().optional().transform((value) => value || undefined),
  breakEnd: z.string().optional().transform((value) => value || undefined),
});

export const businessHoursSchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  isOpen: z.boolean(),
  openTime: time,
  closeTime: time,
  breakStart: z.string().optional().transform((value) => value || undefined),
  breakEnd: z.string().optional().transform((value) => value || undefined),
});

export const timeBlockSchema = z
  .object({
    professionalId: z
      .string()
      .optional()
      .transform((value) => (value && value !== "all" ? value : undefined)),
    date: z.string().refine(isValidDateString, "Informe uma data válida."),
    startTime: time,
    endTime: time,
    reason: optionalText(200),
  })
  .refine((data) => data.endTime > data.startTime, {
    path: ["endTime"],
    message: "O fim deve ser depois do início.",
  });

export const bookingSchema = z.object({
  serviceId: z.string().min(1, "Escolha um serviço."),
  professionalId: z.string().min(1, "Escolha um profissional."),
  date: z.string().refine(isValidDateString, "Escolha uma data válida."),
  time: z.string().refine(isValidTimeString, "Escolha um horário válido."),
  name: z.string().trim().min(2, "Informe seu nome completo.").max(120),
  phone: phone,
  email: optionalEmail,
  notes: optionalText(500),
  consent: z.boolean().refine(Boolean, "É necessário aceitar a política de privacidade."),
  website: z.string().max(0, "Não foi possível concluir.").optional(),
});

export const ownerAppointmentSchema = z.object({
  customerName: z.string().trim().min(2, "Informe o cliente.").max(120),
  customerPhone: phone,
  serviceId: z.string().min(1, "Escolha um serviço."),
  professionalId: z.string().min(1, "Escolha um profissional."),
  date: z.string().refine(isValidDateString, "Data inválida."),
  time: z.string().refine(isValidTimeString, "Horário inválido."),
  notes: optionalText(500),
});

export const rescheduleSchema = z.object({
  appointmentId: z.string().min(1),
  professionalId: z.string().min(1, "Escolha um profissional."),
  date: z.string().refine(isValidDateString, "Data inválida."),
  time: z.string().refine(isValidTimeString, "Horário inválido."),
});

export const cancelAppointmentSchema = z.object({
  appointmentId: z.string().min(1),
  reason: optionalText(300),
  token: z.string().optional(),
});

export const publicCancelSchema = z.object({
  protocol: z.string().trim().min(4),
  token: z.string().trim().min(20),
  reason: optionalText(300),
});

export const planSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do plano.").max(80),
  slug: z.string().trim().min(2, "Informe o identificador.").max(40),
  description: optionalText(300),
  priceMonthly: z.coerce.number().min(0, "Preço inválido."),
  priceYearly: z.coerce.number().min(0, "Preço inválido."),
  maxProfessionals: z.coerce.number().int().min(1).max(500),
  maxServices: z.coerce.number().int().min(1).max(1000),
  maxUnits: z.coerce.number().int().min(1).max(50).default(1),
  maxUsers: z.coerce.number().int().min(1).max(500).default(2),
  maxAppointmentsMonth: z
    .union([z.literal(""), z.coerce.number().int().min(1).max(100000)])
    .optional()
    .transform((value) => (value === "" || value === undefined ? undefined : Number(value))),
  trialDays: z.coerce.number().int().min(0).max(90),
  features: optionalText(1000),
  active: z.boolean().default(true),
  isDemo: z.boolean().default(false),
  highlight: z.boolean().default(false),
});

const color = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use uma cor hexadecimal, como #B08D68.");

const socialUrl = z
  .union([
    z.literal(""),
    z
      .string()
      .trim()
      .max(300, "URL muito longa.")
      .refine((value) => /^https?:\/\//i.test(value), "Use uma URL começando por http(s)."),
  ])
  .optional()
  .transform((value) => (value === "" ? undefined : value));

export const brandingSchema = z.object({
  primaryColor: color,
  secondaryColor: color,
  backgroundColor: color,
  menuColor: color,
  textColor: color,
  buttonColor: color,
  fontFamily: z.enum(["sans", "serif", "poppins", "montserrat", "lora", "playfair", "inter"]).default("sans"),
  buttonStyle: z.enum(["rounded", "pill", "square"]).default("rounded"),
  coverUrl: uploadedImage,
  galleryText: galleryText,
  instagram: socialUrl,
  facebook: socialUrl,
  website: socialUrl,
  tagline: optionalText(160),
  showTeam: z.boolean().default(true),
  showServices: z.boolean().default(true),
  showGallery: z.boolean().default(true),
  showHours: z.boolean().default(true),
  showAddress: z.boolean().default(true),
});

export const teamMemberSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(120),
  email: email,
  password: z
    .string()
    .min(8, "A senha temporária deve ter pelo menos 8 caracteres.")
    .regex(/[A-Za-z]/, "A senha deve conter letras.")
    .regex(/[0-9]/, "A senha deve conter números."),
  role: z.enum(["ADMIN", "PROFESSIONAL"]),
  professionalId: z
    .string()
    .optional()
    .transform((value) => (value && value !== "none" ? value : undefined)),
});

export const scheduleExceptionSchema = z
  .object({
    professionalId: z
      .string()
      .optional()
      .transform((value) => (value && value !== "all" ? value : undefined)),
    date: z.string().refine(isValidDateString, "Informe uma data válida."),
    isClosed: z.boolean().default(true),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
    reason: optionalText(200),
  })
  .superRefine((data, ctx) => {
    if (data.isClosed) return;
    if (!data.openTime || !data.closeTime) {
      ctx.addIssue({
        code: "custom",
        path: ["openTime"],
        message: "Informe a abertura e o fechamento do horário especial.",
      });
      return;
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(data.openTime)) {
      ctx.addIssue({ code: "custom", path: ["openTime"], message: "Horário inválido." });
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(data.closeTime)) {
      ctx.addIssue({ code: "custom", path: ["closeTime"], message: "Horário inválido." });
    }
    if (data.closeTime <= data.openTime) {
      ctx.addIssue({
        code: "custom",
        path: ["closeTime"],
        message: "O fechamento deve ser depois da abertura.",
      });
    }
  });

export const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().default(false),
  notifyBookingCreated: z.boolean().default(false),
  notifyBookingCancelled: z.boolean().default(false),
  notifyBookingRescheduled: z.boolean().default(false),
  reminderHours: z.coerce
    .number()
    .int()
    .min(1, "Use pelo menos 1 hora.")
    .max(168, "Use no máximo 168 horas."),
});

export const manualPaymentSchema = z.object({
  establishmentId: z.string().min(1),
  amount: z.coerce.number().min(0.01, "Informe um valor.").max(1_000_000),
  method: optionalText(40),
  paidAt: z
    .string()
    .optional()
    .transform((value) => (value && isValidDateString(value) ? value : undefined)),
  notes: optionalText(300),
  extendDays: z.coerce.number().int().min(0).max(400).default(30),
  activate: z.boolean().default(true),
});

export const passwordRecoverySchema = z.object({
  email: email,
});

export const passwordResetSchema = z
  .object({
    token: z.string().trim().min(20, "Token inválido."),
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres.")
      .regex(/[A-Za-z]/, "A senha deve conter letras.")
      .regex(/[0-9]/, "A senha deve conter números."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem.",
  });

export const customerAnonymizeSchema = z.object({
  customerId: z.string().min(1),
  confirmation: z.literal("EXCLUIR", {
    message: "Digite EXCLUIR para confirmar.",
  }),
});

const taxDocument = z
  .string()
  .trim()
  .transform((value) => value.replace(/\D/g, ""))
  .refine(
    (value) => value.length === 11 || value.length === 14,
    "Informe um CPF ou CNPJ válido.",
  );

const postalCode = z
  .string()
  .trim()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((value) => value.length === 8, "Informe um CEP com 8 dígitos.");

const billingFields = {
  document: taxDocument,
  zipCode: postalCode,
  addressNumber: z
    .string()
    .trim()
    .min(1, "Informe o número do endereço.")
    .max(20, "Número muito longo."),
  city: z.string().trim().min(2, "Informe a cidade.").max(80),
  state: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .refine((value) => /^[A-Z]{2}$/.test(value), "Use a sigla do estado (ex.: SP)."),
};

export const checkoutSchema = z.object({
  planSlug: z.string().trim().min(1, "Escolha um plano."),
  cycle: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
  ...billingFields,
});

export const cardCheckoutSchema = checkoutSchema.extend({
  cardToken: z.string().trim().min(5, "Token do cartão ausente. Tente novamente."),
});

export const pixCheckoutSchema = checkoutSchema;

export const planChangeSchema = z.object({
  planSlug: z.string().trim().min(1, "Escolha um plano."),
  cycle: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export type BookingInput = z.infer<typeof bookingSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
