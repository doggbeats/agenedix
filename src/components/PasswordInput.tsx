"use client";

import { useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { inputClass } from "@/components/ui";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** Substitui a classe visual padrão do campo (útil em telas personalizadas). */
  fieldClassName?: string;
  /** Ícone decorativo exibido à esquerda do campo. */
  leadingIcon?: ReactNode;
};

export function PasswordInput({
  className,
  fieldClassName,
  leadingIcon,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const label = visible ? "Ocultar senha" : "Mostrar senha";

  return (
    <div className="group relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`${fieldClassName ?? inputClass} pr-11 ${className ?? ""}`}
      />
      {leadingIcon && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
          {leadingIcon}
        </span>
      )}
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={label}
        aria-pressed={visible}
        title={label}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-slate-500 transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
