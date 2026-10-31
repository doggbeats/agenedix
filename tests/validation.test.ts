import { describe, expect, it } from "vitest";
import {
  bookingSchema,
  brandingSchema,
  businessHoursSchema,
  establishmentSettingsSchema,
  loginSchema,
  planSchema,
  serviceSchema,
  signupSchema,
  timeBlockSchema,
} from "@/lib/validation";
import { normalizeGallery, safeImageUrl } from "@/lib/branding";

const validBooking = {
  serviceId: "svc-1",
  professionalId: "pro-1",
  date: "2026-10-28",
  time: "10:00",
  name: "Ana Paula Souza",
  phone: "(61) 98888-7777",
  email: "ana@example.com",
  notes: "",
  consent: true,
};

describe("validation", () => {
  it("aceita login válido e normaliza e-mail", () => {
    const parsed = loginSchema.parse({ email: "  ANA@EXAMPLE.COM ", password: "x" });
    expect(parsed.email).toBe("ana@example.com");
  });

  it("rejeita login sem senha", () => {
    expect(loginSchema.safeParse({ email: "ana@example.com", password: "" }).success).toBe(
      false,
    );
  });

  it("exige consentimento no agendamento público", () => {
    expect(bookingSchema.safeParse(validBooking).success).toBe(true);
    expect(bookingSchema.safeParse({ ...validBooking, consent: false }).success).toBe(false);
  });

  it("rejeita telefone e data inválidos no agendamento", () => {
    expect(bookingSchema.safeParse({ ...validBooking, phone: "1234" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...validBooking, date: "2026-02-30" }).success).toBe(
      false,
    );
    expect(bookingSchema.safeParse({ ...validBooking, time: "25:00" }).success).toBe(false);
  });

  it("valida cadastro e confirmação de senha", () => {
    const base = {
      businessName: "Barbearia Teste",
      planSlug: "essencial",
      segment: "Barbearia",
      ownerName: "Ana Souza",
      email: "ana@example.com",
      phone: "(61) 98888-7777",
      whatsapp: "",
      address: "",
      timezone: "America/Sao_Paulo",
      password: "Senha1234",
      confirmPassword: "Senha1234",
      acceptTerms: true,
    };
    expect(signupSchema.safeParse(base).success).toBe(true);
    expect(
      signupSchema.safeParse({ ...base, confirmPassword: "outra" }).success,
    ).toBe(false);
    expect(signupSchema.safeParse({ ...base, acceptTerms: false }).success).toBe(false);
  });

  it("valida serviço com coerção numérica", () => {
    const parsed = serviceSchema.parse({
      name: "Corte",
      description: "",
      category: "",
      price: "89.90",
      durationMin: "45",
      bufferMin: "0",
      imageUrl: "",
      onlineEnabled: true,
      active: true,
      professionalIds: ["pro-1"],
    });
    expect(parsed.price).toBe(89.9);
    expect(parsed.durationMin).toBe(45);
    expect(parsed.professionalIds).toEqual(["pro-1"]);
  });

  it("exige fim depois do início em bloqueio de horário", () => {
    expect(
      timeBlockSchema.safeParse({
        date: "2026-10-28",
        startTime: "12:00",
        endTime: "13:00",
        reason: "Almoço",
      }).success,
    ).toBe(true);
    expect(
      timeBlockSchema.safeParse({
        date: "2026-10-28",
        startTime: "13:00",
        endTime: "12:00",
      }).success,
    ).toBe(false);
  });

  it("valida horário comercial e plano", () => {
    expect(
      businessHoursSchema.safeParse({
        weekday: 3,
        isOpen: true,
        openTime: "09:00",
        closeTime: "18:00",
      }).success,
    ).toBe(true);
    expect(
      planSchema.safeParse({
        name: "Essencial",
        slug: "essencial",
        description: "",
        priceMonthly: "89.90",
        priceYearly: "1068",
        maxProfessionals: "2",
        maxServices: "10",
        maxAppointmentsMonth: "",
        trialDays: "14",
        features: "",
        active: true,
        isDemo: false,
      }).success,
    ).toBe(true);
  });

  it("aceita a logo enviada como anexo e rejeita fontes inválidas", () => {
    const base = {
      name: "Studio Aurora",
      slug: "studio-aurora",
      segment: "Barbearia",
      ownerName: "Ana Souza",
      phone: "(61) 98888-7777",
      whatsapp: "(61) 98888-7777",
      email: "ana@example.com",
      address: "",
      description: "",
      brandColor: "#9A6B4F",
      timezone: "America/Sao_Paulo",
      autoConfirmBookings: false,
      publicPageEnabled: true,
      minAdvanceMinutes: "60",
      maxAdvanceDays: "60",
      cancellationNoticeHours: "4",
      defaultServiceMin: "30",
      slotIntervalMinutes: "15",
      cancellationPolicy: "",
      whatsappMessage: "",
    };
    expect(
      establishmentSettingsSchema.safeParse({
        ...base,
        logoUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
      }).success,
    ).toBe(true);
    expect(
      establishmentSettingsSchema.safeParse({ ...base, logoUrl: "" }).success,
    ).toBe(true);
    expect(
      establishmentSettingsSchema.safeParse({
        ...base,
        logoUrl: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });

  it("aceita capa e galeria enviadas como anexo", () => {
    const parsed = brandingSchema.parse({
      primaryColor: "#9A6B4F",
      secondaryColor: "#111111",
      backgroundColor: "#ffffff",
      textColor: "#111111",
      buttonColor: "#111111",
      fontFamily: "sans",
      buttonStyle: "rounded",
      coverUrl: "data:image/webp;base64,AAAA",
      galleryText: "data:image/png;base64,AAAA\nhttps://example.com/foto.jpg",
      instagram: "",
      facebook: "",
      website: "",
      tagline: "",
      showTeam: true,
      showServices: true,
      showGallery: true,
      showHours: true,
      showAddress: true,
    });

    expect(parsed.coverUrl).toBe("data:image/webp;base64,AAAA");
    expect(normalizeGallery(parsed.galleryText?.split("\n"))).toHaveLength(2);
    expect(safeImageUrl("javascript:alert(1)")).toBeNull();
  });
});
