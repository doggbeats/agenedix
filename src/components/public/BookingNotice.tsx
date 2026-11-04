"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock3 } from "lucide-react";

export function BookingNotice({
  title,
  detail,
  pending = false,
  duration = 5200,
}: {
  title: string;
  detail: string;
  pending?: boolean;
  duration?: number;
}) {
  const [leaving, setLeaving] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const start = window.setTimeout(() => setLeaving(true), duration);
    const end = window.setTimeout(() => setVisible(false), duration + 300);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(end);
    };
  }, [duration]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4 transition-all duration-300 ease-out ${
        leaving ? "-translate-y-2 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="animate-rise flex w-full max-w-sm items-start gap-3 rounded-[var(--brand-radius)] border border-[var(--brand-line)] bg-[var(--brand-bg)] px-4 py-3 shadow-[0_18px_40px_-24px_rgba(11,11,11,0.45)]">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--brand-button)] text-[var(--brand-button-text)]">
          {pending ? <Clock3 className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-snug text-[var(--brand-text)]">
            {title}
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--muted)]">{detail}</p>
        </div>
      </div>
    </div>
  );
}
