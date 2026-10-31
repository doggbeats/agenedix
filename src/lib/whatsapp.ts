import { formatDateTimeInZone, formatPhone } from "./format";

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

export function ownerCopyMessage(context: MessageContext): string {
  return [
    appointmentMessage(context),
    "",
    `Contato do cliente: ${formatPhone(context.customerPhone)}`,
  ].join("\n");
}
