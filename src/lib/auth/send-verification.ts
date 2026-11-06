import { createEmailVerificationToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/urls";

export interface VerificationEmailResult {
  ok: boolean;
  error?: string;
  verifyUrl?: string;
}

/**
 * Cria um token novo e devolve o link de confirmação pronto para uso.
 */
export async function createEmailVerificationLink(userId: string): Promise<string> {
  const token = await createEmailVerificationToken(userId);
  return `${getAppUrl()}/verificar-email?token=${encodeURIComponent(token)}`;
}

/**
 * Gera um token novo e envia o link de confirmação de e-mail.
 * Sem provedor configurado em produção, retorna falha para não dar a falsa
 * impressão de que a mensagem saiu.
 */
export async function sendEmailVerification(
  user: { id: string; name: string; email: string },
  options?: { businessName?: string | null },
): Promise<VerificationEmailResult> {
  try {
    const verifyUrl = await createEmailVerificationLink(user.id);
    const business = options?.businessName?.trim();

    const result = await sendEmail({
      to: user.email,
      subject: "Confirme seu e-mail no AgendamentoON",
      text: [
        `Olá, ${user.name}!`,
        "",
        business
          ? `Sua conta em ${business} foi criada no AgendamentoON.`
          : "Sua conta no AgendamentoON precisa ter o e-mail confirmado.",
        "",
        "Confirme seu e-mail para liberar o acesso ao painel:",
        verifyUrl,
        "",
        "O link expira em 24 horas. Se você não criou esta conta, ignore esta mensagem.",
      ].join("\n"),
    });

    if (!result.ok) {
      return { ok: false, error: result.error ?? "Falha ao enviar o e-mail." };
    }
    if (result.provider === "log" && process.env.NODE_ENV === "production") {
      return {
        ok: false,
        error: "O envio de e-mail não está configurado no servidor (RESEND_API_KEY).",
      };
    }
    return { ok: true, verifyUrl };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao enviar o e-mail.",
    };
  }
}
