"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CreditCard,
  LayoutDashboard,
  ReceiptText,
  ScrollText,
  Users,
} from "lucide-react";

const items = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/estabelecimentos", label: "Estabelecimentos", icon: Building2 },
  { href: "/admin/planos", label: "Planos", icon: CreditCard },
  { href: "/admin/pagamentos", label: "Pagamentos", icon: ReceiptText },
  { href: "/admin/auditoria", label: "Auditoria", icon: ScrollText },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação administrativa"
      className="-mx-1 flex gap-1 overflow-x-auto pb-1"
    >
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              active
                ? "bg-brand/10 text-brand"
                : "text-slate-600 hover:bg-slate-100 hover:text-ink"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
