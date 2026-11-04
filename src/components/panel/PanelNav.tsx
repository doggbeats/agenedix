"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  CalendarDays,
  CalendarRange,
  CreditCard,
  LayoutDashboard,
  Palette,
  Rocket,
  Scissors,
  Settings,
  Shield,
  Users,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const icons = {
  dashboard: LayoutDashboard,
  agenda: CalendarDays,
  calendar: CalendarRange,
  services: Scissors,
  professionals: UserRound,
  customers: Users,
  reports: BarChart3,
  settings: Settings,
  admin: Shield,
  palette: Palette,
  billing: CreditCard,
  bell: Bell,
  rocket: Rocket,
  team: Users,
} as const;

export type PanelNavItem = {
  href: string;
  label: string;
  icon: keyof typeof icons;
  description?: string;
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/painel") return pathname === "/painel";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, active }: { item: PanelNavItem; active: boolean }) {
  const Icon = icons[item.icon];
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
        active
          ? "bg-brand/5 text-ink"
          : "text-slate-600 hover:bg-paper hover:text-ink"
      }`}
    >
      {active && (
        <span
          aria-hidden
          className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-brand"
        />
      )}
      <Icon
        className={`h-4 w-4 shrink-0 transition-colors ${
          active ? "text-brand" : "text-slate-400 group-hover:text-slate-600"
        }`}
        aria-hidden
      />
      <span className="flex-1">{item.label}</span>
    </Link>
  );
}

export function PanelNav({
  items,
  footerItems = [],
  mainLabel = "Operação",
  footerLabel = "Gestão",
}: {
  items: PanelNavItem[];
  footerItems?: PanelNavItem[];
  mainLabel?: string;
  footerLabel?: string;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-6" aria-label="Navegação principal">
      <div>
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {mainLabel}
        </p>
        <div className="space-y-0.5">
          {items.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
        </div>
      </div>

      {footerItems.length > 0 && (
        <div className="mt-auto border-t border-line pt-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {footerLabel}
          </p>
          <div className="space-y-0.5">
            {footerItems.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

export function MobilePanelNav({
  items,
  footerItems = [],
  establishmentName,
  mainLabel,
  footerLabel,
}: {
  items: PanelNavItem[];
  footerItems?: PanelNavItem[];
  establishmentName: string;
  mainLabel?: string;
  footerLabel?: string;
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
        aria-label="Abrir menu do painel"
        aria-expanded={open}
        aria-controls="panel-mobile-menu"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-ink transition hover:border-slate-300 hover:bg-paper lg:hidden"
      >
        <span className="space-y-1">
          <span className="block h-0.5 w-4 bg-current" />
          <span className="block h-0.5 w-4 bg-current" />
          <span className="block h-0.5 w-4 bg-current" />
        </span>
      </button>
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
              className="animate-fade absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <div
              id="panel-mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menu do painel"
              className="animate-rise absolute inset-y-0 left-0 flex w-[86%] max-w-xs flex-col overflow-y-auto border-r border-line bg-white p-4 shadow-2xl"
            >
              <div className="mb-5 flex items-center justify-between border-b border-line pb-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Painel
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-ink">
                    {establishmentName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-lg hover:bg-paper"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div onClick={() => setOpen(false)}>
                <PanelNav
                  items={items}
                  footerItems={footerItems}
                  mainLabel={mainLabel}
                  footerLabel={footerLabel}
                />
              </div>
              <p className="mt-6 border-t border-line pt-4 text-[10px] text-slate-400">
                {establishmentName} · painel da equipe
              </p>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
