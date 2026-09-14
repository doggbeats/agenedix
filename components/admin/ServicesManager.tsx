"use client";

import { useEffect, useState } from "react";
import { Service } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  duration: "",
  icon: "💈",
};

const iconOptions = ["💈", "✂️", "💇", "🪒", "🔥", "👁️", "👦", "🧔", "✨"];

export default function ServicesManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    const res = await fetch("/api/services");
    const data = await res.json();
    setServices(data.services ?? []);
  };

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => {
        setServices(data.services ?? []);
        setLoading(false);
      });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const url = editingId ? `/api/services/${editingId}` : "/api/services";
    const method = editingId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        price: form.price,
        duration: form.duration,
        icon: form.icon,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erro ao salvar serviço.");
      setSaving(false);
      return;
    }

    setForm(emptyForm);
    setEditingId("");
    setSaving(false);
    refresh();
  };

  const startEdit = (service: Service) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description,
      price: String(service.price),
      duration: String(service.duration),
      icon: service.icon,
    });
    setError("");
  };

  const remove = async (service: Service) => {
    if (!confirm(`Remover o serviço ${service.name}?`)) return;
    await fetch(`/api/services/${service.id}`, { method: "DELETE" });
    refresh();
  };

  if (loading) {
    return <p className="text-sm text-stone-400">Carregando serviços...</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="overflow-hidden rounded-2xl border border-stone-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-800 bg-stone-900 text-stone-400">
              <tr>
                <th className="px-4 py-3 font-medium">Serviço</th>
                <th className="px-4 py-3 font-medium">Preço</th>
                <th className="px-4 py-3 font-medium">Duração</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {services.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-lg">
                        {s.icon}
                      </div>
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="max-w-60 truncate text-xs text-stone-500">
                          {s.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-amber-500">
                    {formatPrice(s.price)}
                  </td>
                  <td className="px-4 py-3 text-stone-400">{s.duration} min</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => startEdit(s)}
                        className="rounded-lg border border-stone-700 px-3 py-1.5 text-xs font-medium text-stone-300 transition hover:border-stone-500 hover:text-white"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => remove(s)}
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
      </div>

      <div className="lg:col-span-2">
        <form
          onSubmit={submit}
          className="rounded-2xl border border-stone-800 bg-stone-900 p-6"
        >
          <h3 className="mb-4 font-semibold">
            {editingId ? "Editar serviço" : "Novo serviço"}
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
                placeholder="Ex: Corte na tesoura"
                className="w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3 text-sm text-white placeholder-stone-600 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-300">
                Descrição
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
                placeholder="Breve descrição do serviço"
                className="w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3 text-sm text-white placeholder-stone-600 outline-none focus:border-amber-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-300">
                  Preço (R$) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                  required
                  placeholder="45"
                  className="w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3 text-sm text-white placeholder-stone-600 outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-300">
                  Duração (min) *
                </label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={form.duration}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, duration: e.target.value }))
                  }
                  required
                  placeholder="30"
                  className="w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3 text-sm text-white placeholder-stone-600 outline-none focus:border-amber-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-300">
                Ícone
              </label>
              <div className="flex flex-wrap gap-2">
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, icon }))}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg transition ${
                      form.icon === icon
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-stone-700 hover:border-stone-500"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving || !form.name || !form.price || !form.duration}
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