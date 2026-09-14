"use client";

import { useEffect, useState } from "react";
import { Barber } from "@/lib/types";

const emptyForm = { name: "", specialty: "", avatar: "" };

export default function BarbersManager() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    const res = await fetch("/api/barbers");
    const data = await res.json();
    setBarbers(data.barbers ?? []);
  };

  useEffect(() => {
    fetch("/api/barbers")
      .then((r) => r.json())
      .then((data) => {
        setBarbers(data.barbers ?? []);
        setLoading(false);
      });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const url = editingId ? `/api/barbers/${editingId}` : "/api/barbers";
    const method = editingId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erro ao salvar funcionário.");
      setSaving(false);
      return;
    }

    setForm(emptyForm);
    setEditingId("");
    setSaving(false);
    refresh();
  };

  const startEdit = (barber: Barber) => {
    setEditingId(barber.id);
    setForm({
      name: barber.name,
      specialty: barber.specialty,
      avatar: barber.avatar,
    });
    setError("");
  };

  const toggleAvailable = async (barber: Barber) => {
    await fetch(`/api/barbers/${barber.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !barber.available }),
    });
    refresh();
  };

  const remove = async (barber: Barber) => {
    if (barber.id === "any") return;
    if (!confirm(`Remover ${barber.name}?`)) return;
    await fetch(`/api/barbers/${barber.id}`, { method: "DELETE" });
    refresh();
  };

  if (loading) {
    return <p className="text-sm text-stone-400">Carregando funcionários...</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="overflow-hidden rounded-2xl border border-stone-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-800 bg-stone-900 text-stone-400">
              <tr>
                <th className="px-4 py-3 font-medium">Funcionário</th>
                <th className="px-4 py-3 font-medium">Especialidade</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {barbers.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-stone-900">
                        {b.avatar}
                      </div>
                      <div>
                        <p className="font-medium">{b.name}</p>
                        {b.id === "any" && (
                          <p className="text-xs text-stone-500">
                            Barbeiro padrão
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-400">{b.specialty}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleAvailable(b)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        b.available
                          ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                          : "bg-stone-700 text-stone-400 hover:bg-stone-600"
                      }`}
                    >
                      {b.available ? "● Disponível" : "○ Indisponível"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => startEdit(b)}
                        className="rounded-lg border border-stone-700 px-3 py-1.5 text-xs font-medium text-stone-300 transition hover:border-stone-500 hover:text-white"
                      >
                        Editar
                      </button>
                      {b.id !== "any" && (
                        <button
                          onClick={() => remove(b)}
                          className="rounded-lg border border-stone-700 px-3 py-1.5 text-xs font-medium text-stone-400 transition hover:border-red-500/40 hover:text-red-400"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lg:col-span-2">
        <form
          onSubmit={submit}
          className="rounded-2xl border border-stone-800 bg-stone-900 p-6"
        >
          <h3 className="mb-4 font-semibold">
            {editingId ? "Editar funcionário" : "Novo funcionário"}
          </h3>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-300">
                Nome *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="Ex: João Pereira"
                className="w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3 text-sm text-white placeholder-stone-600 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-300">
                Especialidade
              </label>
              <input
                type="text"
                value={form.specialty}
                onChange={(e) =>
                  setForm((f) => ({ ...f, specialty: e.target.value }))
                }
                placeholder="Ex: Cortes, barbas, degradê..."
                className="w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3 text-sm text-white placeholder-stone-600 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-300">
                Iniciais do avatar
              </label>
              <input
                type="text"
                value={form.avatar}
                onChange={(e) =>
                  setForm((f) => ({ ...f, avatar: e.target.value.slice(0, 3) }))
                }
                placeholder="Ex: JP"
                className="w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3 text-sm text-white placeholder-stone-600 outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving || !form.name}
                className="flex-1 rounded-full bg-amber-500 py-3 font-semibold text-stone-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving
                  ? "Salvando..."
                  : editingId
                    ? "Salvar alterações"
                    : "Cadastrar"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId("");
                    setForm(emptyForm);
                    setError("");
                  }}
                  className="rounded-full border border-stone-700 px-5 py-3 font-medium text-stone-300 transition hover:border-stone-500"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}