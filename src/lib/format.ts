import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";

export function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrency(value: unknown): string {
  return toNumber(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Normaliza para E.164 brasileiro sem "+".
 * Aceita telefone local com 10/11 dígitos e números já internacionais.
 */
export function normalizePhone(value: string): string {
  const digits = onlyDigits(value);
  if (digits.length === 0) return "";
  if (digits.startsWith("55") && digits.length >= 12) return digits.slice(0, 13);
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export function isValidPhone(value: string): boolean {
  const phone = normalizePhone(value);
  return phone.length >= 12 && phone.length <= 15;
}

export function formatPhone(value: string): string {
  const digits = onlyDigits(value);
  const local =
    digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
      ? digits.slice(2)
      : digits;

  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return value;
}

export function whatsappNumber(value: string): string {
  return normalizePhone(value);
}

export function maskPhoneInput(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function minutesToTime(minutes: number): string {
  const safe = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return hours * 60 + minutes;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}min`;
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatDateTimeInZone(
  date: Date | string,
  timezone: string,
  pattern = "dd/MM/yyyy 'às' HH:mm",
): string {
  return formatInTimeZone(new Date(date), timezone, pattern, { locale: ptBR });
}

export function formatDateInZone(
  date: Date | string,
  timezone: string,
  pattern = "dd/MM/yyyy",
): string {
  return formatInTimeZone(new Date(date), timezone, pattern, { locale: ptBR });
}

export function formatLongDateInZone(
  date: Date | string,
  timezone: string,
): string {
  return formatInTimeZone(
    new Date(date),
    timezone,
    "EEEE, dd 'de' MMMM 'de' yyyy",
    { locale: ptBR },
  );
}

export function relativeFromNow(date: Date | string, now = new Date()): string {
  const diffMs = new Date(date).getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (Math.abs(diffMin) < 60) {
    return diffMin >= 0 ? `em ${diffMin} min` : `há ${Math.abs(diffMin)} min`;
  }
  const diffHours = Math.round(diffMin / 60);
  if (Math.abs(diffHours) < 24) {
    return diffHours >= 0 ? `em ${diffHours}h` : `há ${Math.abs(diffHours)}h`;
  }
  const diffDays = Math.round(diffHours / 24);
  return diffDays >= 0 ? `em ${diffDays} dia(s)` : `há ${Math.abs(diffDays)} dia(s)`;
}

export function truncate(value: string, length = 80): string {
  if (value.length <= length) return value;
  return `${value.slice(0, length - 1)}…`;
}
