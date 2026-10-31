import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, KeyRound } from "lucide-react";
import { Logo } from "@/components/ui";
import { PasswordRecoveryForm } from "@/components/auth/RecoveryForms";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function PasswordRecoveryPage() {
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
            <KeyRound className="h-5 w-5" />
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">
            Recuperar acesso
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Informe o e-mail cadastrado na {APP_NAME}. Se houver uma conta, enviaremos um link
            para criar uma nova senha.
          </p>
          <div className="mt-6">
            <PasswordRecoveryForm />
          </div>
        </section>
      </div>
    </main>
  );
}
