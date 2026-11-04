import Link from "next/link";
import type { ReactNode } from "react";
import {
  APP_NAME,
  STATUS_LABELS,
  STATUS_STYLES,
  SUBSCRIPTION_LABELS,
} from "@/lib/constants";

export const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-sm font-semibold transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-55 active:translate-y-px";

export const buttonPrimary = `${buttonBase} bg-brand text-white shadow-sm hover:bg-brand-hover`;
export const buttonBrand = `${buttonBase} bg-brand text-white shadow-sm hover:bg-brand-hover`;
export const buttonTenant = `${buttonBase} rounded-[var(--brand-radius,0.625rem)] bg-[var(--brand-button,var(--brand))] text-[var(--brand-button-text,#ffffff)] shadow-sm hover:brightness-95`;
export const buttonTenantOutline =
  "inline-flex items-center justify-center gap-2 rounded-[var(--brand-radius,0.625rem)] border border-[var(--brand-line)] bg-[var(--brand-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--brand-text)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]";
export const buttonSecondary = `${buttonBase} border border-line bg-white text-ink hover:border-slate-300 hover:bg-paper`;
export const buttonGhost = `${buttonBase} text-slate-600 hover:bg-slate-100 hover:text-ink`;
export const buttonDanger = `${buttonBase} border border-red-200 bg-white text-red-700 hover:border-red-300 hover:bg-red-50`;
export const buttonSmall =
  "inline-flex items-center justify-center gap-1.5 rounded-md border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition duration-150 hover:border-slate-300 hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:pointer-events-none disabled:opacity-55";

export const inputClass =
  "w-full rounded-[10px] border border-line bg-white px-3.5 py-2.5 text-sm text-ink shadow-[0_1px_1px_rgba(11,18,32,0.02)] outline-none transition duration-150 placeholder:text-slate-400 hover:border-slate-300 focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:bg-paper disabled:text-slate-500";
export const labelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-600";
export const cardClass = "rounded-xl border border-line bg-white shadow-[0_1px_2px_rgba(11,18,32,0.04)]";

type LogoSize = "sm" | "md" | "lg";

const logoSizeClasses: Record<LogoSize, { mark: string; text: string }> = {
  sm: {
    mark: "h-8 w-8 rounded-[9px] text-[10px]",
    text: "text-[17px]",
  },
  md: {
    mark: "h-9 w-9 rounded-[10px] text-[11px]",
    text: "text-lg",
  },
  lg: {
    mark: "h-11 w-11 rounded-xl text-xs",
    text: "text-2xl",
  },
};

export function Logo({
  dark = false,
  size = "sm",
}: {
  dark?: boolean;
  size?: LogoSize;
}) {
  const classes = logoSizeClasses[size];
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden
        className={`relative grid place-items-center bg-ink font-bold tracking-[0.04em] text-white ${classes.mark}`}
      >
        AO
        <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-brand ring-2 ring-white" />
      </span>
      <span
        className={`font-display font-semibold tracking-[-0.03em] ${classes.text} ${
          dark ? "text-white" : "text-ink"
        }`}
      >
        {APP_NAME.slice(0, -2)}
        <span className="text-brand">ON</span>
      </span>
    </span>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "success" | "warn" | "danger" | "info";
}) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700 ring-slate-200",
    brand: "bg-brand/10 text-brand-hover ring-brand/20",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    danger: "bg-red-50 text-red-700 ring-red-200",
    info: "bg-paper text-slate-700 ring-slate-200",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: keyof typeof STATUS_LABELS }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function SubscriptionBadge({ status }: { status: keyof typeof SUBSCRIPTION_LABELS }) {
  const tone =
    status === "ACTIVE"
      ? "success"
      : status === "TRIALING"
        ? "info"
        : status === "PAST_DUE" || status === "PENDING_PAYMENT"
          ? "warn"
          : "danger";
  return <Badge tone={tone}>{SUBSCRIPTION_LABELS[status]}</Badge>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
            <span aria-hidden className="h-px w-4 bg-brand/50" />
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[26px] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-[30px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      {icon && (
        <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg border border-line bg-white text-slate-500">
          {icon}
        </div>
      )}
      <p className="font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Alert({
  tone = "info",
  children,
}: {
  tone?: "success" | "error" | "info" | "warning";
  children: ReactNode;
}) {
  const tones = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    error: "border-red-200 bg-red-50 text-red-800",
    info: "border-brand/20 bg-brand/5 text-ink",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
  } as const;
  return (
    <div role="status" className={`rounded-[10px] border px-3.5 py-3 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}

export function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{messages[0]}</p>;
}

export function StatCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-[0_1px_2px_rgba(11,18,32,0.04)] ${
        accent ? "border-brand/25 ring-1 ring-brand/5" : "border-line"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 font-display text-[26px] font-semibold leading-none tracking-[-0.03em] text-ink">
        {value}
      </p>
      {hint && <p className="mt-2 text-xs leading-snug text-muted">{hint}</p>}
    </div>
  );
}

export function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition duration-150 ${
        active ? "bg-ink text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
