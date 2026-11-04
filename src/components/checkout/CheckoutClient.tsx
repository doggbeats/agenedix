"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  CreditCard,
  Loader2,
  Lock,
  MessageCircle,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Alert, inputClass, labelClass } from "@/components/ui";
import {
  confirmPlanChangeAction,
  devActivateTrialAction,
  startCardTrialAction,
  startPixPaymentAction,
  type CheckoutState,
} from "@/lib/actions/checkout";
import { CardTokenError, tokenizeCard } from "@/lib/payments/pagarme-client";
import { formatCurrency, onlyDigits } from "@/lib/format";
import {
  buildWhatsAppLink,
  subscriptionRequestMessage,
  type PaymentPreference,
} from "@/lib/whatsapp";

export type CheckoutPlan = {
  slug: string;
  name: string;
  description: string;
  priceMonthly: number;
  trialDays: number;
  highlight: boolean;
  maxProfessionals: number;
  maxServices: number;
};

export type PixData = {
  paymentId: string;
  qrCode: string;
  qrCodeUrl: string | null;
  expiresAt: string | null;
  amount: number;
};

type Method = "whatsapp" | "card" | "pix";

const whatsappPreferences = [
  { value: "card", label: "Cartão" },
  { value: "pix", label: "Pix" },
  { value: "undecided", label: "A combinar" },
] as const satisfies ReadonlyArray<{ value: PaymentPreference; label: string }>;

const initialState: CheckoutState = {};

