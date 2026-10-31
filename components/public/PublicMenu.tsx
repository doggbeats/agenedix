"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, LogIn, Menu, X } from "lucide-react";

const links = [
  { href: "/#recursos", label: "Recursos" },
  { href: "/#planos", label: "Planos" },
  { href: "/agendar", label: "Agendas online" },
];

export function PublicMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="public-mobile-menu"
        aria-label="Abrir menu"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-slate-600 transition hover:border-slate-300 hover:text-ink md:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
          />
          <div
            id="public-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu do site"
            className="animate-slide-in absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col border-l border-line bg-white p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Navegação
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="grid h-9 w-9 place-items-center rounded-lg border border-line text-slate-500 transition hover:bg-paper hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="mt-7 flex flex-col" aria-label="Menu principal">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between border-b border-line py-3.5 text-[15px] font-medium text-slate-700 transition hover:text-brand-hover"
                >
                  {link.label}
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
              ))}
            </nav>

            <div className="mt-auto space-y-2 border-t border-line pt-5">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-paper"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Área da equipe
              </Link>
              <Link
                href="/cadastro"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover"
              >
                Criar conta
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
