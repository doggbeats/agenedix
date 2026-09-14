"use client";

import { useState } from "react";

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        localStorage.setItem("admin_auth", "1");
        window.dispatchEvent(new Event("admin-auth-change"));
        onLogin();
      } else {
        setError("Usuário ou senha incorretos.");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-3xl border border-stone-800 bg-stone-900 p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-3xl">
            🔐
          </div>
          <h1 className="mt-4 text-2xl font-bold">Painel administrativo</h1>
          <p className="mt-1 text-sm text-stone-400">
            Acesso restrito à equipe.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-300">
              Usuário
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              placeholder="dogg90"
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
              placeholder="••••••••"
              className="w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3 text-sm text-white placeholder-stone-600 outline-none transition focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full rounded-full bg-amber-500 py-3 font-semibold text-stone-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-stone-600">
          Credenciais padrão: <code className="text-stone-500">dogg90</code> /{" "}
          <code className="text-stone-500">4dmin.90</code>
        </p>
      </div>
    </div>
  );
}