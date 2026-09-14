"use client";

import { useEffect, useState } from "react";
import { Appointment, Barber, Service } from "@/lib/types";
import { formatShortDate, statusLabels, todayString } from "@/lib/utils";

type StatusFilter = "all" | "confirmed" | "cancelled" | "completed";

export default function AppointmentsManager() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/appointments").then((r) => r.json()),
      fetch("/api/services").then((r) => r.json()),
      fetch("/api/barbers").then((r) => r.json()),
    ])
      .then(([a, s, b]) => {
        setAppointments(a.appointments ?? []);
        setServices(s.services ?? []);
        setBarbers(b.barbers ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const changeStatus = async (id: string, status: string) => {
    setBusyId(id);
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const { appointment } = await res.json();
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? appointment : a))
      );
    }
    setBusyId("");
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este agendamento?")) return;
    await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  const filtered = appointments
    .filter((a) => (filter === "all" ? true : a.status === filter))
    .filter((a) => (dateFilter ? a.date === dateFilter : true))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  const dates = [...new Set(appointments.map((a) => a.date))].sort();

  const statusColor: Record<string, string> = {
    confirmed: "bg-green-500/10 text-green-400",
    cancelled: "bg-red-500/10 text-red-400",
    completed: "bg-blue-500/10 text-blue-400",
  };

  if (loading) {
    return <p className="text-sm text-stone-400">Carregando agendamentos...</p>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {(["all", "confirmed", "cancelled", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === f
                  ? "bg-amber-500 text-stone-900"
                  : "border border-stone-700 text-stone-300 hover:border-stone-500"
              }`}
            >
              {f === "all" ? "Todos" : statusLabels[f]}
            </button>
          ))}
        </div>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-xl border border-stone-700 bg-stone-900 px-4 py-2 text-sm text-stone-300 outline-none focus:border-amber-500"
        >
          <option value="">Todas as datas</option>
          {dates.map((d) => (
            <option key={d} value={d} className="text-white">
              {formatShortDate(d)}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-800 p-8 text-center text-sm text-stone-500">
          Nenhum agendamento encontrado.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-800">
          <table className="w-full min-w-150 text-left text-sm">
            <thead className="border-b border-stone-800 bg-stone-900 text-stone-400">
              <tr>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Serviço</th>
                <th className="px-4 py-3 font-medium">Funcionário</th>
                <th className="px-4 py-3 font-medium">Data / Hora</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {filtered.map((a) => {
                const service = services.find((s) => s.id === a.serviceId);
                const barber = barbers.find((b) => b.id === a.barberId);
                const isToday = a.date === todayString();
                return (
                  <tr key={a.id} className={isToday ? "bg-amber-500/5" : ""}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{a.clientName}</p>
                      <p className="text-xs text-stone-500">{a.clientPhone}</p>
                    </td>
                    <td className="px-4 py-3">{service?.name ?? "—"}</td>
                    <td className="px-4 py-3">{barber?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      {formatShortDate(a.date)}
                      <span className="ml-2 text-amber-500">{a.time}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor[a.status]}`}
                      >
                        {statusLabels[a.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {a.status === "confirmed" && (
                          <button
                            onClick={() => changeStatus(a.id, "completed")}
                            disabled={busyId === a.id}
                            className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 transition hover:bg-blue-500/20 disabled:opacity-40"
                          >
                            Concluir
                          </button>
                        )}
                        {a.status === "confirmed" && (
                          <button
                            onClick={() => changeStatus(a.id, "cancelled")}
                            disabled={busyId === a.id}
                            className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-40"
                          >
                            Cancelar
                          </button>
                        )}
                        {a.status === "cancelled" && (
                          <button
                            onClick={() => changeStatus(a.id, "confirmed")}
                            disabled={busyId === a.id}
                            className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 transition hover:bg-green-500/20 disabled:opacity-40"
                          >
                            Reativar
                          </button>
                        )}
                        <button
                          onClick={() => remove(a.id)}
                          className="rounded-lg border border-stone-700 px-3 py-1.5 text-xs font-medium text-stone-400 transition hover:border-red-500/40 hover:text-red-400"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}