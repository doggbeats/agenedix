"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, CalendarDays, Menu, X } from "lucide-react";
import { buttonTenant } from "@/components/ui";

export type PublicPageNavItem = {
  href: string;
  label: string;
};

export function PublicPageMenu({
  items,
  establishmentName,
  brandingStyle,
}: {
  items: PublicPageNavItem[];
  establishmentName: string;
  brandingStyle?: CSSProperties;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    // Se a janela crescer para desktop, fecha o painel para não travar o scroll.
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onDesktop);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onDesktop);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="public-page-menu"
        aria-label="Abrir menu"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--brand-radius)] border border-[var(--brand-menu-line)] bg-transparent text-[var(--brand-menu-text)] transition hover:border-[var(--brand)] hover:text-[var(--brand)] lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 lg:hidden" style={brandingStyle}>
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            />
            <div
              id="public-page-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menu da página"
              className="animate-slide-in absolute inset-y-0 right-0 flex w-[90%] max-w-sm flex-col border-l border-[var(--brand-menu-line)] bg-[var(--brand-menu)] text-[var(--brand-menu-text)]"
            >
              <div className="flex items-start justify-between gap-3 border-b border-[var(--brand-menu-line)] px-5 py-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--brand-radius)] bg-[var(--brand-button)] text-[11px] font-bold text-[var(--brand-button-text)]">
                    {establishmentName.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold">
                      {establishmentName}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-[var(--brand-menu-muted)]">
                      Navegação
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--brand-radius)] border border-[var(--brand-menu-line)] text-[var(--brand-menu-muted)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav
                className="flex flex-1 flex-col overflow-y-auto px-5 py-2"
                aria-label="Seções da página"
              >
                {items.map((item, index) => (
                  <a
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between gap-4 border-b border-[var(--brand-menu-line)] py-4 text-[15px] font-medium transition hover:text-[var(--brand)]"
                  >
                    <span className="inline-flex items-center gap-3">
                      <span className="font-mono text-[10px] text-[var(--brand-menu-muted)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {item.label}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-[var(--brand-menu-muted)] transition group-hover:text-[var(--brand)]" />
                  </a>
                ))}
              </nav>

              <div className="mt-auto border-t border-[var(--brand-menu-line)] p-5">
                <a
                  href="#agendar"
                  onClick={() => setOpen(false)}
                  className={`${buttonTenant} w-full justify-center`}
                >
                  <CalendarDays className="h-4 w-4" /> Agendar horário
                </a>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
