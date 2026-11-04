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
  professionalName: string;
  startAt: Date;
  timezone: string;
  protocol: string;
  establishmentName: string;
  address?: string | null;
  policy?: string | null;
  customTemplate?: string | null;
}

export function renderTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

export function appointmentMessage(context: MessageContext): string {
  const date = formatDateTimeInZone(context.startAt, context.timezone);
  const values: Record<string, string> = {
    cliente: context.customerName,
    primeiro_nome: context.greetingName ?? context.customerName.split(" ")[0],
    servico: context.serviceName,
    profissional: context.professionalName,
    data: date,
    hora: formatDateTimeInZone(context.startAt, context.timezone, "HH:mm"),
    protocolo: context.protocol,
    estabelecimento: context.establishmentName,
    endereco: context.address ?? "",
    politica: context.policy ?? "",
  };

  if (context.customTemplate?.trim()) {
    return renderTemplate(context.customTemplate.trim(), values);
  }

  return [
    `Olá, ${values.primeiro_nome}!`,
    "",
    `Seu agendamento na ${context.establishmentName} está registrado.`,
    `Serviço: ${context.serviceName}`,
    `Profissional: ${context.professionalName}`,
    `Data: ${date}`,
    `Protocolo: ${context.protocol}`,
    context.address ? `Endereço: ${context.address}` : "",
    "",
    "Se precisar remarcar, fale com a gente por este WhatsApp.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function customerContactMessage(
  establishmentName: string,
  protocol?: string,
): string {
  return protocol
    ? `Olá! Gostaria de falar sobre o agendamento ${protocol} na ${establishmentName}.`
    : `Olá! Vim pela página de agendamento da ${establishmentName} e gostaria de mais informações.`;
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
