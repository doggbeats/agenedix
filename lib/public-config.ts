export const SUPPORT_WHATSAPP = (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "").replace(
  /\D/g,
  "",
);

export function supportWhatsAppUrl(
  message = "Olá! Preciso de ajuda com o Agendix.",
): string | null {
  if (!SUPPORT_WHATSAPP) return null;
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`;
}
