"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { Image as ImageIcon, ImagePlus, Loader2, Palette, Sparkles, Upload, X } from "lucide-react";
import { Alert, buttonSmall, FieldError, inputClass, labelClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { initialActionState } from "@/lib/action-utils";
import { updateBrandingAction } from "@/lib/actions/branding";
import { prepareImageDataUrl } from "@/lib/image-file";
import {
  brandingCssVars,
  readableTextOn,
  resolveBranding,
  type BrandingView,
} from "@/lib/branding";

type BrandingFormProps = {
  establishmentName: string;
  segment: string;
  slug: string;
  branding: BrandingView;
  fallbackColor: string;
};

const colorFields = [
  { name: "primaryColor", label: "Cor principal", hint: "Marca, links e destaques" },
  { name: "secondaryColor", label: "Cor secundária", hint: "Apoio e detalhes" },
  { name: "backgroundColor", label: "Fundo", hint: "Fundo da página pública" },
  { name: "textColor", label: "Texto", hint: "Títulos e textos" },
  { name: "buttonColor", label: "Botões", hint: "Cor dos botões principais" },
] as const;

export function BrandingForm({
  establishmentName,
  segment,
  slug,
  branding,
  fallbackColor,
}: BrandingFormProps) {
  const [state, formAction] = useActionState(updateBrandingAction, initialActionState);
  const [values, setValues] = useState({
    primaryColor: branding.primaryColor,
    secondaryColor: branding.secondaryColor,
    backgroundColor: branding.backgroundColor,
    textColor: branding.textColor,
    buttonColor: branding.buttonColor,
    fontFamily: branding.fontFamily,
    buttonStyle: branding.buttonStyle,
    coverUrl: branding.coverUrl ?? "",
    gallery: branding.gallery,
    instagram: branding.instagram ?? "",
    facebook: branding.facebook ?? "",
    website: branding.website ?? "",
    tagline: branding.tagline ?? "",
    showTeam: branding.showTeam,
    showServices: branding.showServices,
    showGallery: branding.showGallery,
    showHours: branding.showHours,
    showAddress: branding.showAddress,
  });

  function update<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);

  async function handleCoverChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setCoverError(null);
    setCoverLoading(true);
    try {
      update("coverUrl", await prepareImageDataUrl(file, 1280));
    } catch (error) {
      setCoverError(
        error instanceof Error ? error.message : "Não foi possível processar a imagem.",
      );
    } finally {
      setCoverLoading(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }

  async function handleGalleryChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const room = 12 - values.gallery.length;
    if (room <= 0) {
      setGalleryError("Você já anexou 12 imagens. Remova alguma para adicionar outra.");
      event.target.value = "";
      return;
    }

    setGalleryLoading(true);
    setGalleryError(null);
    const added: string[] = [];
    let message: string | null = null;

    for (const file of files.slice(0, room)) {
      try {
        added.push(await prepareImageDataUrl(file, 900));
      } catch (error) {
        message =
          error instanceof Error ? error.message : "Não foi possível processar a imagem.";
      }
    }

    if (added.length > 0) {
      setValues((current) => ({
        ...current,
        gallery: [...current.gallery, ...added].slice(0, 12),
      }));
    }
    if (files.length > room) {
      message = `O limite é de 12 imagens. ${room} foram adicionadas.`;
    }
    setGalleryError(message);
    setGalleryLoading(false);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }

  function removeGalleryImage(index: number) {
    setValues((current) => ({
      ...current,
      gallery: current.gallery.filter((_, itemIndex) => itemIndex !== index),
    }));
    setGalleryError(null);
  }

  const preview = useMemo(
    () =>
      resolveBranding(
        {
          primaryColor: values.primaryColor,
          secondaryColor: values.secondaryColor,
          backgroundColor: values.backgroundColor,
          textColor: values.textColor,
          buttonColor: values.buttonColor,
          fontFamily: values.fontFamily,
          buttonStyle: values.buttonStyle,
          coverUrl: values.coverUrl || null,
          gallery: values.gallery,
          instagram: values.instagram || null,
          facebook: values.facebook || null,
          website: values.website || null,
          tagline: values.tagline || null,
          showTeam: values.showTeam,
          showServices: values.showServices,
          showGallery: values.showGallery,
          showHours: values.showHours,
          showAddress: values.showAddress,
        },
        fallbackColor,
      ),
    [values, fallbackColor],
  );

  const cssVars = brandingCssVars(preview);
  const buttonText = readableTextOn(preview.buttonColor);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <form action={formAction} className="space-y-5">
        {state.error && <Alert tone="error">{state.error}</Alert>}
        {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}

        <section className="rounded-xl border border-line bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-line px-4 py-4 sm:px-5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
              <Palette className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-ink">Cores da marca</h2>
              <p className="text-[11px] text-slate-500">
                Use cores sólidas em hexadecimal. O contraste do texto nos botões é ajustado
                automaticamente.
              </p>
            </div>
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
            {colorFields.map((field) => (
              <div key={field.name}>
                <label className={labelClass} htmlFor={`brand-${field.name}`}>
                  {field.label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={`brand-${field.name}`}
                    name={field.name}
                    value={values[field.name]}
                    onChange={(event) => update(field.name, event.target.value)}
                    className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-line bg-white p-1"
                    type="color"
                    aria-label={`${field.label} — seletor`}
                  />
                  <input
                    value={values[field.name]}
                    onChange={(event) => update(field.name, event.target.value)}
                    className={`${inputClass} font-mono uppercase`}
                    maxLength={7}
                    aria-label={`${field.label} em hexadecimal`}
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-500">{field.hint}</p>
                <FieldError messages={state.fieldErrors?.[field.name]} />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-line bg-white shadow-sm">
          <div className="border-b border-line px-4 py-4 sm:px-5">
            <h2 className="text-sm font-semibold text-ink">Estilo e conteúdo</h2>
            <p className="text-[11px] text-slate-500">
              Ajuste tipografia, formato dos botões, capa e chamada principal.
            </p>
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
            <div>
              <label className={labelClass} htmlFor="brand-fontFamily">
                Tipografia
              </label>
              <select
                id="brand-fontFamily"
                name="fontFamily"
                className={inputClass}
                value={values.fontFamily}
                onChange={(event) => update("fontFamily", event.target.value)}
              >
                <option value="sans">Moderna (sem serifa)</option>
                <option value="serif">Clássica (com serifa)</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="brand-buttonStyle">
                Formato dos botões
              </label>
              <select
                id="brand-buttonStyle"
                name="buttonStyle"
                className={inputClass}
                value={values.buttonStyle}
                onChange={(event) => update("buttonStyle", event.target.value)}
              >
                <option value="rounded">Arredondado</option>
                <option value="pill">Pílula</option>
                <option value="square">Reto</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="brand-tagline">
                Chamada principal
              </label>
              <input
                id="brand-tagline"
                name="tagline"
                value={values.tagline}
                onChange={(event) => update("tagline", event.target.value)}
                className={inputClass}
                maxLength={160}
                placeholder="Ex.: Cuidado de verdade para o seu tempo."
              />
              <FieldError messages={state.fieldErrors?.tagline} />
            </div>
            <div className="sm:col-span-2">
              <span className={labelClass}>Imagem de capa</span>
              <input type="hidden" name="coverUrl" value={values.coverUrl} />
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-line bg-paper sm:w-56 sm:shrink-0">
                  {values.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={values.coverUrl}
                      alt="Prévia da imagem de capa"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-slate-400">
                      <ImageIcon className="h-6 w-6" aria-hidden />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className={buttonSmall}
                      disabled={coverLoading}
                    >
                      {coverLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      {values.coverUrl ? "Trocar capa" : "Anexar capa"}
                    </button>
                    {values.coverUrl && (
                      <button
                        type="button"
                        onClick={() => update("coverUrl", "")}
                        className={`${buttonSmall} text-red-700 hover:border-red-300 hover:bg-red-50`}
                      >
                        <X className="h-3.5 w-3.5" /> Remover
                      </button>
                    )}
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Use uma imagem larga. A capa aparece no topo da página pública.
                  </p>
                  {coverError && (
                    <p className="mt-1 text-xs font-medium text-red-600">{coverError}</p>
                  )}
                  <FieldError messages={state.fieldErrors?.coverUrl} />
                </div>
              </div>
              <input
                ref={coverInputRef}
                id="brand-coverUrl"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={handleCoverChange}
                aria-label="Anexar imagem de capa"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-line bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-line px-4 py-4 sm:px-5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
              <ImageIcon className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-ink">Galeria e redes</h2>
              <p className="text-[11px] text-slate-500">
                Anexe até 12 imagens. Links sociais precisam começar por http(s).
              </p>
            </div>
          </div>
          <div className="space-y-4 p-4 sm:p-5">
            <div>
              <span className={labelClass}>Imagens da galeria</span>
              <input type="hidden" name="galleryText" value={values.gallery.join("\n")} />
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {values.gallery.map((url, index) => (
                  <div
                    key={index}
                    className="relative aspect-square overflow-hidden rounded-lg border border-line bg-paper"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Imagem ${index + 1} da galeria`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(index)}
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-md bg-white/95 text-slate-700 shadow ring-1 ring-line transition hover:bg-red-50 hover:text-red-700"
                      aria-label={`Remover imagem ${index + 1}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {values.gallery.length < 12 && (
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={galleryLoading}
                    className="grid aspect-square place-items-center rounded-lg border border-dashed border-line bg-paper/60 text-[11px] font-semibold text-slate-600 transition hover:border-brand hover:text-brand disabled:opacity-60"
                  >
                    {galleryLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <span className="flex flex-col items-center gap-1">
                        <ImagePlus className="h-5 w-5" /> Anexar
                      </span>
                    )}
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-[10px] text-slate-500">
                PNG, JPG ou WebP, até 5 MB por imagem. As imagens são ajustadas
                automaticamente.
              </p>
              {galleryError && (
                <p className="mt-1 text-xs font-medium text-red-600">{galleryError}</p>
              )}
              <FieldError messages={state.fieldErrors?.galleryText} />
              <input
                ref={galleryInputRef}
                id="brand-galleryText"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="sr-only"
                onChange={handleGalleryChange}
                aria-label="Anexar imagens da galeria"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="brand-instagram">
                  Instagram
                </label>
                <input
                  id="brand-instagram"
                  name="instagram"
                  value={values.instagram}
                  onChange={(event) => update("instagram", event.target.value)}
                  className={inputClass}
                  placeholder="https://instagram.com/..."
                />
                <FieldError messages={state.fieldErrors?.instagram} />
              </div>
              <div>
                <label className={labelClass} htmlFor="brand-facebook">
                  Facebook
                </label>
                <input
                  id="brand-facebook"
                  name="facebook"
                  value={values.facebook}
                  onChange={(event) => update("facebook", event.target.value)}
                  className={inputClass}
                  placeholder="https://facebook.com/..."
                />
                <FieldError messages={state.fieldErrors?.facebook} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="brand-website">
                  Site
                </label>
                <input
                  id="brand-website"
                  name="website"
                  value={values.website}
                  onChange={(event) => update("website", event.target.value)}
                  className={inputClass}
                  placeholder="https://..."
                />
                <FieldError messages={state.fieldErrors?.website} />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-line bg-white shadow-sm">
          <div className="border-b border-line px-4 py-4 sm:px-5">
            <h2 className="text-sm font-semibold text-ink">Seções visíveis</h2>
            <p className="text-[11px] text-slate-500">
              Desligue o que não faz sentido para o seu negócio. O agendamento continua
              disponível.
            </p>
          </div>
          <div className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5">
            {[
              ["showTeam", "Equipe"],
              ["showServices", "Serviços"],
              ["showGallery", "Galeria"],
              ["showHours", "Horários"],
              ["showAddress", "Endereço"],
            ].map(([name, label]) => (
              <label
                key={name}
                className="flex items-center gap-2.5 rounded-lg border border-line bg-paper px-3 py-2.5 text-xs font-medium text-slate-700"
              >
                <input
                  type="checkbox"
                  name={name}
                  checked={values[name as keyof typeof values] as boolean}
                  onChange={(event) =>
                    update(name as keyof typeof values, event.target.checked as never)
                  }
                  className="h-4 w-4 rounded border-slate-300 accent-brand"
                />
                {label}
              </label>
            ))}
          </div>
        </section>

        <SubmitButton className="w-full" pendingLabel="Salvando identidade...">
          Salvar identidade visual
        </SubmitButton>
      </form>

      <div className="xl:sticky xl:top-24 xl:self-start">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Prévia da página pública
          </p>
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
            <Sparkles className="h-3 w-3" /> /agendar/{slug}
          </span>
        </div>
        <div
          className="overflow-hidden rounded-2xl border border-line shadow-lg"
          style={{ ...cssVars, backgroundColor: preview.backgroundColor, color: preview.textColor } as React.CSSProperties}
        >
          <div
            className="relative flex min-h-44 flex-col justify-end px-5 py-5"
            style={{
              backgroundColor: preview.primaryColor,
              color: readableTextOn(preview.primaryColor),
              backgroundImage: preview.coverUrl ? `url(${preview.coverUrl})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {preview.coverUrl && (
              <span
                aria-hidden
                className="absolute inset-0"
                style={{ backgroundColor: preview.primaryColor, opacity: 0.55 }}
              />
            )}
            <div className="relative">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-80">
                {segment}
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{establishmentName}</p>
              <p className="mt-1 text-xs opacity-90">
                {preview.tagline ?? "Escolha o serviço, o profissional e o melhor horário."}
              </p>
            </div>
          </div>

          <div className="space-y-4 px-5 py-5" style={{ fontFamily: cssVars["--brand-font"] }}>
            <div className="flex flex-wrap gap-2">
              <span
                className="inline-flex items-center rounded-lg px-3 py-2 text-xs font-semibold"
                style={{
                  backgroundColor: preview.buttonColor,
                  color: buttonText,
                  borderRadius: cssVars["--brand-radius"],
                }}
              >
                Agendar horário
              </span>
              <span
                className="inline-flex items-center rounded-lg border px-3 py-2 text-xs font-semibold"
                style={{
                  borderColor: cssVars["--brand-line"],
                  color: preview.textColor,
                  borderRadius: cssVars["--brand-radius"],
                }}
              >
                WhatsApp
              </span>
            </div>

            {preview.showServices && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-60">
                  Serviços
                </p>
                <div className="mt-2 space-y-2">
                  {["Corte e finalização", "Atendimento completo"].map((service, index) => (
                    <div
                      key={service}
                      className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs"
                      style={{ borderColor: cssVars["--brand-line"] }}
                    >
                      <span>{service}</span>
                      <span className="font-semibold">
                        {index === 0 ? "R$ 70,00" : "R$ 110,00"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {preview.showTeam && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-60">
                  Equipe
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className="grid h-8 w-8 place-items-center rounded-full text-[10px] font-bold"
                    style={{
                      backgroundColor: cssVars["--brand-surface"],
                      color: preview.primaryColor,
                    }}
                  >
                    AG
                  </span>
                  <div className="text-xs">
                    <p className="font-semibold">Profissional</p>
                    <p className="opacity-60">Especialidade</p>
                  </div>
                </div>
              </div>
            )}

            {preview.showGallery && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-60">
                  Galeria
                </p>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {(preview.gallery.length > 0 ? preview.gallery.slice(0, 3) : [null, null, null]).map(
                    (url, index) =>
                      url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={`${url}-${index}`}
                          src={url}
                          alt=""
                          className="h-16 w-full rounded-md object-cover"
                        />
                      ) : (
                        <span
                          key={`placeholder-${index}`}
                          className="h-16 w-full rounded-md"
                          style={{ backgroundColor: cssVars["--brand-surface"] }}
                        />
                      ),
                  )}
                </div>
              </div>
            )}

            {preview.showHours && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-60">
                  Horários
                </p>
                <p className="mt-1 text-xs opacity-80">Seg a Sáb · 09:00–18:00</p>
                {preview.showAddress && (
                  <p className="mt-1 text-xs opacity-80">Endereço do estabelecimento</p>
                )}
              </div>
            )}
          </div>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
          A prévia usa dados de exemplo para serviços, equipe e horários. O conteúdo real vem
          do seu cadastro.
        </p>
      </div>
    </div>
  );
}
