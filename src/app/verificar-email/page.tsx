import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, MailWarning } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { consumeEmailVerificationToken } from "@/lib/auth/tokens";

export const metadata: Metadata = { title: "Verificar e-mail" };
export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token ? await consumeEmailVerificationToken(token) : null;

  return (
    <AuthShell
      eyebrow="Verificação"
      title={result ? "E-mail confirmado" : "Link inválido ou expirado"}
      description={
        result
          ? "Seu endereço foi verificado. Você já pode usar todos os recursos do painel."
          : "Este link de verificação não é mais válido. Entre no painel para continuar; se precisar de um novo link, fale com o suporte."
      }
      topRight={
        <Link
          href="/login"
          className="font-semibold text-ink underline underline-offset-2 hover:text-brand-hover"
        >
          Ir para o login
        </Link>
      }
    >
      <div className="space-y-5">
        <span
          className={`grid h-12 w-12 place-items-center rounded-xl ${
            result
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {result ? (
            <CheckCircle2 className="h-6 w-6" aria-hidden />
          ) : (
            <MailWarning className="h-6 w-6" aria-hidden />
          )}
        </span>
        <Link
          href="/painel"
          className="inline-flex w-full items-center justify-center rounded-[10px] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
        >
          Ir para o painel
        </Link>
      </div>
    </AuthShell>
  );
}
