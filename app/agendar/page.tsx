'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { formatPrice, getAvailableDates, formatDate, maskPhone } from "@/lib/utils";
import { TimeSlot, Service, Barber } from "@/lib/types";

const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5561981494548";

type Step = "service" | "barber" | "datetime" | "confirm";

interface FormState {
  service?: Service;
  barber?: Barber;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
}

export default function Agendar() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("service");
  const [form, setForm] = useState<FormState>({
    date: "",
    time: "",
    clientName: "",
    clientPhone: "",
  });
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/services").then((r) => r.json()),
      fetch("/api/barbers").then((r) => r.json()),
    ])
      .then(([servicesData, barbersData]) => {
        setServices(servicesData.services ?? []);
        setBarbers(barbersData.barbers ?? []);
      })
      .catch(() => {
        setError("Não foi possível carregar os dados da barbearia.");
      })
      .finally(() => setLoadingData(false));
  }, []);

  const dates = getAvailableDates();

  const selectService = (service: Service) => {
    setForm((f) => ({ ...f, service, time: "" }));
    setStep("barber");
  };

  const selectBarber = (barber: Barber) => {
    setForm((f) => ({ ...f, barber, time: "" }));
    setStep("datetime");
    setSlots([]);
  };

  const loadSlots = async (date: string) => {
    if (!form.service || !form.barber) return;
    setLoadingSlots(true);
    setError("");
    setForm((f) => ({ ...f, date, time: "" }));
    try {
      const res = await fetch(
        `/api/appointments?date=${date}&barberId=${form.barber.id}&serviceId=${form.service.id}`
      );
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const submit = async () => {
    if (!form.service || !form.barber) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: form.clientName,
          clientPhone: form.clientPhone,
          serviceId: form.service.id,
          barberId: form.barber.id,
          date: form.date,
          time: form.time,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível concluir o agendamento.");
        return;
      }
      const dataFormatada = new Date(form.date + "T12:00:00").toLocaleDateString(
        "pt-BR",
        { day: "2-digit", month: "2-digit", year: "numeric" }
      );
      const mensagem = encodeURIComponent(
        `Olá! Acabei de confirmar meu agendamento na Barbearia Nobre:\n` +
          `Cliente: ${form.clientName}\n` +
          `Serviço: ${form.service.name}\n` +
          `Data: ${dataFormatada} às ${form.time}\n\n` +
          `Aguardo a confirmação. Obrigado!`
      );
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${mensagem}`, "_blank");
      router.push(
        `/confirmacao?id=${data.appointment.id}&nome=${encodeURIComponent(
          form.clientName
        )}`
      );
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const steps = ["Serviço", "Barbeiro", "Data e Hora", "Confirmar"];
  const currentIndex = ["service", "barber", "datetime", "confirm"].indexOf(step);

  return (
    <div className="flex flex-1 flex-col bg-stone-950 text-stone-100 min-h-screen">
      <Header />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Fazer agendamento</h1>
          <p className="mt-1 text-stone-400">
            Preencha as etapas abaixo para garantir seu horário.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-2">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
                  i === currentIndex
                    ? "bg-amber-500 text-stone-900"
                    : i < currentIndex
                      ? "bg-green-500/20 text-green-400"
                      : "bg-stone-800 text-stone-400"
                }`}
              >
                <span>{i < currentIndex ? "✓" : i + 1}</span>
                {label}
              </div>
              {i < steps.length - 1 && <div className="h-px w-4 bg-stone-700" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Passo 1: Serviço */}
        {step === "service" && (
          <div>
            {loadingData ? (
              <p className="rounded-xl border border-stone-800 p-6 text-sm text-stone-400">
                Carregando serviços...
              </p>
            ) : services.length === 0 ? (
              <p className="rounded-xl border border-stone-800 p-6 text-sm text-stone-400">
                Nenhum serviço disponível no momento.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => selectService(s)}
                    className="group rounded-2xl border border-stone-800 bg-stone-900 p-6 text-left transition hover:border-amber-500/60 hover:bg-stone-800"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-2xl">
                      {s.icon}
                    </div>
                    <h3 className="mt-3 font-semibold">{s.name}</h3>
                    <p className="mt-1 text-sm text-stone-400">{s.description}</p>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="font-bold text-amber-500">
                        {formatPrice(s.price)}
                      </span>
                      <span className="text-stone-500">{s.duration} min</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Passo 2: Barbeiro */}
        {step === "barber" && (
          <div>
            {loadingData ? (
              <p className="rounded-xl border border-stone-800 p-6 text-sm text-stone-400">
                Carregando funcionários...
              </p>
            ) : barbers.length === 0 ? (
              <p className="rounded-xl border border-stone-800 p-6 text-sm text-stone-400">
                Nenhum funcionário disponível no momento.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {barbers.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => selectBarber(b)}
                    disabled={!b.available}
                    className="group rounded-2xl border border-stone-800 bg-stone-900 p-6 text-left transition hover:border-amber-500/60 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-stone-900">
                        {b.avatar}
                      </div>
                      <div>
                        <h3 className="font-semibold">{b.name}</h3>
                        <p className="text-sm text-stone-400">{b.specialty}</p>
                      </div>
                    </div>
                    {b.available ? (
                      <span className="mt-4 inline-block rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                        ● Disponível
                      </span>
                    ) : (
                      <span className="mt-4 inline-block rounded-full bg-stone-700 px-3 py-1 text-xs font-medium text-stone-400">
                        ● Indisponível
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Passo 3: Data e Hora */}
        {step === "datetime" && (
          <>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="mb-3 text-lg font-semibold">Escolha a data</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {dates.map((d) => (
                  <button
                    key={d}
                    onClick={() => loadSlots(d)}
                    className={`rounded-xl border px-3 py-3 text-sm transition ${
                      form.date === d
                        ? "border-amber-500 bg-amber-500/10 text-amber-500"
                        : "border-stone-800 bg-stone-900 text-stone-300 hover:border-stone-600"
                    }`}
                  >
                    <span className="block font-medium">
                      {new Date(d + "T12:00:00")
                        .toLocaleDateString("pt-BR", { weekday: "short" })
                        .replace(".", "")}
                    </span>
                    <span className="block text-xs opacity-70">
                      {new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold">Escolha o horário</h2>
              {!form.date ? (
                <p className="rounded-xl border border-dashed border-stone-800 p-6 text-sm text-stone-500">
                  Selecione uma data para ver os horários disponíveis.
                </p>
              ) : loadingSlots ? (
                <p className="rounded-xl border border-stone-800 p-6 text-sm text-stone-400">
                  Carregando horários...
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((s) => (
                    <button
                      key={s.time}
                      disabled={!s.available}
                      onClick={() => setForm((f) => ({ ...f, time: s.time }))}
                      className={`rounded-xl border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-30 ${
                        form.time === s.time
                          ? "border-amber-500 bg-amber-500 text-stone-900"
                          : "border-stone-800 bg-stone-900 text-stone-300 hover:border-stone-600"
                      }`}
                    >
                      {s.time}
                    </button>
                  ))}
                  {slots.every((s) => !s.available) && (
                    <p className="col-span-full rounded-xl border border-stone-800 p-6 text-sm text-stone-500">
                      Nenhum horário disponível nesta data. Escolha outra.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between gap-4">
            <p className="text-sm text-stone-500">
              Selecione data e horário para continuar.
            </p>
            <button
              onClick={() => setStep("confirm")}
              disabled={!form.time}
              className="rounded-full bg-amber-500 px-8 py-3 font-semibold text-stone-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continuar →
            </button>
          </div>
          </>
        )}

        {/* Passo 4: Confirmar */}
        {step === "confirm" && form.service && form.barber && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-stone-800 bg-stone-900 p-6">
              <h2 className="mb-4 text-lg font-semibold">Resumo</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone-400">Serviço</dt>
                  <dd className="font-medium">
                    {form.service.icon} {form.service.name}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-400">Valor</dt>
                  <dd className="font-bold text-amber-500">
                    {formatPrice(form.service.price)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-400">Duração</dt>
                  <dd className="font-medium">{form.service.duration} min</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-400">Barbeiro</dt>
                  <dd className="font-medium">{form.barber.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-400">Data</dt>
                  <dd className="font-medium capitalize">{formatDate(form.date)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-400">Horário</dt>
                  <dd className="font-bold text-amber-500">{form.time}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-stone-800 bg-stone-900 p-6">
              <h2 className="mb-4 text-lg font-semibold">Seus dados</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-300">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    value={form.clientName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, clientName: e.target.value }))
                    }
                    placeholder="Ex: João da Silva"
                    className="w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3 text-sm text-white placeholder-stone-600 outline-none transition focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-300">
                    Telefone/WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={form.clientPhone}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        clientPhone: maskPhone(e.target.value),
                      }))
                    }
                    placeholder="Ex: (11) 99999-9999"
                    className="w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3 text-sm text-white placeholder-stone-600 outline-none transition focus:border-amber-500"
                  />
                  <p className="mt-2 text-xs text-stone-500">
                    Ao agendar, seu cadastro é criado automaticamente na
                    barbearia.
                  </p>
                </div>
                <button
                  onClick={submit}
                  disabled={loading || !form.clientName || !form.clientPhone || !form.time}
                  className="w-full rounded-full bg-amber-500 py-3 font-semibold text-stone-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? "Confirmando..." : "Confirmar agendamento"}
                </button>
              </div>
            </div>
          </div>
        )}

        {step !== "service" && (
          <button
            onClick={() => {
              const order: Step[] = ["service", "barber", "datetime", "confirm"];
              setStep(order[Math.max(0, order.indexOf(step) - 1)]);
            }}
            className="mt-8 text-sm font-medium text-stone-400 transition hover:text-white"
          >
            ← Voltar
          </button>
        )}
      </main>
    </div>
  );
}