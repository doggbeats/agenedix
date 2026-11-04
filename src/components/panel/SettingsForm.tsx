"use client";

import { useActionState, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import {
  Alert,
  buttonSmall,
  FieldError,
  inputClass,
  labelClass,
} from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { initialActionState } from "@/lib/action-utils";
import { updateSettingsAction } from "@/lib/actions/settings";
import { SEGMENTS } from "@/lib/constants";
import { formatPhone, maskPhoneInput } from "@/lib/format";
import { prepareImageDataUrl } from "@/lib/image-file";
import { DEFAULT_WHATSAPP_MESSAGE, renderMessage } from "@/lib/whatsapp";

export type SettingsValues = {
  name: string;
  slug: string;
  segment: string;
  ownerName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  description: string;
  logoUrl: string;
  brandColor: string;
  timezone: string;
  autoConfirmBookings: boolean;
  publicPageEnabled: boolean;
  minAdvanceMinutes: number;
  maxAdvanceDays: number;
  cancellationNoticeHours: number;
  defaultServiceMin: number;
  slotIntervalMinutes: number;
  cancellationPolicy: string;
  whatsappMessage: string;
};

const commonTimezones = [
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Belem",
  "America/Cuiaba",
  "America/Recife",
  "America/Rio_Branco",
  "America/Porto_Velho",
  "America/Boa_Vista",
];

export function SettingsForm({ establishment }: { establishment: SettingsValues }) {
  const [state, formAction] = useActionState(updateSettingsAction, initialActionState);
  const [phone, setPhone] = useState(formatPhone(establishment.phone));
  const [whatsapp, setWhatsapp] = useState(formatPhone(establishment.whatsapp));
  const [whatsappTemplate, setWhatsappTemplate] = useState(
    establishment.whatsappMessage.trim() || DEFAULT_WHATSAPP_MESSAGE,
  );
  const [logo, setLogo] = useState(establishment.logoUrl);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  async function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoError(null);
    setLogoLoading(true);
    try {
      setLogo(await prepareImageDataUrl(file));
    } catch (error) {
      setLogoError(
        error instanceof Error ? error.message : "Não foi possível processar a imagem.",
      );
      if (logoInputRef.current) logoInputRef.current.value = "";
    } finally {
      setLogoLoading(false);
    }
  }

  function removeLogo() {
    setLogo("");
    setLogoError(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  const messagePreview = renderMessage(
    whatsappTemplate.trim() || DEFAULT_WHATSAPP_MESSAGE,
    {
      primeiro_nome: "Ana",
      cliente: "Ana Souza",
      servico: "Corte feminino",
      profissional: "Bruno",
      data: "28/10/2026 às 15:30",
      hora: "15:30",
      protocolo: "AG-7F3K2",
      estabelecimento: establishment.name,
      endereco: establishment.address || "Rua das Palmeiras, 100",
      politica:
        establishment.cancellationPolicy ||
        "Cancelamentos com até 4 horas de antecedência.",
    },
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="settings-name">
            Nome do estabelecimento
          </label>
          <input
            id="settings-name"
            name="name"
            required
            maxLength={120}
            defaultValue={establishment.name}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.name} />
        </div>
        <div>
          <label className={labelClass} htmlFor="settings-slug">
            Endereço público
          </label>
          <div className="flex items-center rounded-xl border border-line bg-white shadow-sm focus-within:border-ink/30 focus-within:ring-2 focus-within:ring-brand/60">
            <span className="pl-3.5 text-xs text-slate-500">/agendar/</span>
            <input
              id="settings-slug"
              name="slug"
              required
              maxLength={60}
              defaultValue={establishment.slug}
              className="w-full rounded-xl bg-transparent px-1 py-2.5 text-sm text-ink outline-none"
            />
          </div>
          <FieldError messages={state.fieldErrors?.slug} />
        </div>
        <div>
          <label className={labelClass} htmlFor="settings-segment">
            Segmento
          </label>
          <select
            id="settings-segment"
            name="segment"
            defaultValue={establishment.segment}
            className={inputClass}
          >
            {[...new Set([...SEGMENTS, establishment.segment])].map((segment) => (
              <option key={segment} value={segment}>
                {segment}
              </option>
            ))}
          </select>
          <FieldError messages={state.fieldErrors?.segment} />
        </div>
        <div>
          <label className={labelClass} htmlFor="settings-owner">
            Responsável
          </label>
          <input
            id="settings-owner"
            name="ownerName"
            required
            maxLength={120}
            defaultValue={establishment.ownerName}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.ownerName} />
        </div>
        <div>
          <label className={labelClass} htmlFor="settings-phone">
            Telefone
          </label>
          <input
            id="settings-phone"
            name="phone"
            inputMode="tel"
            required
            value={phone}
            onChange={(event) => setPhone(maskPhoneInput(event.target.value))}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.phone} />
        </div>
        <div>
          <label className={labelClass} htmlFor="settings-whatsapp">
            WhatsApp
          </label>
          <input
            id="settings-whatsapp"
            name="whatsapp"
            inputMode="tel"
            required
            value={whatsapp}
            onChange={(event) => setWhatsapp(maskPhoneInput(event.target.value))}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.whatsapp} />
        </div>
        <div>
          <label className={labelClass} htmlFor="settings-email">
            E-mail de contato
          </label>
          <input
            id="settings-email"
            name="email"
            type="email"
            required
            defaultValue={establishment.email}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.email} />
        </div>
        <div>
          <label className={labelClass} htmlFor="settings-brand">
            Cor da marca
          </label>
          <div className="flex items-center gap-2">
            <input
              id="settings-brand"
              name="brandColor"
              type="color"
              defaultValue={establishment.brandColor}
              className="h-11 w-14 cursor-pointer rounded-lg border border-line bg-white p-1"
            />
            <input
              aria-label="Código da cor"
              value={establishment.brandColor}
              readOnly
              className={`${inputClass} font-mono`}
            />
          </div>
          <FieldError messages={state.fieldErrors?.brandColor} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="settings-address">
            Endereço
          </label>
          <input
            id="settings-address"
            name="address"
            maxLength={200}
            defaultValue={establishment.address}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.address} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="settings-description">
            Descrição pública
          </label>
          <textarea
            id="settings-description"
            name="description"
            rows={3}
            maxLength={500}
            defaultValue={establishment.description}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.description} />
        </div>
        <div className="sm:col-span-2">
          <span className={labelClass}>Logo do estabelecimento</span>
          <input type="hidden" name="logoUrl" value={logo} />
          <div className="flex flex-col gap-3 rounded-xl border border-dashed border-line bg-paper/60 p-3 sm:flex-row sm:items-center">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-white">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="Prévia da logo" className="h-full w-full object-contain" />
              ) : (
                <ImagePlus className="h-6 w-6 text-slate-400" aria-hidden />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className={buttonSmall}
                  disabled={logoLoading}
                >
                  {logoLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  {logo ? "Trocar logo" : "Anexar logo"}
                </button>
                {logo && (
                  <button
                    type="button"
                    onClick={removeLogo}
                    className={`${buttonSmall} text-red-700 hover:border-red-300 hover:bg-red-50`}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remover
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">
                PNG, JPG ou WebP, até 5 MB. A imagem é ajustada automaticamente para a
                página pública.
              </p>
              {logoError && <p className="mt-1 text-xs font-medium text-red-600">{logoError}</p>}
              <FieldError messages={state.fieldErrors?.logoUrl} />
            </div>
          </div>
          <input
            ref={logoInputRef}
            id="settings-logo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={handleLogoChange}
            aria-label="Anexar logo do estabelecimento"
          />
        </div>
      </div>

      <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="settings-timezone">
            Fuso horário
          </label>
          <input
            id="settings-timezone"
            name="timezone"
            required
            list="timezones"
            defaultValue={establishment.timezone}
            className={inputClass}
          />
          <datalist id="timezones">
            {commonTimezones.map((timezone) => (
              <option key={timezone} value={timezone} />
            ))}
          </datalist>
          <FieldError messages={state.fieldErrors?.timezone} />
        </div>
        <div>
          <label className={labelClass} htmlFor="settings-slot">
            Intervalo entre horários
          </label>
          <select
            id="settings-slot"
            name="slotIntervalMinutes"
            defaultValue={establishment.slotIntervalMinutes}
            className={inputClass}
          >
            {[5, 10, 15, 20, 30, 60].map((value) => (
              <option key={value} value={value}>
                {value} minutos
              </option>
            ))}
          </select>
          <FieldError messages={state.fieldErrors?.slotIntervalMinutes} />
        </div>
        <div>
          <label className={labelClass} htmlFor="settings-min-advance">
            Antecedência mínima (min)
          </label>
          <input
            id="settings-min-advance"
            name="minAdvanceMinutes"
            type="number"
            min="0"
            max="43200"
            defaultValue={establishment.minAdvanceMinutes}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.minAdvanceMinutes} />
        </div>
        <div>
          <label className={labelClass} htmlFor="settings-max-advance">
            Agendamento até (dias)
          </label>
          <input
            id="settings-max-advance"
            name="maxAdvanceDays"
            type="number"
            min="1"
            max="365"
            defaultValue={establishment.maxAdvanceDays}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.maxAdvanceDays} />
        </div>
        <div>
          <label className={labelClass} htmlFor="settings-cancel-hours">
            Cancelamento online até (horas antes)
          </label>
          <input
            id="settings-cancel-hours"
            name="cancellationNoticeHours"
            type="number"
            min="0"
            max="720"
            defaultValue={establishment.cancellationNoticeHours}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.cancellationNoticeHours} />
        </div>
        <div>
          <label className={labelClass} htmlFor="settings-default-duration">
            Duração padrão (min)
          </label>
          <input
            id="settings-default-duration"
            name="defaultServiceMin"
            type="number"
            min="5"
            max="480"
            step="5"
            defaultValue={establishment.defaultServiceMin}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.defaultServiceMin} />
        </div>
      </div>

      <div className="grid gap-3 rounded-xl bg-paper px-3 py-3 sm:grid-cols-2">
        <label className="flex items-start gap-2 text-xs font-medium text-slate-700">
          <input
            type="checkbox"
            name="autoConfirmBookings"
            defaultChecked={establishment.autoConfirmBookings}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-brand"
          />
          <span>
            Confirmar automaticamente os agendamentos online
            <span className="mt-0.5 block font-normal text-slate-600">
              Se desligado, o agendamento entra como pendente para sua análise.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-xs font-medium text-slate-700">
          <input
            type="checkbox"
            name="publicPageEnabled"
            defaultChecked={establishment.publicPageEnabled}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-brand"
          />
          <span>
            Página pública ativa
            <span className="mt-0.5 block font-normal text-slate-600">
              Desligar impede novos agendamentos online.
            </span>
          </span>
        </label>
      </div>

      <div>
        <label className={labelClass} htmlFor="settings-policy">
          Política de cancelamento (exibida ao cliente)
        </label>
        <textarea
          id="settings-policy"
          name="cancellationPolicy"
          rows={3}
          maxLength={1000}
          defaultValue={establishment.cancellationPolicy}
          className={inputClass}
        />
        <FieldError messages={state.fieldErrors?.cancellationPolicy} />
      </div>

      <div
        id="mensagens"
        className="scroll-mt-24 rounded-xl border border-line bg-paper/60 p-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-ink">
              Mensagem enviada ao cliente
            </h3>
            <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-slate-500">
              Texto padrão usado nos botões de WhatsApp ao compartilhar um agendamento. Você
              pode adaptar o tom e incluir as informações que fizerem sentido.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setWhatsappTemplate(DEFAULT_WHATSAPP_MESSAGE)}
            className={buttonSmall}
          >
            Restaurar padrão
          </button>
        </div>

        <div className="mt-4">
          <label className={labelClass} htmlFor="settings-whatsapp-message">
            Modelo da mensagem
          </label>
          <textarea
            id="settings-whatsapp-message"
            name="whatsappMessage"
            rows={7}
            maxLength={1000}
            value={whatsappTemplate}
            onChange={(event) => setWhatsappTemplate(event.target.value)}
            className={`${inputClass} font-mono text-xs`}
          />
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            Variáveis: {"{primeiro_nome}"}, {"{cliente}"}, {"{servico}"}, {"{profissional}"},{" "}
            {"{data}"}, {"{hora}"}, {"{protocolo}"}, {"{estabelecimento}"}, {"{endereco}"} e{" "}
            {"{politica}"}. Linhas com valor vazio são removidas automaticamente.
          </p>
          <FieldError messages={state.fieldErrors?.whatsappMessage} />
        </div>

        <div className="mt-4 rounded-lg border border-line bg-white p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Prévia
          </p>
          <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-[11px] leading-relaxed text-slate-600">
            {messagePreview}
          </pre>
        </div>
      </div>

      <div className="flex justify-end">
        <SubmitButton variant="brand">Salvar configurações</SubmitButton>
      </div>
    </form>
  );
}
