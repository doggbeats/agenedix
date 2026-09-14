"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { Appointment, Barber, Service } from "@/lib/types";
import { formatPrice, formatShortDate, statusLabels } from "@/lib/utils";
import { maskPhone } from "@/lib/utils";

interface StoredClient {
  name: string;
  phone: string;
}

const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5561981494548";

export default function MinhaConta() {
  const router = useRouter();
  const [client, setClient] = useState<StoredClient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (cancelled) return;
      const raw = localStorage.getItem("client_auth");
      if (!raw) {
        router.replace("/login");
        return;
      }
      try {
        const parsed = JSON.parse(raw) as StoredClient;
        if (cancelled) return;
        setClient(parsed);
        Promise.all([
          fetch(`/api/appointments?phone=${encodeURIComponent(parsed.phone)}`).then(
            (r) => r.json()
          ),
          fetch("/api/services").then((r) => r.json()),
          fetch("/api/barbers").then((r) => r.json()),
        ]).then(([a, s, b]) => {
          if (cancelled) return;
          setAppointments(a.appointments ?? []);
          setServices(s.services ?? []);
          setBarbers(b.barbers ?? []);
        });
      } catch {
        if (!cancelled) router.replace("/login");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const cancel = async (id: string) => {
    const appointment = appointments.find((a) => a.id === id);
    const confirmado = window.confirm(
      "Tem certeza que deseja cancelar este agendamento?"
    );
    if (!confirmado) return;

    setBusyId(id);
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    if (res.ok) {
      const { appointment: updated } = await res.json();
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));

      if (appointment) {
        const service = services.find((s) => s.id === appointment.serviceId);
        const barber = barbers.find((b) => b.id === appointment.barberId);
        const mensagem = encodeURIComponent(
          `Olá! Gostaria de cancelar meu agendamento na Barbearia Nobre:\n` +
            `Cliente: ${client?.name ?? ""}\n` +
            `Serviço: ${service?.name ?? "..."}\n` +
            `Barbeiro: ${barber?.name ?? "..."}\n` +
            `Data: ${formatShortDate(appointment.date)} às ${appointment.time}\n\n` +
            `Obrigado!`
        );
        window.open(
          `https://wa.me/${WHATSAPP_NUMBER}?text=${mensagem}`,
          "_blank"
        );
      }
    } else {
      window.alert("Não foi possível cancelar o agendamento.");
    }
    setBusyId("");
  };

  const upcoming = appointments
    .filter((a) => a.status === "confirmed")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 5);

  const history = [...appointments]
    .filter((a) => a.status !== "confirmed")
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  if (!client) {
    return (
      <div className="flex min-h-screen flex-1 flex-col bg-stone-950 text-stone-100">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-stone-400">Carregando...</p>
        </main>
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    confirmed: "bg-green-500/10 text-green-400",
    cancelled: "bg-red-500/10 text-red-400",
    completed: "bg-blue-500/10 text-blue-400",
  };

  const AppointmentCard = ({ a }: { a: Appointment }) => {
    const service = services.find((s) => s.id === a.serviceId);
    const barber = barbers.find((b) => b.id === a.barberId);
    return (
      <div className="rounded-2xl border border-stone-800 bg-stone-900 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold">{service?.name ?? "Serviço removido"}</p>
            <p className="mt-1 text-sm text-stone-400">
              {barber?.name ?? "Qualquer barbeiro"}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor[a.status]}`}
          >
            {statusLabels[a.status]}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-800 pt-4 text-sm">
          <div>
            <p className="font-medium capitalize">
              {formatShortDate(a.date)}
              <span className="ml-2 text-amber-500">{a.time}</span>
            </p>
            {service && (
              <p className="mt-1 font-semibold text-amber-500">
                {formatPrice(service.price)}
              </p>
            )}
          </div>
          {a.status === "confirmed" && (
            <button
              onClick={() => cancel(a.id)}
              disabled={busyId === a.id}
              className="rounded-full border border-red-500/40 px-4 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-40"
            >
              {busyId === a.id ? "Cancelando..." : "Cancelar"}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-stone-950 text-stone-100">
      <Header />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Minha conta</h1>
            <p className="mt-1 text-stone-400">
              Olá, <span className="font-medium text-white">{client.name}</span>!
              Seus agendamentos na Barbearia Nobre.
            </p>
          </div>
          <span className="rounded-full border border-stone-700 px-4 py-2 text-sm text-stone-300">
            📞 {maskPhone(client.phone)}
          </span>
        </div>

        <section>
          <h2 className="mb-4 text-lg font-semibold">
            Próximos agendamentos
          </h2>
          {upcoming.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-800 p-8 text-center text-sm text-stone-500">
              Você não tem agendamentos futuros.{" "}
              <button
                onClick={() => router.push("/agendar")}
                className="font-medium text-amber-500 hover:text-amber-400"
              >
                Agendar agora
              </button>
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {upcoming.map((a) => (
                <AppointmentCard key={a.id} a={a} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Histórico</h2>
          {history.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-800 p-8 text-center text-sm text-stone-500">
              Nenhum agendamento passado.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {history.map((a) => (
                <AppointmentCard key={a.id} a={a} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}