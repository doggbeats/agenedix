import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordResetForm } from "@/components/auth/RecoveryForms";

export const metadata: Metadata = { title: "Redefinir senha" };

export default async function PasswordResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const validToken = typeof token === "string" && token.length >= 20;

  return (
    <AuthShell
      eyebrow="Nova senha"
      title="Definir uma nova senha"
      description="Escolha uma senha com pelo menos 8 caracteres. Por segurança, o link só pode ser usado uma vez."
      topRight={
        <Link
          href="/login"
          className="font-semibold text-ink underline underline-offset-2 hover:text-brand-hover"
        >
          Voltar para o login
        </Link>
      }
    >
      {validToken ? (
        <PasswordResetForm token={token} />
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm leading-relaxed text-amber-900">
            Este link é inválido ou expirou. Solicite um novo link de recuperação.
          </div>
          <Link
            href="/recuperar-senha"
            className="inline-flex w-full items-center justify-center rounded-[10px] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
          >
            Solicitar novo link
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
