"use client";

import { useEffect, useState } from "react";
import { Appointment, Client, Service } from "@/lib/types";
import { formatPrice, formatShortDate, statusLabels, todayString } from "@/lib/utils";

export default function Dashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/appointments").then((r) => r.json()),
      fetch("/api/services").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
    ])
      .then(([a, s, c]) => {
        setAppointments(a.appointments ?? []);
        setServices(s.services ?? []);
        setClients(c.clients ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-stone-400">Carregando painel...</p>;
  }

  const today = todayString();
  const todaysAppointments = appointments.filter((a) => a.date === today);
  const confirmed = appointments.filter((a) => a.status === "confirmed");
  const totalRevenue = appointments
    .filter((a) => a.status !== "cancelled")
    .reduce((sum, a) => {
      const service = services.find((s) => s.id === a.serviceId);
      return sum + (service?.price ?? 0);
    }, 0);

  const upcoming = [...appointments]
    .filter((a) => a.status === "confirmed")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 6);

  const statusColor: Record<string, string> = {
    confirmed: "bg-green-500/10 text-green-400",
    cancelled: "bg-red-500/10 text-red-400",
    completed: "bg-blue-500/10 text-blue-400",
  };

  const stats = [
    {
      label: "Agendamentos hoje",
      value: String(todaysAppointments.length),
      icon: "📅",
      accent: "text-amber-500",
    },
    {
      label: "Agendamentos confirmados",
      value: String(confirmed.length),
      icon: "✅",
      accent: "text-green-400",
    },
    {
      label: "Clientes cadastrados",
      value: String(clients.length),
      icon: "👥",
      accent: "text-blue-400",
    },
    {
      label: "Receita prevista",
      value: formatPrice(totalRevenue),
      icon: "💰",
      accent: "text-emerald-400",
    },
  ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-stone-800 bg-stone-900 p-5"
          >
            <div className="text-2xl">{s.icon}</div>
            <p className={`mt-3 text-2xl font-bold ${s.accent}`}>{s.value}</p>
            <p className="mt-1 text-sm text-stone-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-stone-800 bg-stone-900">
        <div className="border-b border-stone-800 px-6 py-4">
          <h2 className="text-lg font-semibold">Próximos agendamentos</h2>
        </div>
        {upcoming.length === 0 ? (
          <p className="px-6 py-8 text-sm text-stone-500">
            Nenhum agendamento confirmado por enquanto.
          </p>
        ) : (
          <ul className="divide-y divide-stone-800">
            {upcoming.map((a) => {
              const service = services.find((s) => s.id === a.serviceId);
              return (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center gap-3 px-6 py-4"
                >
                  <div className="min-w-24">
                    <p className="font-semibold">{formatShortDate(a.date)}</p>
                    <p className="text-sm text-amber-500">{a.time}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{a.clientName}</p>
                    <p className="text-sm text-stone-400">
                      {service?.name ?? "Serviço removido"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor[a.status]}`}
                  >
                    {statusLabels[a.status]}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}