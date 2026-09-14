"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Login from "@/components/admin/Login";
import Dashboard from "@/components/admin/Dashboard";
import AppointmentsManager from "@/components/admin/AppointmentsManager";
import BarbersManager from "@/components/admin/BarbersManager";
import ServicesManager from "@/components/admin/ServicesManager";
import ClientsManager from "@/components/admin/ClientsManager";

type Tab =
  | "overview"
  | "appointments"
  | "barbers"
  | "services"
  | "clients";

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Visão geral", icon: "📊" },
  { id: "appointments", label: "Agendamentos", icon: "📅" },
  { id: "barbers", label: "Funcionários", icon: "💈" },
  { id: "services", label: "Serviços", icon: "✂️" },
  { id: "clients", label: "Clientes", icon: "👥" },
];

export default function Admin() {
  const [authed, setAuthed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("admin_auth") === "1"
  );
  const [tab, setTab] = useState<Tab>("overview");

  const logout = () => {
    localStorage.removeItem("admin_auth");
    window.dispatchEvent(new Event("admin-auth-change"));
    setAuthed(false);
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-stone-950 text-stone-100">
      <Header />

      {!authed ? (
        <Login onLogin={() => setAuthed(true)} />
      ) : (
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Painel administrativo</h1>
              <p className="mt-1 text-stone-400">
                Gerencie agendamentos, funcionários, serviços e clientes.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="rounded-full border border-stone-700 px-4 py-2 text-sm font-medium text-stone-300 transition hover:border-stone-500 hover:text-white"
              >
                Ver site
              </Link>
              <button
                onClick={logout}
                className="rounded-full border border-stone-700 px-4 py-2 text-sm font-medium text-stone-300 transition hover:border-red-500/40 hover:text-red-400"
              >
                Sair
              </button>
            </div>
          </div>

          <div className="mb-8 flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  tab === t.id
                    ? "bg-amber-500 text-stone-900"
                    : "border border-stone-700 text-stone-300 hover:border-stone-500"
                }`}
              >
                <span className="mr-1.5">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {tab === "overview" && <Dashboard />}
          {tab === "appointments" && <AppointmentsManager />}
          {tab === "barbers" && <BarbersManager />}
          {tab === "services" && <ServicesManager />}
          {tab === "clients" && <ClientsManager />}
        </main>
      )}
    </div>
  );
}