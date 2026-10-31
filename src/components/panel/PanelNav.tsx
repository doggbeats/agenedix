"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  CalendarDays,
  CalendarRange,
  ChevronRight,
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

export function PanelNav({
  items,
  footerItems = [],
}: {
  items: PanelNavItem[];
  footerItems?: PanelNavItem[];
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-6" aria-label="Navegação principal">
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = icons[item.icon];
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition duration-150 ${
                active
                  ? "bg-brand text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-ink"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-slate-500 group-hover:text-ink"}`}
              />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="h-3.5 w-3.5 text-white/40" />}
            </Link>
          );
        })}
      </div>
      {footerItems.length > 0 && (
        <div className="mt-auto space-y-1 border-t border-line pt-4">
          {footerItems.map((item) => {
            const Icon = icons[item.icon];
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition duration-150 ${
                  active ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-100 hover:text-ink"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-white" : "text-slate-500"}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}

export function MobilePanelNav({
  items,
  footerItems = [],
  establishmentName,
}: {
  items: PanelNavItem[];
  footerItems?: PanelNavItem[];
  establishmentName: string;
}) {
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
      {open && (
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
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Painel
                </p>
                <p className="mt-0.5 text-sm font-semibold text-ink">{establishmentName}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg hover:bg-slate-100"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div onClick={() => setOpen(false)}>
              <PanelNav items={items} footerItems={footerItems} />
            </div>
            <p className="mt-6 border-t border-line pt-4 text-[10px] text-slate-500">
              {establishmentName} · painel da equipe
            </p>
          </div>
        </div>
      )}
    </>
  );
}
