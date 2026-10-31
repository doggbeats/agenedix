import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ExternalLink, LogOut } from "lucide-react";
import { requirePanel } from "@/lib/auth/session";
import { ROLE_LABELS, APP_NAME } from "@/lib/constants";
import { isManagerRole } from "@/lib/permissions";
import { logoutAction } from "@/lib/actions/auth";
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
        <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-white px-4 py-5 lg:flex">
          <Link href="/painel" className="px-1">
            <Logo />
          </Link>

          <div className="mt-6 rounded-lg border border-line bg-paper p-3">
            <p className="truncate text-sm font-semibold text-ink">{auth.establishment.name}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {ROLE_LABELS[auth.role]}
              {auth.professionalId ? ` · ${auth.user.name}` : ""}
            </p>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Painel do estabelecimento
            </p>
          </div>

          <div className="mt-5 flex-1">
            <PanelNav items={mainItems} footerItems={footerItems} />
          </div>

          <div className="mt-4 space-y-2 border-t border-line pt-4">
            <Link
              href={`/agendar/${auth.establishment.slug}`}
              target="_blank"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-ink"
            >
              Ver página pública
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <div className="px-3 text-[10px] text-slate-500">
              {auth.user.name}
              <br />
              {auth.user.email}
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur-md">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <MobilePanelNav
                  items={mainItems}
                  footerItems={footerItems}
                  establishmentName={auth.establishment.name}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {auth.establishment.name}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
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
                  <ExternalLink className="h-3.5 w-3.5" /> Página pública
                </Link>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    aria-label="Sair"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-ink"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Sair</span>
                  </button>
                </form>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          <footer className="border-t border-line px-4 py-4 text-[10px] text-slate-600 sm:px-6">
            {auth.establishment.name} · agenda e atendimento · operado por {APP_NAME}
          </footer>
        </div>
      </div>
    </div>
  );
}
