import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Área da equipe" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; next?: string }>;
}) {
  const auth = await getAuthContext();
  if (auth?.activeMembership) redirect("/painel");

  const { erro, next } = await searchParams;
  const message =
    auth && !auth.activeMembership
      ? `Sua conta não está vinculada a nenhum estabelecimento. Fale com o responsável pelo negócio ou cadastre-se para criar uma conta na ${APP_NAME}.`
      : erro === "sem-estabelecimento"
        ? `Sua conta não está vinculada a nenhum estabelecimento. Fale com o responsável pelo negócio ou cadastre-se para criar uma conta na ${APP_NAME}.`
        : erro;

  return (
    <AuthShell
      eyebrow="Área da equipe"
      title="Entrar no painel"
      description="Use o e-mail e a senha vinculados ao seu estabelecimento. O acesso é separado por papel: proprietário, administração e profissional."
      topRight={
        <span>
          Ainda não tem conta?{" "}
          <Link
            href="/cadastro"
            className="font-semibold text-ink underline underline-offset-2 hover:text-brand-hover"
          >
            Criar conta
          </Link>
        </span>
      }
    >
      {message && (
        <div className="mb-5">
          <Alert tone="warning">{message}</Alert>
        </div>
      )}

      <LoginForm next={next} />

      <p className="mt-6 text-center text-[11px] leading-relaxed text-muted">
        Precisa de acesso? Peça ao responsável pelo estabelecimento para enviar o convite
        com suas credenciais.
      </p>
    </AuthShell>
  );
}