function formatCardNumber(value: string): string {
  return onlyDigits(value)
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string): string {
  const digits = onlyDigits(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatDocument(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function formatCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function CheckoutClient({
  mode,
  plans,
  initialPlanSlug,
  currentPlanSlug,
  establishmentName,
  responsibleName,
  responsibleEmail,
  supportWhatsApp,
  configured,
  publicKey,
  devBypass,
  pendingPix,
}: {
  mode: "start" | "change";
  plans: CheckoutPlan[];
  initialPlanSlug?: string;
  currentPlanSlug: string | null;
  establishmentName: string;
  responsibleName: string;
  responsibleEmail: string;
  supportWhatsApp: string;
  configured: boolean;
  publicKey: string;
  devBypass: boolean;
  pendingPix: PixData | null;
}) {
  const router = useRouter();
  const [planSlug, setPlanSlug] = useState(initialPlanSlug ?? plans[0]?.slug ?? "");
  const [method, setMethod] = useState<Method>(configured ? "card" : "whatsapp");
  const [whatsappPreference, setWhatsappPreference] =
    useState<PaymentPreference>("card");
  const [dismissedPixId, setDismissedPixId] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const [tokenizing, setTokenizing] = useState(false);
  const [copied, setCopied] = useState(false);

  const [billing, setBilling] = useState({
    document: "",
    zipCode: "",
    addressNumber: "",
    city: "",
    state: "",
  });
  const [card, setCard] = useState({
    number: "",
    holderName: "",
    expiry: "",
    cvv: "",
  });

  const [cardState, cardDispatch, cardPending] = useActionState(
    startCardTrialAction,
    initialState,
  );
  const [pixState, pixDispatch, pixPending] = useActionState(
    startPixPaymentAction,
    initialState,
  );
  const [changeState, changeDispatch, changePending] = useActionState(
    confirmPlanChangeAction,
    initialState,
  );
  const [devState, devDispatch, devPending] = useActionState(
    devActivateTrialAction,
    initialState,
  );

  const selectedPlan = plans.find((plan) => plan.slug === planSlug) ?? plans[0];
  const activePix = pixState.pix ?? pendingPix;
  const pix =
    activePix && activePix.paymentId !== dismissedPixId ? activePix : null;

  useEffect(() => {
    if (!pix) return;
    const timer = window.setInterval(() => router.refresh(), 6000);
    return () => window.clearInterval(timer);
  }, [pix, router]);

  const price = selectedPlan?.priceMonthly ?? 0;
  const busy = cardPending || pixPending || tokenizing;
  const state = method === "card" ? cardState : pixState;

  const methodOptions: Array<{
    value: Method;
    label: string;
    icon: typeof CreditCard;
  }> = [
    { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
    ...(configured
      ? ([
          { value: "card", label: "Cartão de crédito", icon: CreditCard },
          { value: "pix", label: "Pix", icon: QrCode },
        ] as const)
      : []),
  ];

  const whatsappPreferenceLabel =
    whatsappPreference === "card"
      ? `Cartão · ${selectedPlan?.trialDays ?? 7} dias de teste`
      : whatsappPreference === "pix"
        ? "Pix · primeiro período à vista"
        : "A combinar com o suporte";

  const whatsappMessage = selectedPlan
    ? subscriptionRequestMessage({
        establishmentName,
        responsibleName,
        responsibleEmail,
        planName: selectedPlan.name,
        monthlyPrice: selectedPlan.priceMonthly,
        trialDays: selectedPlan.trialDays,
        paymentPreference: whatsappPreference,
      })
    : "";
  const whatsappUrl = selectedPlan
    ? buildWhatsAppLink(supportWhatsApp, whatsappMessage)
    : "";

  function updateBilling(field: keyof typeof billing, value: string) {
    setBilling((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlan) return;
    if (method === "whatsapp") return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("planSlug", selectedPlan.slug);
    formData.set("cycle", "MONTHLY");

    if (method === "card") {
      if (!configured) return;
      setCardError(null);
      const [expMonth, expYear] = card.expiry.split("/");
      setTokenizing(true);
      try {
        const token = await tokenizeCard(publicKey, {
          number: card.number,
          holderName: card.holderName,
          expMonth: expMonth ?? "",
          expYear: expYear ?? "",
          cvv: card.cvv,
        });
        formData.set("cardToken", token);
      } catch (error) {
        setCardError(
          error instanceof CardTokenError
            ? error.message
            : "Não foi possível validar o cartão. Tente novamente.",
        );
        setTokenizing(false);
        return;
      }
      setTokenizing(false);
      cardDispatch(formData);
      return;
    }

    setDismissedPixId(null);
    pixDispatch(formData);
  }

  async function copyPix() {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.qrCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-hover">
            {mode === "change" ? "Alterar plano" : "Última etapa"}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {mode === "change" ? "Confirme seu novo plano" : "Ative o AgendamentoON"}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            {mode === "change"
              ? "A troca vale imediatamente e o novo valor entra na próxima renovação."
              : configured
                ? `Escolha como pagar para liberar o painel de ${establishmentName}. Sem fidelidade e com cancelamento a qualquer momento.`
                : `Escolha o plano e conclua a contratação pelo WhatsApp. Sem fidelidade e com cancelamento a qualquer momento.`}
          </p>
        </div>

        {!configured && (
          <div className="mb-5">
            <Alert tone="warning">
              O pagamento online está indisponível neste ambiente. Você pode concluir a
              contratação pelo WhatsApp — o resumo da solicitação já vai pronto.
            </Alert>
          </div>
        )}
        {!selectedPlan && (
          <Alert tone="error">Nenhum plano disponível para contratação.</Alert>
        )}

        <section className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-semibold text-ink">1. Escolha o plano</h2>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {plans.map((plan) => {
              const active = plan.slug === planSlug;
              return (
                <label
                  key={plan.slug}
                  className={`relative flex cursor-pointer flex-col rounded-xl border p-3.5 transition ${
                    active
                      ? "border-brand bg-brand/5 ring-2 ring-brand/30"
                      : "border-line bg-white hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="planSlug"
                    value={plan.slug}
                    checked={active}
                    onChange={() => setPlanSlug(plan.slug)}
                    className="sr-only"
                  />
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">{plan.name}</span>
                    {plan.slug === currentPlanSlug ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                        Atual
                      </span>
                    ) : plan.highlight && !currentPlanSlug ? (
                      <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-hover">
                        Mais escolhido
                      </span>
                    ) : active ? (
                      <Check className="h-4 w-4 text-brand" aria-hidden />
                    ) : null}
                  </span>
                  <span className="mt-1 text-lg font-semibold text-ink">
                    {formatCurrency(plan.priceMonthly)}
                    <span className="text-[11px] font-normal text-slate-500">/mês</span>
                  </span>
                  <span className="mt-0.5 text-[10px] leading-snug text-slate-500">
                    {plan.description}
                  </span>
                </label>
              );
            })}
          </div>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Cobrança mensal · cancele quando quiser
          </p>
        </section>

        {pix ? (
          <section className="mt-5 rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                <QrCode className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-ink">Pague com Pix</h2>
                <p className="text-[11px] text-slate-500">
                  O painel libera automaticamente após a confirmação.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row">
              <div className="mx-auto w-44 shrink-0 overflow-hidden rounded-xl border border-line bg-white p-2">
                {pix.qrCodeUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pix.qrCodeUrl}
                    alt="QR Code do Pix"
                    className="h-40 w-full object-contain"
                  />
                ) : (
                  <span className="grid h-40 w-full place-items-center text-center text-[10px] text-slate-500">
                    Use o código Pix abaixo
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-slate-600">
                  Valor: {formatCurrency(pix.amount || price)}
                </p>
                {pix.expiresAt && (
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Expira em {formatDate(pix.expiresAt)}
                  </p>
                )}
                <textarea
                  readOnly
                  value={pix.qrCode}
                  rows={3}
                  className="mt-2 w-full resize-none rounded-lg border border-line bg-paper px-2.5 py-2 font-mono text-[10px] text-slate-600"
                  onFocus={(event) => event.currentTarget.select()}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={copyPix}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copiado" : "Copiar código"}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.refresh()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-ink"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Já paguei
                  </button>
                  <button
                    type="button"
                    onClick={() => setDismissedPixId(pix.paymentId)}
                    className="rounded-lg px-2 py-2 text-[11px] font-semibold text-slate-500 hover:text-ink"
                  >
                    Gerar nova cobrança
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-slate-400">
                  Esta página atualiza sozinha a cada poucos segundos.
                </p>
              </div>
            </div>
          </section>
        ) : mode === "change" ? (
          <form
            action={changeDispatch}
            className="mt-5 rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5"
          >
            <input type="hidden" name="planSlug" value={planSlug} />
            <input type="hidden" name="cycle" value="MONTHLY" />
            <h2 className="text-sm font-semibold text-ink">2. Confirme a troca</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              O cartão salvo no Pagar.me continua o mesmo. A diferença de valor é ajustada na
              próxima renovação.
            </p>
            {changeState.error && (
              <div className="mt-3">
                <Alert tone="error">{changeState.error}</Alert>
              </div>
            )}
            <button
              type="submit"
              disabled={changePending || !selectedPlan}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {changePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Confirmar novo plano
            </button>
          </form>
        ) : (
          <section className="mt-5 rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-semibold text-ink">2. Forma de pagamento</h2>

            <div
              className={`mt-3 grid gap-2 ${
                methodOptions.length > 1 ? "sm:grid-cols-3" : ""
              }`}
            >
              {methodOptions.map((option) => {
                const Icon = option.icon;
                const active = method === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMethod(option.value)}
                    aria-pressed={active}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition ${
                      active
                        ? "border-brand bg-brand/5 text-ink ring-1 ring-brand/30"
                        : "border-line bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {option.label}
                  </button>
                );
              })}
            </div>

            {method === "whatsapp" ? (
              <div className="mt-4">
                <p className="text-[11px] leading-relaxed text-slate-500">
                  O resumo é montado automaticamente com os dados da sua conta. Ao abrir o
                  WhatsApp, basta confirmar o envio da mensagem.
                </p>

                <div className="mt-3">
                  <p className={labelClass}>Forma de pagamento preferida</p>
                  <div className="grid grid-cols-3 gap-2">
                    {whatsappPreferences.map((option) => {
                      const active = whatsappPreference === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setWhatsappPreference(option.value)}
                          aria-pressed={active}
                          className={`rounded-lg border px-2 py-2 text-[11px] font-semibold transition ${
                            active
                              ? "border-brand bg-brand/5 text-ink ring-1 ring-brand/30"
                              : "border-line bg-white text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-line bg-paper p-3">
                  <p className="text-[11px] font-semibold text-slate-600">
                    Resumo da solicitação
                  </p>
                  <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-[11px] leading-relaxed text-slate-600">
                    {whatsappMessage || "Escolha um plano para gerar o resumo."}
                  </pre>
                </div>

                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Fechar pagamento pelo WhatsApp
                  </a>
                ) : (
                  <div className="mt-4">
                    <Alert tone="warning">
                      O WhatsApp de suporte ainda não está configurado. Cadastre o número para
                      liberar esta opção.
                    </Alert>
                  </div>
                )}

                {!configured && (
                  <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                    O pagamento online está indisponível neste ambiente; a contratação é
                    concluída manualmente pelo suporte.
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {method === "card" && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className={labelClass} htmlFor="card-number">
                        Número do cartão
                      </label>
                      <input
                        id="card-number"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        required
                        value={card.number}
                        onChange={(event) =>
                          setCard((current) => ({
                            ...current,
                            number: formatCardNumber(event.target.value),
                          }))
                        }
                        placeholder="0000 0000 0000 0000"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="card-holder">
                        Nome impresso no cartão
                      </label>
                      <input
                        id="card-holder"
                        autoComplete="cc-name"
                        required
                        value={card.holderName}
                        onChange={(event) =>
                          setCard((current) => ({ ...current, holderName: event.target.value }))
                        }
                        placeholder="Como está no cartão"
                        className={inputClass}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass} htmlFor="card-expiry">
                          Validade
                        </label>
                        <input
                          id="card-expiry"
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          required
                          value={card.expiry}
                          onChange={(event) =>
                            setCard((current) => ({
                              ...current,
                              expiry: formatExpiry(event.target.value),
                            }))
                          }
                          placeholder="MM/AA"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor="card-cvv">
                          CVV
                        </label>
                        <input
                          id="card-cvv"
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          required
                          value={card.cvv}
                          onChange={(event) =>
                            setCard((current) => ({
                              ...current,
                              cvv: onlyDigits(event.target.value).slice(0, 4),
                            }))
                          }
                          placeholder="123"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="billing-document">
                      CPF ou CNPJ do titular
                    </label>
                    <input
                      id="billing-document"
                      name="document"
                      inputMode="numeric"
                      required
                      value={billing.document}
                      onChange={(event) =>
                        updateBilling("document", formatDocument(event.target.value))
                      }
                      placeholder="000.000.000-00"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="billing-zip">
                      CEP
                    </label>
                    <input
                      id="billing-zip"
                      name="zipCode"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      required
                      value={billing.zipCode}
                      onChange={(event) => updateBilling("zipCode", formatCep(event.target.value))}
                      placeholder="00000-000"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="billing-number">
                      Número
                    </label>
                    <input
                      id="billing-number"
                      name="addressNumber"
                      required
                      value={billing.addressNumber}
                      onChange={(event) => updateBilling("addressNumber", event.target.value)}
                      placeholder="123"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="billing-city">
                      Cidade
                    </label>
                    <input
                      id="billing-city"
                      name="city"
                      autoComplete="address-level2"
                      required
                      value={billing.city}
                      onChange={(event) => updateBilling("city", event.target.value)}
                      placeholder="São Paulo"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="billing-state">
                      UF
                    </label>
                    <input
                      id="billing-state"
                      name="state"
                      autoComplete="address-level1"
                      required
                      maxLength={2}
                      value={billing.state}
                      onChange={(event) =>
                        updateBilling("state", event.target.value.toUpperCase().replace(/[^A-Z]/g, ""))
                      }
                      placeholder="SP"
                      className={inputClass}
                    />
                  </div>
                </div>

                {(cardError || state.error) && (
                  <div className="mt-3">
                    <Alert tone="error">{cardError ?? state.error}</Alert>
                  </div>
                )}
                {method === "pix" && pixState.message && !pixState.pix && (
                  <div className="mt-3">
                    <Alert tone="info">{pixState.message}</Alert>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy || !configured || !selectedPlan}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : method === "card" ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <QrCode className="h-4 w-4" />
                  )}
                  {busy
                    ? "Processando..."
                    : method === "card"
                      ? "Iniciar teste de 7 dias"
                      : `Gerar Pix de ${formatCurrency(price)}`}
                </button>

                <p className="mt-2.5 flex items-start gap-1.5 text-[10px] leading-relaxed text-slate-500">
                  <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                  {method === "card"
                    ? "O cartão é tokenizado diretamente no Pagar.me. O AgendamentoON não armazena o número nem o CVV."
                    : "O Pix é uma cobrança única do primeiro período. Para renovação automática, use cartão de crédito."}
                </p>

              </form>
            )}

            {devBypass && (
              <button
                type="button"
                onClick={() => {
                  const formData = new FormData();
                  formData.set("planSlug", planSlug);
                  devDispatch(formData);
                }}
                disabled={devPending}
                className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 hover:underline disabled:opacity-60"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {devPending ? "Liberando..." : "Atalho de teste: liberar sem cobrança"}
              </button>
            )}
            {devState.error && (
              <p className="mt-1 text-[11px] font-medium text-red-600">{devState.error}</p>
            )}
          </section>
        )}
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-semibold text-ink">Resumo do pedido</h2>
          <div className="mt-3 flex items-start justify-between gap-3 border-b border-line pb-3">
            <div>
              <p className="text-sm font-semibold text-ink">
                {selectedPlan?.name ?? "Plano"}
              </p>
              <p className="text-[11px] text-slate-500">Cobrança mensal</p>
            </div>
            <p className="text-right text-sm font-semibold text-ink">
              {formatCurrency(price)}
              <span className="block text-[10px] font-normal text-slate-500">por mês</span>
            </p>
          </div>

          <dl className="mt-3 space-y-2 text-[11px]">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Profissionais</dt>
              <dd className="font-medium text-slate-700">{selectedPlan?.maxProfessionals ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Serviços</dt>
              <dd className="font-medium text-slate-700">{selectedPlan?.maxServices ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Fidelidade</dt>
              <dd className="font-medium text-emerald-700">Nenhuma</dd>
            </div>
          </dl>

          <div className="mt-3 rounded-lg bg-paper px-3 py-2.5 text-[11px] leading-relaxed text-slate-600">
            {mode === "change" ? (
              <>A diferença de valor é aplicada na próxima renovação.</>
            ) : method === "whatsapp" ? (
              <>
                <strong className="text-ink">Contratação pelo WhatsApp.</strong> Preferência:{" "}
                {whatsappPreferenceLabel}. O suporte confirma os dados e envia as instruções de
                pagamento.
              </>
            ) : method === "card" ? (
              <>
                <strong className="text-ink">Hoje você não paga nada.</strong> O teste de{" "}
                {selectedPlan?.trialDays ?? 7} dias começa agora e a primeira cobrança automática
                acontece no 8º dia.
              </>
            ) : (
              <>
                <strong className="text-ink">Pagamento único agora.</strong> O painel é liberado
                após a confirmação do Pix e vale pelo primeiro período.
              </>
            )}
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            {mode === "change"
              ? "Alteração processada pelo Pagar.me"
              : method === "whatsapp"
                ? "Contratação e pagamento combinados pelo WhatsApp"
                : "Pagamento processado pelo Pagar.me"}
          </p>
        </div>
      </aside>
    </div>
  );
}
