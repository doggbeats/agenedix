"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { maskPhone } from "@/lib/utils";

interface CadastroResponse {
  client?: { name: string; phone: string };
  exists?: boolean;
  error?: string;
}

export default function Cadastro() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ name: string; exists: boolean } | null>(
    null
  );
  const [notify, setNotify] = useState(false);

  const closeNotify = () => setNotify(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(null);

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, password }),
      });
      const data: CadastroResponse = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível realizar o cadastro.");
        return;
      }
      setSuccess({ name: data.client?.name ?? name, exists: !!data.exists });
      setNotify(true);
      window.setTimeout(() => setNotify(false), 10000);
      if (data.client?.phone) {
        localStorage.setItem(
          "client_auth",
          JSON.stringify({ name: data.client.name, phone: data.client.phone })
        );
        window.dispatchEvent(new Event("auth-change"));
      }
      setName("");
      setPhone("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-stone-950 text-stone-100">
      <Header />

      {notify && (
        <div
          role="status"
          className="fixed top-4 right-4 z-100 w-80 rounded-2xl border border-green-500/40 bg-stone-900 p-5 shadow-2xl shadow-black/50"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-xl">
              ✅
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white">Cadastro confirmado</p>
              <p className="mt-1 text-sm text-stone-400">
                {success?.exists
                  ? "Seus dados foram atualizados. Você já pode agendar seu horário."
                  : "Agora você pode agendar seu horário na barbearia."}
              </p>
            </div>
            <button
              onClick={closeNotify}
              aria-label="Fechar notificação"
              className="text-stone-500 transition hover:text-white"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <Link
            href="/agendar"
            className="mt-4 flex items-center justify-center rounded-full bg-amber-500 py-2.5 text-sm font-semibold text-stone-900 transition hover:bg-amber-400"
          >
            Agendar horário agora
          </Link>
        </div>
      )}

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-12">
        <div className="rounded-3xl border border-stone-800 bg-stone-900 p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-3xl">
              👤
            </div>
            <h1 className="mt-4 text-2xl font-bold">Cadastro de cliente</h1>
            <p className="mt-1 text-sm text-stone-400">
              Cadastre-se para agendar mais rápido nas próximas vezes.
            </p>
          </div>

          {success && (
            <div className="mb-6 rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              {success.exists
                ? "Este telefone já estava cadastrado. Seus dados foram atualizados."
                : "Cadastro realizado com sucesso!"}{" "}
              Bem-vindo, {success.name}.
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-300">
                Nome completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ex: João da Silva"
                className="w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3 text-sm text-white placeholder-stone-600 outline-none transition focus:border-amber-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-stone-300">
                Telefone / WhatsApp
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                required
                placeholder="(11) 99999-9999"
                className="w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3 text-sm text-white placeholder-stone-600 outline-none transition focus:border-amber-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-stone-300">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                className="w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3 text-sm text-white placeholder-stone-600 outline-none transition focus:border-amber-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-stone-300">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo de 6 caracteres"
                className="w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3 text-sm text-white placeholder-stone-600 outline-none transition focus:border-amber-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-stone-300">
                Confirmar senha
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Digite a senha novamente"
                className="w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3 text-sm text-white placeholder-stone-600 outline-none transition focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-amber-500 py-3 font-semibold text-stone-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Cadastrando..." : "Cadastrar"}
            </button>
          </form>

          <div className="mt-6 border-t border-stone-800 pt-5 text-center">
            <p className="text-sm text-stone-400">
              Prefere agendar direto?{" "}
              <Link
                href="/agendar"
                className="font-medium text-amber-500 hover:text-amber-400"
              >
                Fazer agendamento sem cadastro
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}