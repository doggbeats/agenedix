interface EmailInput {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

interface EmailResult {
  ok: boolean;
  provider: "resend" | "log";
  error?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textToHtml(text: string): string {
  return `<div style="font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;line-height:1.65;color:#0B0B0B;max-width:560px;margin:0 auto;padding:24px">${escapeHtml(
    text,
  ).replace(/\n/g, "<br />")}</div>`;
}

/**
 * Adaptador de e-mail. Usa a API da Resend quando configurada e, sem chave,
 * registra a mensagem no log para não interromper o fluxo local.
 */
export async function sendEmail(input: EmailInput): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || "Agendix <nao-responda@agendix.app>";

  if (!apiKey) {
    console.info("[email:log]", {
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return { ok: true, provider: "log" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: textToHtml(input.text),
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return {
        ok: false,
        provider: "resend",
        error: `Resend ${response.status}: ${detail.slice(0, 300)}`,
      };
    }

    return { ok: true, provider: "resend" };
  } catch (error) {
    return {
      ok: false,
      provider: "resend",
      error: error instanceof Error ? error.message : "Falha ao enviar e-mail.",
    };
  }
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}
