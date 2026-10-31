export function getAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function publicBookingPath(slug: string): string {
  return `/agendar/${slug}`;
}

export function publicBookingUrl(slug: string): string {
  return `${getAppUrl()}/agendar/${slug}`;
}

export function confirmationUrl(
  slug: string,
  protocol: string,
  token: string,
): string {
  const params = new URLSearchParams({ protocolo: protocol, token });
  return `${getAppUrl()}/agendar/${slug}/confirmacao?${params.toString()}`;
}

export function panelAppointmentUrl(slug: string, protocol: string, token: string): string {
  return confirmationUrl(slug, protocol, token);
}
