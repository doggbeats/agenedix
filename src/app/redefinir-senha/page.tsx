import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui";
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
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-10 text-ink sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex rounded-md">
            <Logo />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Entrar
          </Link>
        </div>

        <section className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-8">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand/10 text-brand">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">
            Criar nova senha
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Escolha uma senha forte. Por segurança, o link só pode ser usado uma vez e expira
            em 1 hora.
          </p>

          <div className="mt-6">
            {validToken ? (
              <PasswordResetForm token={token} />
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900">
                  Este link é inválido ou expirou. Solicite um novo link de recuperação.
                </div>
                <Link
                  href="/recuperar-senha"
                  className="inline-flex w-full items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
                >
                  Solicitar novo link
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
