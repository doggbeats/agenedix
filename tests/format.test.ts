import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatDuration,
  formatPhone,
  initials,
  isValidPhone,
  maskPhoneInput,
  normalizePhone,
  relativeFromNow,
  timeToMinutes,
  truncate,
} from "@/lib/format";

describe("format", () => {
  it("formata moeda brasileira", () => {
    expect(formatCurrency(89.9)).toContain("89,90");
    expect(formatCurrency("1490")).toContain("1.490,00");
    expect(formatCurrency(null)).toContain("0,00");
  });

  it("normaliza telefone brasileiro", () => {
    expect(normalizePhone("(61) 98888-7777")).toBe("5561988887777");
    expect(normalizePhone("5561988887777")).toBe("5561988887777");
    expect(normalizePhone("6133334444")).toBe("556133334444");
    expect(isValidPhone("(61) 98888-7777")).toBe(true);
    expect(isValidPhone("1234")).toBe(false);
  });

  it("formata e mascara telefone", () => {
    expect(formatPhone("5561988887777")).toBe("(61) 98888-7777");
    expect(formatPhone("556133334444")).toBe("(61) 3333-4444");
    expect(maskPhoneInput("61988887777")).toBe("(61) 98888-7777");
    expect(maskPhoneInput("6133334444")).toBe("(61) 3333-4444");
    expect(maskPhoneInput("61")).toBe("61");
  });

  it("converte duração e horários", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(90)).toBe("1h 30min");
    expect(timeToMinutes("18:30")).toBe(1110);
    expect(timeToMinutes("inválido")).toBe(0);
  });

  it("gera iniciais e trunca textos", () => {
    expect(initials("Ana Paula Souza")).toBe("AP");
    expect(initials("  ")).toBe("");
    expect(truncate("Agendix", 4)).toBe("Age…");
    expect(truncate("Agendix", 20)).toBe("Agendix");
  });

  it("descreve tempo relativo", () => {
    const now = new Date("2026-10-28T12:00:00.000Z");
    expect(relativeFromNow(new Date("2026-10-28T12:30:00.000Z"), now)).toBe("em 30 min");
    expect(relativeFromNow(new Date("2026-10-28T10:00:00.000Z"), now)).toBe("há 2h");
    expect(relativeFromNow(new Date("2026-10-30T12:00:00.000Z"), now)).toBe("em 2 dia(s)");
  });
});
