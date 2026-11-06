import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ExternalLink, LogOut, ArrowLeft, ShieldCheck, MailWarning } from "lucide-react";
import { requirePanel } from "@/lib/auth/session";
import { ROLE_LABELS, APP_NAME } from "@/lib/constants";
import { isManagerRole } from "@/lib/permissions";
import { logoutAction } from "@/lib/actions/auth";
import { stopImpersonationAction } from "@/lib/actions/admin";
import { Logo } from "@/components/ui";
import {
  MobilePanelNav,
  PanelNav,
  type PanelNavItem,
} from "@/components/panel/PanelNav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { default: "Painel", template: `%s | ${APP_NAME}` },
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const auth = await requirePanel();
  const isManager = isManagerRole(auth.role);
  const isOwner = auth.role === "OWNER";

  const mainItems: PanelNavItem[] = [
    { href: "/painel", label: "Visão geral", icon: "dashboard" },
    { href: "/painel/agenda", label: "Agenda", icon: "agenda" },
    { href: "/painel/agendamentos", label: "Agendamentos", icon: "calendar" },
    ...(isManager
      ? ([
          { href: "/painel/clientes", label: "Clientes", icon: "customers" },
          { href: "/painel/servicos", label: "Serviços", icon: "services" },
          { href: "/painel/profissionais", label: "Profissionais", icon: "professionals" },
          { href: "/painel/relatorios", label: "Relatórios", icon: "reports" },
        ] satisfies PanelNavItem[])
      : []),
  ];

  const footerItems: PanelNavItem[] = [
    ...(isManager
      ? ([
          { href: "/painel/personalizar", label: "Personalizar página", icon: "palette" },
          { href: "/painel/configuracoes", label: "Configurações", icon: "settings" },
        ] satisfies PanelNavItem[])
      : []),
    ...(isOwner
      ? ([
          { href: "/painel/equipe", label: "Equipe e acessos", icon: "team" },
          { href: "/painel/plano", label: "Plano e cobrança", icon: "billing" },
        ] satisfies PanelNavItem[])
      : []),
  ];

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-[268px] shrink-0 flex-col border-r border-line bg-white px-4 py-5 lg:flex">
          <Link href="/painel" className="shrink-0 px-1" aria-label="AgendamentoON — painel">
            <Logo />
          </Link>

          <div className="mt-6 flex shrink-0 items-center gap-3 border-y border-line py-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-paper text-[11px] font-semibold text-ink">
              {initials(auth.establishment.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-ink">
                {auth.establishment.name}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-muted">
                {ROLE_LABELS[auth.role]}
                {auth.professionalId ? ` · ${auth.user.name}` : ""}
              </p>
            </div>
          </div>

          <div className="mt-5 flex min-h-0 flex-1 flex-col overflow-y-auto pb-1 pr-1">
            <PanelNav
              items={mainItems}
              footerItems={footerItems}
              mainLabel={isManager ? "Operação" : "Sua rotina"}
            />
          </div>

          <div className="mt-4 shrink-0 space-y-2 border-t border-line pt-4">
            <Link
              href={`/agendar/${auth.establishment.slug}`}
              target="_blank"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-paper hover:text-ink"
            >
              Ver página pública
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <div className="px-3 text-[10px] leading-relaxed text-slate-400">
              {auth.user.name}
              <br />
              {auth.user.email}
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {auth.impersonating && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-[11px] text-amber-900 sm:px-6">
              <p className="flex min-w-0 items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                <span className="min-w-0">
                  <strong>Modo administrador:</strong> você está no painel de{" "}
                  <strong>{auth.establishment.name}</strong> como dono. As ações ficam em
                  auditoria.
                </span>
              </p>
              <form action={stopImpersonationAction}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-[11px] font-semibold text-amber-900 transition hover:bg-amber-100"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Voltar ao admin
                </button>
              </form>
            </div>
          )}
          {!auth.impersonating && !auth.user.emailVerifiedAt && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-[11px] text-amber-900 sm:px-6">
              <p className="flex min-w-0 items-center gap-2">
                <MailWarning className="h-4 w-4 shrink-0" aria-hidden />
                <span className="min-w-0">
                  <strong>Confirme seu e-mail.</strong> Enviamos um link para{" "}
                  <strong>{auth.user.email}</strong>. Confirme para manter o acesso seguro.
                </span>
              </p>
              <Link
                href="/verificar-email/pendente"
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-[11px] font-semibold text-amber-900 transition hover:bg-amber-100"
              >
                Confirmar e-mail
              </Link>
            </div>
          )}
          <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur-md">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <MobilePanelNav
                  items={mainItems}
                  footerItems={footerItems}
                  establishmentName={auth.establishment.name}
                  mainLabel={isManager ? "Operação" : "Sua rotina"}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {auth.establishment.name}
                  </p>
                  <p className="truncate text-[11px] text-muted">
                    {ROLE_LABELS[auth.role]} · {auth.user.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/agendar/${auth.establishment.slug}`}
                  target="_blank"
                  className="hidden items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-ink sm:inline-flex"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Página pública
                </Link>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    aria-label="Sair"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-ink"
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden />
                    <span className="hidden sm:inline">Sair</span>
                  </button>
                </form>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          <footer className="border-t border-line px-4 py-4 text-[10px] text-slate-400 sm:px-6">
            {auth.establishment.name} · agenda e atendimento · operado por {APP_NAME}
          </footer>
        </div>
      </div>
    </div>
  );
}
