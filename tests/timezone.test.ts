import { describe, expect, it } from "vitest";
import {
  addDaysToDate,
  getWeekday,
  isValidDateString,
  isValidTimeString,
  todayInZone,
  zonedMinutesToUtc,
  zonedTimeToUtc,
} from "@/lib/timezone";

describe("timezone", () => {
  it("converte minutos locais para UTC", () => {
    expect(zonedMinutesToUtc("2026-10-28", 540, "America/Sao_Paulo").toISOString()).toBe(
      "2026-10-28T12:00:00.000Z",
    );
    expect(zonedMinutesToUtc("2026-10-28", 0, "America/Sao_Paulo").toISOString()).toBe(
      "2026-10-28T03:00:00.000Z",
    );
  });

  it("converte horário local para UTC", () => {
    expect(zonedTimeToUtc("2026-10-28", "18:30", "America/Sao_Paulo").toISOString()).toBe(
      "2026-10-28T21:30:00.000Z",
    );
  });

  it("calcula o dia atual no fuso do estabelecimento", () => {
    expect(todayInZone("America/Sao_Paulo", new Date("2026-10-28T02:00:00.000Z"))).toBe(
      "2026-10-27",
    );
    expect(todayInZone("America/Sao_Paulo", new Date("2026-10-28T12:00:00.000Z"))).toBe(
      "2026-10-28",
    );
  });

  it("soma dias atravessando mês e ano", () => {
    expect(addDaysToDate("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysToDate("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDaysToDate("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("identifica o dia da semana sem sofrer com fuso", () => {
    expect(getWeekday("2026-10-28")).toBe(3);
    expect(getWeekday("2026-10-25")).toBe(0);
  });

  it("valida datas e horários", () => {
    expect(isValidDateString("2026-10-28")).toBe(true);
    expect(isValidDateString("2026-02-30")).toBe(false);
    expect(isValidDateString("28/10/2026")).toBe(false);
    expect(isValidTimeString("09:30")).toBe(true);
    expect(isValidTimeString("24:00")).toBe(false);
    expect(isValidTimeString("9:30")).toBe(false);
  });
});
