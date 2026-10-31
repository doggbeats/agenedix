export const APP_NAME = "Agendix";
export const APP_TAGLINE = "Agendamento online para negócios que atendem com hora marcada";
export const COMPANY_NAME = "Agendix";
export const BRAND_COLOR = "#B08D68";

export const BRAND_PALETTE = {
  ink: "#0B0B0B",
  white: "#FFFFFF",
  primary: "#B08D68",
  secondary: "#C4A484",
  surface: "#F3F3F3",
} as const;

export const WEEKDAYS = [
  { value: 0, label: "Domingo", short: "Dom" },
  { value: 1, label: "Segunda-feira", short: "Seg" },
  { value: 2, label: "Terça-feira", short: "Ter" },
  { value: 3, label: "Quarta-feira", short: "Qua" },
  { value: 4, label: "Quinta-feira", short: "Qui" },
  { value: 5, label: "Sexta-feira", short: "Sex" },
  { value: 6, label: "Sábado", short: "Sáb" },
] as const;

export const SEGMENTS = [
  "Barbearia",
  "Salão de beleza",
  "Estética",
  "Manicure e pedicure",
  "Sobrancelhas e cílios",
  "Massoterapia",
  "Tatuagem",
  "Pet shop",
  "Consultoria",
  "Outros",
] as const;

export const STATUS_LABELS = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  NO_SHOW: "Não compareceu",
} as const;

export const STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  CONFIRMED: "bg-green-50 text-green-700 ring-green-200",
  COMPLETED: "bg-slate-100 text-slate-700 ring-slate-200",
  CANCELLED: "bg-red-50 text-red-700 ring-red-200",
  NO_SHOW: "bg-orange-50 text-orange-700 ring-orange-200",
} as const;

export const ORIGIN_LABELS = {
  ONLINE: "Página pública",
  PANEL: "Painel",
  WHATSAPP: "WhatsApp",
} as const;

export const ROLE_LABELS = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  PROFESSIONAL: "Profissional",
} as const;

export const ROLE_DESCRIPTIONS = {
  OWNER: "Acesso total, incluindo equipe, plano e faturamento.",
  ADMIN: "Gerencia agenda, serviços, profissionais e configurações.",
  PROFESSIONAL: "Vê apenas a própria agenda e seus atendimentos.",
} as const;

export const SUBSCRIPTION_LABELS = {
  TRIALING: "Em teste",
  ACTIVE: "Ativa",
  PENDING_PAYMENT: "Aguardando pagamento",
  PAST_DUE: "Pagamento atrasado",
  CANCELED: "Cancelada",
  SUSPENDED: "Suspensa",
} as const;

export const PAYMENT_STATUS_LABELS = {
  PENDING: "Pendente",
  PAID: "Pago",
  FAILED: "Falhou",
  REFUNDED: "Reembolsado",
} as const;

export const NOTIFICATION_STATUS_LABELS = {
  PENDING: "Pendente",
  SENT: "Enviada",
  FAILED: "Falhou",
  SKIPPED: "Ignorada",
} as const;

export const NOTIFICATION_TYPE_LABELS = {
  BOOKING_CREATED: "Agendamento criado",
  BOOKING_CONFIRMED: "Agendamento confirmado",
  BOOKING_CANCELLED: "Agendamento cancelado",
  BOOKING_RESCHEDULED: "Agendamento reagendado",
  BOOKING_REMINDER: "Lembrete de agendamento",
  PAYMENT: "Pagamento",
  SYSTEM: "Sistema",
} as const;

export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "agendar",
  "login",
  "cadastro",
  "painel",
  "privacidade",
  "termos",
  "confirmacao",
  "recuperar-senha",
  "redefinir-senha",
  "verificar-email",
  "app",
  "www",
  "suporte",
  "agendix",
  "plataforma",
  "code-ph",
]);

export const MAX_IMAGE_URL_LENGTH = 500;
export const MAX_NOTES_LENGTH = 500;
