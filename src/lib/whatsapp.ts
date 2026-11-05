import { formatCurrency, formatDateTimeInZone, formatPhone } from "./format";

export function buildWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

interface MessageContext {
  greetingName?: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  serviceDuration: number;
  servicePrice: unknown;
  professionalName: string;
  startAt: Date;
  endAt: Date;
  timezone: string;
  protocol: string;
  establishmentName: string;
  address?: string | null;
  policy?: string | null;
}


export function renderTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

/**
 * Renderiza um modelo e remove linhas cujo valor ficou vazio (ex.: "Endereço: "),
 * para o texto não sair com campos em branco.
 */
export function renderMessage(template: string, values: Record<string, string>): string {
  return renderTemplate(template, values)
    .split("\n")
    .filter((line) => !/^[^:\n]+:\s*$/.test(line))
    .join("\n")
    .trim();
}

export const DEFAULT_WHATSAPP_MESSAGE = [
  "Olá! Tudo bem? 😊",
  "",
  "Gostaria de falar sobre meu agendamento na *{estabelecimento}*.",
  "",
  "📋 *Código:* {protocolo}",
  "",
  "👤 *Cliente:* {cliente}",
  "",
  "💆 *Serviço:* {servico}",
  "⏱️ *Duração:* {duracao} minutos",
  "💰 *Valor:* {valor}",
  "",
  "📅 *Data:* {data}",
  "🕘 *Horário:* {hora} às {hora_fim}",
  "",
  "👩 *Profissional:* {profissional}",
  "📍 *Local:* {endereco}",
].join("\n");

export function appointmentMessage(context: MessageContext): string {
  const date = formatDateTimeInZone(context.startAt, context.timezone);
  const values: Record<string, string> = {
    cliente: context.customerName,
    primeiro_nome: context.greetingName ?? context.customerName.split(" ")[0],
    servico: context.serviceName,
    duracao: String(context.serviceDuration),
    valor: formatCurrency(context.servicePrice),
    profissional: context.professionalName,
    data: date,
    hora: formatDateTimeInZone(context.startAt, context.timezone, "HH:mm"),
    hora_fim: formatDateTimeInZone(context.endAt, context.timezone, "HH:mm"),
    protocolo: context.protocol,
    estabelecimento: context.establishmentName,
    endereco: context.address ?? "",
    politica: context.policy ?? "",
  };

  return renderMessage(DEFAULT_WHATSAPP_MESSAGE, values);
}

export const DEFAULT_CUSTOMER_CONTACT_MESSAGE = [
  "Olá! Tudo bem? 😊",
  "",
  "Gostaria de falar sobre meu agendamento na *{estabelecimento}*.",
  "",
  "Poderia me ajudar com algumas informações, por favor?",
  "",
  "Obrigado(a)!",
].join("\n");

export const DEFAULT_CUSTOMER_INQUIRY_MESSAGE = [
  "Olá! Tudo bem? 😊",
  "",
  "Vim pela página de agendamento da *{estabelecimento}* e gostaria de mais informações.",
].join("\n");

export function customerContactMessage(
  establishmentName: string,
  protocol?: string,
  customTemplate?: string | null,
): string {
  const template =
    (protocol ? customTemplate?.trim() : "") ||
    (protocol ? DEFAULT_CUSTOMER_CONTACT_MESSAGE : DEFAULT_CUSTOMER_INQUIRY_MESSAGE);

  return renderMessage(template, {
    estabelecimento: establishmentName,
    protocolo: protocol ?? "",
  });
}

export type PaymentPreference = "card" | "pix" | "undecided";

export interface SubscriptionRequestContext {
  establishmentName: string;
  responsibleName: string;
  responsibleEmail: string;
  planName: string;
  monthlyPrice: number;
  trialDays: number;
  paymentPreference: PaymentPreference;
  checkoutUrl?: string | null;
  now?: Date;
}

function paymentPreferenceLabel(
  preference: PaymentPreference,
  trialDays: number,
): string {
  if (preference === "card") {
    return `Cartão de crédito (${trialDays} dias de teste, primeira cobrança no ${trialDays + 1}º dia)`;
  }
  if (preference === "pix") {
    return "Pix (pagamento único do primeiro período)";
  }
  return "A combinar com o suporte";
}

/**
 * Resumo enviado pelo checkout para o WhatsApp de suporte. O cliente abre o
 * link com a mensagem pronta e ainda precisa confirmar o envio no WhatsApp.
 */
export function subscriptionRequestMessage(
  context: SubscriptionRequestContext,
): string {
  const date = (context.now ?? new Date()).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return [
    "*Solicitação de assinatura — AgendamentoON*",
    "",
    `Estabelecimento: ${context.establishmentName}`,
    `Responsável: ${context.responsibleName}`,
    `E-mail: ${context.responsibleEmail}`,
    `Plano: ${context.planName}`,
    `Valor: ${formatCurrency(context.monthlyPrice)}/mês`,
    `Forma de pagamento: ${paymentPreferenceLabel(
      context.paymentPreference,
      context.trialDays,
    )}`,
    `Solicitação gerada em: ${date}`,
    context.checkoutUrl ? `Checkout: ${context.checkoutUrl}` : "",
    "",
    "Quero concluir a contratação. Pode me enviar as instruções de pagamento?",
  ]
    .filter(Boolean)
    .join("\n");
}

export function ownerCopyMessage(context: MessageContext): string {
  return [
    appointmentMessage(context),
    "",
    `Contato do cliente: ${formatPhone(context.customerPhone)}`,
  ].join("\n");
}
