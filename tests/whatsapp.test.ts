import { describe, expect, it } from "vitest";
import {
  appointmentMessage,
  buildWhatsAppLink,
  customerContactMessage,
  renderTemplate,
} from "@/lib/whatsapp";

const context = {
  customerName: "Ana Paula Souza",
  customerPhone: "5561988887777",
  serviceName: "Corte premium",
  professionalName: "Bruno",
  startAt: new Date("2026-10-28T15:30:00.000Z"),
  timezone: "America/Sao_Paulo",
  protocol: "CP-ABC123",
  establishmentName: "Barbearia Nobre",
  address: "Rua das Palmeiras, 100",
};

describe("whatsapp", () => {
  it("gera link wa.me sem prometer envio automático", () => {
    const link = buildWhatsAppLink("(61) 98888-7777", "Olá, tudo bem?");
    expect(link).toBe("https://wa.me/61988887777?text=Ol%C3%A1%2C%20tudo%20bem%3F");
    expect(buildWhatsAppLink("", "teste")).toBe("");
  });

  it("monta mensagem padrão com os dados do agendamento", () => {
    const message = appointmentMessage(context);
    expect(message).toContain("Olá, Ana!");
    expect(message).toContain("Corte premium");
    expect(message).toContain("28/10/2026 às 12:30");
    expect(message).toContain("CP-ABC123");
    expect(message).toContain("Rua das Palmeiras, 100");
  });

  it("usa modelo personalizado e substitui variáveis", () => {
    const message = appointmentMessage({
      ...context,
      customTemplate:
        "Oi {primeiro_nome}, seu {servico} com {profissional} é {data}. Protocolo {protocolo}. {variavel_inexistente}",
    });
    expect(message).toBe(
      "Oi Ana, seu Corte premium com Bruno é 28/10/2026 às 12:30. Protocolo CP-ABC123. {variavel_inexistente}",
    );
  });

  it("mantém placeholders desconhecidos", () => {
    expect(renderTemplate("Olá {nome}, {desconhecido}", { nome: "Ana" })).toBe(
      "Olá Ana, {desconhecido}",
    );
  });

  it("cria mensagem de contato com e sem protocolo", () => {
    expect(customerContactMessage("Barbearia Nobre", "CP-ABC123")).toContain("CP-ABC123");
    expect(customerContactMessage("Barbearia Nobre")).toContain(
      "página de agendamento da Barbearia Nobre",
    );
  });
});
