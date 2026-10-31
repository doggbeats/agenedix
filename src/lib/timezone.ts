import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export function getWeekday(date: string): number {
  return new Date(`${date}T12:00:00.000Z`).getUTCDay();
}

export function todayInZone(timezone: string, now = new Date()): string {
  return formatInTimeZone(now, timezone, "yyyy-MM-dd");
}

export function addDaysToDate(date: string, days: number): string {
  const base = new Date(`${date}T12:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

export function zonedMinutesToUtc(
  date: string,
  minutes: number,
  timezone: string,
): Date {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const local = `${date}T${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`;
  return fromZonedTime(local, timezone);
}

export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function isValidTimeString(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function zonedTimeToUtc(
  date: string,
  time: string,
  timezone: string,
): Date {
  return fromZonedTime(`${date}T${time}:00`, timezone);
}

export function dateRangeInZone(
  startDate: string,
  endDate: string,
  timezone: string,
): { start: Date; end: Date } {
  const start = fromZonedTime(`${startDate}T00:00:00`, timezone);
  const end = fromZonedTime(`${addDaysToDate(endDate, 1)}T00:00:00`, timezone);
  return { start, end };
}

export function startOfDayInZone(date: string, timezone: string): Date {
  return fromZonedTime(`${date}T00:00:00`, timezone);
}

export function endOfDayInZone(date: string, timezone: string): Date {
  return fromZonedTime(`${addDaysToDate(date, 1)}T00:00:00`, timezone);
}

export function weekDays(date: string): string[] {
  const weekday = getWeekday(date);
  const start = addDaysToDate(date, -weekday);
  return Array.from({ length: 7 }, (_, index) => addDaysToDate(start, index));
}

export function diffMinutes(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}
