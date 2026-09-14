"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

function LoginIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function GearIcon() {
  return (
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
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const getClientSession = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("client_auth");
    return raw ? (JSON.parse(raw) as { name: string } | null) : null;
  } catch {
    return null;
  }
};

const getAuthSnapshot = () => JSON.stringify(getClientSession());

function subscribeToAuth(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("auth-change", callback);
  window.addEventListener("admin-auth-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("auth-change", callback);
    window.removeEventListener("admin-auth-change", callback);
  };
}

export default function Header() {
  const clientSnapshot = useSyncExternalStore(
    subscribeToAuth,
    getAuthSnapshot,
    () => "null"
  );
  const router = useRouter();

  const client = clientSnapshot === "null" ? null : JSON.parse(clientSnapshot);

  const handleLogout = () => {
    localStorage.removeItem("client_auth");
    localStorage.removeItem("admin_auth");
    window.dispatchEvent(new Event("auth-change"));
    window.dispatchEvent(new Event("admin-auth-change"));
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-stone-800 bg-stone-900/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-lg font-bold text-stone-900">
            ✂
          </span>
          <span className="text-lg font-bold tracking-wide text-white">
            Barbearia <span className="text-amber-500">Nobre</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {client ? (
            <Link
              href="/minha-conta"
              title="Minha conta"
              aria-label="Minha conta"
              className="flex items-center gap-2 rounded-full border border-amber-500/50 px-3 py-2 text-sm font-medium text-amber-500 transition hover:bg-amber-500/10"
            >
              <UserIcon />
              <span className="hidden md:inline">{client.name.split(" ")[0]}</span>
            </Link>
          ) : (
            <Link
              href="/cadastro"
              title="Cadastre-se"
              aria-label="Cadastre-se"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-stone-300 transition hover:text-white"
            >
              <UserIcon />
              <span className="hidden sm:inline">Cadastre-se</span>
            </Link>
          )}
          <Link
            href="/"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-stone-300 transition hover:text-white sm:block"
          >
            Início
          </Link>

          <Link
            href="/admin"
            title="Painel administrativo"
            aria-label="Painel administrativo"
            className="flex items-center rounded-full border border-stone-700 p-2.5 text-stone-300 transition hover:border-amber-500/60 hover:text-amber-500"
          >
            <GearIcon />
          </Link>

          {client ? (
            <button
              onClick={handleLogout}
              title="Sair"
              aria-label="Sair"
              className="flex items-center gap-2 rounded-full border border-stone-700 px-3 py-2 text-sm font-medium text-stone-300 transition hover:border-red-500/50 hover:text-red-400"
            >
              <LogoutIcon />
              <span className="hidden md:inline">Sair</span>
            </button>
          ) : (
            <Link
              href="/login"
              title="Entrar"
              aria-label="Entrar"
              className="flex items-center gap-2 rounded-full border border-stone-700 px-3 py-2 text-sm font-medium text-stone-300 transition hover:border-amber-500/60 hover:text-amber-500"
            >
              <LoginIcon />
              <span className="hidden md:inline">Login</span>
            </Link>
          )}

          <Link
            href="/agendar"
            className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-stone-900 transition hover:bg-amber-400"
          >
            Agendar
          </Link>
        </div>
      </nav>
    </header>
  );
}