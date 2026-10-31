"use client";

import { useFormStatus } from "react-dom";
import { buttonBrand, buttonDanger, buttonPrimary, buttonSecondary } from "@/components/ui";

type Variant = "primary" | "brand" | "secondary" | "danger";

const variants: Record<Variant, string> = {
  primary: buttonPrimary,
  brand: buttonBrand,
  secondary: buttonSecondary,
  danger: buttonDanger,
};

export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  className = "",
  disabled,
  title,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: Variant;
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={`${variants[variant]} ${className}`}
      disabled={pending || disabled}
      title={title}
    >
      {pending ? (pendingLabel ?? "Salvando...") : children}
    </button>
  );
}
