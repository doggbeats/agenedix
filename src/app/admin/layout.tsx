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
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <Link href="/admin" className="shrink-0" aria-label="Administração — início">
                <Logo />
              </Link>
              <span className="hidden items-center gap-1.5 rounded-md border border-brand/20 bg-brand/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-hover sm:inline-flex">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Admin da plataforma
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {auth.memberships.length > 0 && (
                <Link
                  href="/painel"
                  className="hidden items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-ink sm:inline-flex"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Painel
                </Link>
              )}
              <Link
                href="/"
                target="_blank"
                className="hidden items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-ink lg:inline-flex"
              >
                Site <ExternalLink className="h-3.5 w-3.5" aria-hidden />
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

          <div className="border-t border-line/70">
            <AdminNav />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>

      <footer className="border-t border-line bg-white px-4 py-4 text-center text-[10px] text-slate-400 sm:px-6">
        AgendamentoON · administração da plataforma · {auth.user.email}
      </footer>
    </div>
  );
}
