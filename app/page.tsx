import Link from "next/link";
import Header from "@/components/Header";
import { getDb } from "@/lib/db";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function Home() {
  const db = getDb();
  const services = db.services;
  const barbers = db.barbers.filter((b) => b.id !== "any");
  return (
    <div className="relative flex min-h-screen flex-1 flex-col text-stone-100">
      <div
        className="pointer-events-none fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/barber.jpg')" }}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 -z-10 bg-stone-950/75 backdrop-blur-[2px]"
        aria-hidden="true"
      />
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-stone-800">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2 md:items-center md:py-32">
            <div>
              <p className="mb-4 inline-block rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-500">
                Corte, barba e estilo
              </p>
              <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
                Agende seu horário{" "}
                <span className="text-amber-500">sem fila</span> e no seu
                tempo
              </h1>
              <p className="mt-6 max-w-lg text-lg text-stone-400">
                Escolha o serviço, o barbeiro e o horário ideal para você. Simples,
                rápido e tudo online.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/agendar"
                  className="rounded-full bg-amber-500 px-6 py-3 font-semibold text-stone-900 transition hover:bg-amber-400"
                >
                  Agendar agora
                </Link>
                <Link
                  href="/admin"
                  className="rounded-full border border-stone-700 px-6 py-3 font-semibold text-stone-300 transition hover:border-stone-500 hover:text-white"
                >
                  Painel da barbearia
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl border border-stone-800 bg-stone-900 p-8 shadow-2xl shadow-amber-500/5">
                <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                  <span className="text-sm font-medium text-stone-400">
                    Próximo horário livre
                  </span>
                  <span className="rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-400">
                    ● Aberto agora
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 py-6">
                  {services.slice(0, 3).map((s) => (
                    <div
                      key={s.id}
                      className="rounded-2xl border border-stone-800 bg-stone-950 p-4 text-center"
                    >
                      <div className="text-2xl">{s.icon}</div>
                      <p className="mt-2 text-sm font-medium">{s.name}</p>
                      <p className="mt-1 text-xs text-amber-500">
                        a partir de {formatPrice(s.price)}
                      </p>
                    </div>
                  ))}
                </div>
                <Link
                  href="/agendar"
                  className="flex items-center justify-center rounded-full bg-stone-800 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
                >
                  Ver todos os serviços →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-3xl font-bold md:text-4xl">
            Nossos serviços
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-stone-400">
            Preços acessíveis e acabamento de alta qualidade.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-stone-800 bg-stone-900 p-6 transition hover:border-amber-500/50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-2xl">
                  {s.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.name}</h3>
                <p className="mt-1 text-sm text-stone-400">{s.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-amber-500">
                    {formatPrice(s.price)}
                  </span>
                  <span className="text-sm text-stone-500">{s.duration} min</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-stone-800 bg-stone-900/50">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="text-center text-3xl font-bold md:text-4xl">
              Nossos barbeiros
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-center text-stone-400">
              Equipe experiente pronta para cuidar do seu visual.
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {barbers
                .map((b) => (
                  <div
                    key={b.id}
                    className="rounded-2xl border border-stone-800 bg-stone-950 p-6 text-center transition hover:border-amber-500/50"
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-xl font-bold text-stone-900">
                      {b.avatar}
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{b.name}</h3>
                    <p className="mt-1 text-sm text-stone-400">{b.specialty}</p>
                    <span className="mt-3 inline-block rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                      ● Disponível
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-stone-900 to-stone-950 p-10 text-center md:p-16">
            <h2 className="text-3xl font-bold md:text-4xl">
              Pronto para o novo visual?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-stone-400">
              Garanta seu horário online em menos de um minuto.
            </p>
            <Link
              href="/agendar"
              className="mt-8 inline-block rounded-full bg-amber-500 px-8 py-3 text-lg font-semibold text-stone-900 transition hover:bg-amber-400"
            >
              Fazer agendamento →
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-800 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-sm text-stone-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Barbearia Nobre</p>
          <p>Segunda a Sábado · 09h às 19h</p>
        </div>
      </footer>
    </div>
  );
}