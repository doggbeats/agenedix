import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowLeft, ExternalLink, LogOut, ShieldCheck } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { logoutAction } from "@/lib/actions/auth";
import { Logo } from "@/components/ui";
import { AdminNav } from "@/components/platform/AdminNav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administração da plataforma" };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const auth = await requirePlatformAdmin();

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 py-3">
            <div className="flex min-w-0 items-center gap-6">
              <Link href="/admin" className="shrink-0">
                <Logo />
              </Link>
              <div className="hidden md:block">
                <AdminNav />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-md border border-brand/25 bg-brand/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-hover sm:inline-flex">
                <ShieldCheck className="h-3.5 w-3.5" /> Admin da plataforma
              </span>
              {auth.memberships.length > 0 && (
                <Link
                  href="/painel"
                  className="hidden items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-paper sm:inline-flex"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Painel
                </Link>
              )}
              <Link
                href="/"
                target="_blank"
                className="hidden items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-paper lg:inline-flex"
              >
                Site <ExternalLink className="h-3.5 w-3.5" />
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  aria-label="Sair"
                  className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-paper"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </form>
            </div>
          </div>
          <div className="pb-2 md:hidden">
            <AdminNav />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>

      <footer className="border-t border-line bg-white px-4 py-4 text-center text-[10px] text-slate-500 sm:px-6">
        AgendamentoON · administração da plataforma ·{" "}
        {auth.user.email}
      </footer>
    </div>
  );
}
