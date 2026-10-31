import { describe, expect, it } from "vitest";
import {
  buildAvailability,
  isWithinCancellationWindow,
  pickLeastBusyProfessional,
  type AvailabilityInput,
  type BusyAppointment,
} from "@/lib/availability";

const baseInput: AvailabilityInput = {
  date: "2026-10-28",
  timezone: "America/Sao_Paulo",
  now: new Date("2026-10-27T12:00:00.000Z"),
  serviceDurationMin: 30,
  serviceBufferMin: 0,
  slotIntervalMinutes: 30,
  businessHours: {
    isOpen: true,
    openMinute: 540,
    closeMinute: 1080,
  },
  professionals: [
    {
      professionalId: "pro-a",
      isWorking: true,
      startMinute: 540,
      endMinute: 1080,
    },
  ],
  appointments: [],
  blocks: [],
  minAdvanceMinutes: 0,
  maxAdvanceDays: 30,
};

function times(input: AvailabilityInput) {
  return buildAvailability(input).map((slot) => slot.time);
}

describe("buildAvailability", () => {
  it("gera horários dentro do funcionamento e da duração do serviço", () => {
    const result = times(baseInput);
    expect(result[0]).toBe("09:00");
    expect(result.at(-1)).toBe("17:30");
    expect(result).toHaveLength(18);
  });

  it("respeita o intervalo comercial", () => {
    const result = times({
      ...baseInput,
      businessHours: {
        isOpen: true,
        openMinute: 540,
        closeMinute: 1080,
        breakStartMinute: 720,
        breakEndMinute: 780,
      },
    });
    expect(result).not.toContain("12:00");
    expect(result).not.toContain("12:30");
    expect(result).toContain("11:30");
    expect(result).toContain("13:00");
  });

  it("bloqueia sobreposição com agendamento existente sem afetar horário encostado", () => {
    const appointment: BusyAppointment = {
      professionalId: "pro-a",
      startAt: new Date("2026-10-28T13:00:00.000Z"),
      endAt: new Date("2026-10-28T13:30:00.000Z"),
      status: "CONFIRMED",
    };
    const result = times({ ...baseInput, appointments: [appointment] });
    expect(result).not.toContain("10:00");
    expect(result).toContain("09:30");
    expect(result).toContain("10:30");
  });

  it("ignora agendamentos cancelados", () => {
    const appointment: BusyAppointment = {
      professionalId: "pro-a",
      startAt: new Date("2026-10-28T13:00:00.000Z"),
      endAt: new Date("2026-10-28T13:30:00.000Z"),
      status: "CANCELLED",
    };
    expect(times({ ...baseInput, appointments: [appointment] })).toContain("10:00");
  });

  it("aplica bloqueio geral e bloqueio por profissional", () => {
    const general = times({
      ...baseInput,
      blocks: [
        {
          professionalId: null,
          startsAt: new Date("2026-10-28T17:00:00.000Z"),
          endsAt: new Date("2026-10-28T18:00:00.000Z"),
        },
      ],
    });
    expect(general).not.toContain("14:00");

    const onlyOtherProfessional = times({
      ...baseInput,
      blocks: [
        {
          professionalId: "pro-b",
          startsAt: new Date("2026-10-28T17:00:00.000Z"),
          endsAt: new Date("2026-10-28T18:00:00.000Z"),
        },
      ],
    });
    expect(onlyOtherProfessional).toContain("14:00");
  });

  it("respeita antecedência mínima", () => {
    const result = times({
      ...baseInput,
      now: new Date("2026-10-28T12:00:00.000Z"),
      minAdvanceMinutes: 60,
    });
    expect(result).not.toContain("09:00");
    expect(result).not.toContain("09:30");
    expect(result[0]).toBe("10:00");
  });

  it("não retorna horários para dia fechado", () => {
    expect(
      times({
        ...baseInput,
        businessHours: {
          isOpen: false,
          openMinute: 540,
          closeMinute: 1080,
        },
      }),
    ).toEqual([]);
  });

  it("retorna apenas profissionais que atendem a janela completa", () => {
    const slots = buildAvailability({
      ...baseInput,
      professionals: [
        {
          professionalId: "pro-a",
          isWorking: true,
          startMinute: 540,
          endMinute: 1080,
        },
        {
          professionalId: "pro-b",
          isWorking: true,
          startMinute: 600,
          endMinute: 1080,
        },
      ],
    });
    const first = slots.find((slot) => slot.time === "09:00");
    const later = slots.find((slot) => slot.time === "11:00");
    expect(first?.professionalIds).toEqual(["pro-a"]);
    expect(later?.professionalIds).toEqual(["pro-a", "pro-b"]);
  });

  it("inclui a folga do serviço no cálculo de conflito", () => {
    const appointment: BusyAppointment = {
      professionalId: "pro-a",
      startAt: new Date("2026-10-28T13:00:00.000Z"),
      endAt: new Date("2026-10-28T13:30:00.000Z"),
      status: "CONFIRMED",
    };
    const result = times({
      ...baseInput,
      serviceBufferMin: 15,
      appointments: [appointment],
    });
    expect(result).not.toContain("09:30");
  });
});

describe("pickLeastBusyProfessional", () => {
  const timezone = "America/Sao_Paulo";
  const date = "2026-10-28";

  it("escolhe quem tem menos atendimentos no dia", () => {
    const appointments: BusyAppointment[] = [
      {
        professionalId: "pro-a",
        startAt: new Date("2026-10-28T13:00:00.000Z"),
        endAt: new Date("2026-10-28T13:30:00.000Z"),
        status: "CONFIRMED",
      },
      {
        professionalId: "pro-a",
        startAt: new Date("2026-10-28T14:00:00.000Z"),
        endAt: new Date("2026-10-28T14:30:00.000Z"),
        status: "PENDING",
      },
      {
        professionalId: "pro-b",
        startAt: new Date("2026-10-28T15:00:00.000Z"),
        endAt: new Date("2026-10-28T15:30:00.000Z"),
        status: "CONFIRMED",
      },
    ];
    expect(pickLeastBusyProfessional(["pro-a", "pro-b"], appointments, timezone, date)).toBe(
      "pro-b",
    );
  });

  it("desempata pelo identificador e ignora outro dia", () => {
    const appointments: BusyAppointment[] = [
      {
        professionalId: "pro-b",
        startAt: new Date("2026-10-29T13:00:00.000Z"),
        endAt: new Date("2026-10-29T13:30:00.000Z"),
        status: "CONFIRMED",
      },
    ];
    expect(pickLeastBusyProfessional(["pro-b", "pro-a"], appointments, timezone, date)).toBe(
      "pro-a",
    );
  });
});

describe("isWithinCancellationWindow", () => {
  const startAt = new Date("2026-10-28T15:00:00.000Z");

  it("permite cancelar antes do limite", () => {
    expect(isWithinCancellationWindow(startAt, 4, new Date("2026-10-28T10:59:00.000Z"))).toBe(
      true,
    );
  });

  it("bloqueia no limite e depois dele", () => {
    expect(isWithinCancellationWindow(startAt, 4, new Date("2026-10-28T11:00:00.000Z"))).toBe(
      true,
    );
    expect(isWithinCancellationWindow(startAt, 4, new Date("2026-10-28T11:01:00.000Z"))).toBe(
      false,
    );
  });
});
