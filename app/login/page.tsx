"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

interface LoginResponse {
  client?: { name: string; phone: string };
  error?: string;
}

export default function Login() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data: LoginResponse = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        return;
      }
      if (!data.client) return;
      localStorage.setItem("client_auth", JSON.stringify(data.client));
      window.dispatchEvent(new Event("auth-change"));
      router.push("/minha-conta");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-stone-950 text-stone-100">
      <Header />

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-12">
        <div className="rounded-3xl border border-stone-800 bg-stone-900 p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-3xl">
              🔑
            </div>
            <h1 className="mt-4 text-2xl font-bold">Entrar</h1>
            <p className="mt-1 text-sm text-stone-400">
              Acesse sua conta para ver seus agendamentos.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-300">
                Telefone ou e-mail
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoFocus
                required
                placeholder="(11) 99999-9999 ou voce@email.com"
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
                placeholder="••••••••"
                className="w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3 text-sm text-white placeholder-stone-600 outline-none transition focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !identifier || !password}
              className="w-full rounded-full bg-amber-500 py-3 font-semibold text-stone-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-6 border-t border-stone-800 pt-5 text-center">
            <p className="text-sm text-stone-400">
              Ainda não tem conta?{" "}
              <Link
                href="/cadastro"
                className="font-medium text-amber-500 hover:text-amber-400"
              >
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}