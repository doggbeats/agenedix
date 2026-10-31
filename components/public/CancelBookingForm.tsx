"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import { buttonDanger, inputClass } from "@/components/ui";

export function CancelBookingForm({
  slug,
  protocol,
  token,
  cancellationNoticeHours,
}: {
  slug: string;
  protocol: string;
  token: string;
  cancellationNoticeHours: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        Agendamento cancelado. O horário foi liberado para outras pessoas.
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={buttonDanger}>
        <XCircle className="h-4 w-4" /> Cancelar agendamento
      </button>
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/public/${encodeURIComponent(slug)}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ protocol, token, reason }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Não foi possível cancelar.");
      setDone(true);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível cancelar o agendamento.",
      );
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-semibold text-red-800">Cancelar este agendamento?</p>
      <p className="mt-1 text-xs leading-relaxed text-red-700">
        O cancelamento online é permitido até {cancellationNoticeHours} hora(s) antes do
        atendimento. Esta ação libera o horário na agenda.
      </p>
      <label
        htmlFor="cancel-reason"
        className="mt-3 block text-[11px] font-semibold uppercase tracking-wide text-red-700"
      >
        Motivo (opcional)
      </label>
      <textarea
        id="cancel-reason"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        rows={2}
        maxLength={300}
        className={`${inputClass} mt-1`}
        placeholder="Conte para o estabelecimento o que aconteceu"
      />
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          Confirmar cancelamento
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={loading}
          className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
        >
          Manter agendamento
        </button>
      </div>
    </form>
  );
}
