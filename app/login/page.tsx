import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowLeft, Clock3, ShieldCheck, Users } from "lucide-react";
import { getAuthContext } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/LoginForm";
import { Alert, Logo } from "@/components/ui";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Área da equipe" };
export const dynamic = "force-dynamic";

const LOGIN_IMAGE =
  "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1600&q=80";

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#17120e] px-4 py-10 sm:px-6">
      <Image
        src={LOGIN_IMAGE}
        alt="Interior de um salão de beleza com cadeiras e espelhos"
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#120d09]/80 via-[#17120e]/70 to-[#120d09]/90" />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#af7e56]/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#e3bd97]/15 blur-3xl"
      />

      <main className="relative z-10 w-full max-w-[440px] animate-rise">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" aria-label={`${APP_NAME} — página inicial`}>
            <Logo dark size="lg" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[11px] font-semibold text-white/80 backdrop-blur transition hover:border-white/35 hover:bg-white/15 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Início
          </Link>
        </div>

        <div className="rounded-[30px] border border-white/70 bg-white/95 p-6 shadow-[0_40px_120px_-50px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-brand" />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Acesso restrito
            </p>
          </div>
          <h1 className="font-space mt-3 text-[28px] font-semibold leading-tight tracking-tight text-slate-900 sm:text-[32px]">
            Bem-vindo de volta
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Entre com suas credenciais para abrir o painel do seu estabelecimento.
          </p>

          {message && (
            <div className="mt-5">
              <Alert tone="warning">{message}</Alert>
            </div>
          )}

          <div className="mt-6">
            <LoginForm next={next} />
          </div>

          <p className="mt-6 border-t border-[#efe7dd] pt-5 text-center text-sm text-slate-600">
            Vai cadastrar um estabelecimento?{" "}
            <Link
              href="/cadastro"
              className="font-semibold text-brand-hover underline underline-offset-2 transition hover:text-ink"
            >
              Criar conta
            </Link>
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-medium text-white/65">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#e3bd97]" /> Conexão segura
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-[#e3bd97]" /> Acesso por perfil
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5 text-[#e3bd97]" /> Suporte próximo
          </span>
        </div>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-white/50">
          Precisa de acesso? Fale com o responsável pelo seu estabelecimento para receber suas
          credenciais.
        </p>
      </main>
    </div>
  );
}
