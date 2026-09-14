"use client";

import { useEffect, useState } from "react";
import { Client } from "@/lib/types";

export default function ClientsManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => setClients(data.clients ?? []))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (client: Client) => {
    if (!confirm(`Remover o cliente ${client.name}?`)) return;
    await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
    setClients((prev) => prev.filter((c) => c.id !== client.id));
  };

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  if (loading) {
    return <p className="text-sm text-stone-400">Carregando clientes...</p>;
  }

  return (
    <div>
      <div className="mb-6 max-w-sm">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-white placeholder-stone-600 outline-none focus:border-amber-500"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-800 p-8 text-center text-sm text-stone-500">
          Nenhum cliente cadastrado.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-800">
          <table className="w-full min-w-150 text-left text-sm">
            <thead className="border-b border-stone-800 bg-stone-900 text-stone-400">
              <tr>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Cadastro</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-stone-400">{c.phone}</td>
                  <td className="px-4 py-3 text-stone-400">{c.email || "—"}</td>
                  <td className="px-4 py-3 text-stone-500">
                    {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => remove(c)}
                        className="rounded-lg border border-stone-700 px-3 py-1.5 text-xs font-medium text-stone-400 transition hover:border-red-500/40 hover:text-red-400"
                      >
                        Remover
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}