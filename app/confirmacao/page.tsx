import Link from "next/link";
import Header from "@/components/Header";
import { findBarber, findService, getDb } from "@/lib/db";
import { formatPrice, formatDate } from "@/lib/utils";
import { Appointment } from "@/lib/types";

export const dynamic = "force-dynamic";

const barbershopWhatsApp =
  process.env.WHATSAPP_NUMBER ?? "5561981494548";

export default async function Confirmacao(props: PageProps<"/confirmacao">) {
  const searchParams = await props.searchParams;
  const id = typeof searchParams.id === "string" ? searchParams.id : "";
  const nomeFallback =
    typeof searchParams.nome === "string" ? searchParams.nome : "cliente";

  const db = getDb();

  let appointment: Appointment | null = null;

  if (id) {
    appointment = db.appointments.find((a) => a.id === id) ?? null;
  }

  const service = appointment ? findService(db, appointment.serviceId) : undefined;
  const barber = appointment ? findBarber(db, appointment.barberId) : undefined;
  const clienteNome = appointment?.clientName ?? nomeFallback;

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-stone-950 text-stone-100">
      <Header />

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-16">
        <div className="rounded-3xl border border-green-500/30 bg-stone-900 p-8 text-center md:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="mt-5 text-2xl font-bold md:text-3xl">
            Agendamento confirmado!
          </h1>
          <p className="mt-2 text-stone-400">
            {clienteNome}, seu horário está reservado. Enviaremos uma confirmação
            por WhatsApp.
          </p>

          <div className="mt-8 rounded-2xl border border-stone-800 bg-stone-950 p-6 text-left">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-400">Serviço</dt>
                <dd className="font-medium">
                  {service ? `${service.icon} ${service.name}` : "-"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-400">Valor</dt>
                <dd className="font-bold text-amber-500">
                  {service ? formatPrice(service.price) : "-"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-400">Barbeiro</dt>
                <dd className="font-medium">{barber?.name ?? "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-400">Data</dt>
                <dd className="font-medium capitalize">
                  {appointment ? formatDate(appointment.date) : "-"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-400">Horário</dt>
                <dd className="font-bold text-amber-500">
                  {appointment?.time ?? "-"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <a
              href={`https://wa.me/${barbershopWhatsApp}?text=${encodeURIComponent(
                `Olá! Acabei de agendar um horário na Barbearia Nobre. Agendamento: ${service?.name ?? ""} às ${appointment?.time ?? ""}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-green-600 py-3 font-semibold text-white transition hover:bg-green-500"
            >
              Confirmar pelo WhatsApp
            </a>
            <Link
              href="/"
              className="rounded-full border border-stone-700 py-3 font-semibold text-stone-300 transition hover:border-stone-500 hover:text-white"
            >
              Voltar ao início
            </Link>
          </div>

          {appointment && (
            <p className="mt-6 text-xs text-stone-600">
              Protocolo: {appointment.id}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}