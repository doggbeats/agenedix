import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, MailWarning } from "lucide-react";
import { Logo } from "@/components/ui";
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
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-10 text-ink sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="inline-flex rounded-md">
            <Logo />
          </Link>
        </div>

        <section className="rounded-2xl border border-line bg-white p-5 text-center shadow-sm sm:p-8">
          {result ? (
            <>
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-green-50 text-green-700">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">
                E-mail confirmado
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Seu endereço foi verificado. Você já pode usar todos os recursos do painel.
              </p>
            </>
          ) : (
            <>
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-50 text-amber-700">
                <MailWarning className="h-6 w-6" />
              </span>
              <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">
                Link inválido ou expirado
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Este link de verificação não é mais válido. Entre no painel para continuar; se
                precisar de um novo link, fale com o suporte.
              </p>
            </>
          )}
          <Link
            href="/painel"
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
          >
            Ir para o painel
          </Link>
        </section>
      </div>
    </main>
  );
}
