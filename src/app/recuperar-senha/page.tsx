import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordRecoveryForm } from "@/components/auth/RecoveryForms";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function PasswordRecoveryPage() {
  return (
    <AuthShell
      eyebrow="Recuperar acesso"
      title="Enviar link de nova senha"
      description={`Informe o e-mail cadastrado na ${APP_NAME}. Se houver uma conta, o link chega em alguns minutos e expira em 1 hora.`}
      topRight={
        <Link
          href="/login"
          className="font-semibold text-ink underline underline-offset-2 hover:text-brand-hover"
        >
          Voltar para o login
        </Link>
      }
    >
      <PasswordRecoveryForm />
    </AuthShell>
  );
}
