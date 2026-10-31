"use client";

import { useFormStatus } from "react-dom";

export function ConfirmButton({
  children,
  confirmMessage,
  className,
  pendingLabel = "Processando...",
}: {
  children: React.ReactNode;
  confirmMessage: string;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
      className={className}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
