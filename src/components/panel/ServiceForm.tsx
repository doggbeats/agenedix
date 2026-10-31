"use client";

import { useActionState, useRef, useState } from "react";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import {
  Alert,
  buttonSmall,
  FieldError,
  inputClass,
  labelClass,
} from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { initialActionState } from "@/lib/action-utils";
import { prepareImageDataUrl } from "@/lib/image-file";
import { createServiceAction, updateServiceAction } from "@/lib/actions/services";

export type ServiceFormValues = {
  id?: string;
  name: string;
  description: string;
  category: string;
  price: number;
  durationMin: number;
  bufferMin: number;
  imageUrl: string;
  onlineEnabled: boolean;
  active: boolean;
  professionalIds: string[];
};

export function ServiceForm({
  mode,
  service,
  professionals,
}: {
  mode: "create" | "edit";
  service?: ServiceFormValues;
  professionals: Array<{ id: string; name: string }>;
}) {
  const action = mode === "create" ? createServiceAction : updateServiceAction;
  const [state, formAction] = useActionState(action, initialActionState);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState(service?.imageUrl ?? "");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageError(null);
    setImageLoading(true);
    try {
      setImageUrl(await prepareImageDataUrl(file, 900));
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : "Não foi possível processar a imagem.",
      );
    } finally {
      setImageLoading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      {service?.id && <input type="hidden" name="id" value={service.id} />}
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="service-name">
            Nome do serviço
          </label>
          <input
            id="service-name"
            name="name"
            required
            maxLength={120}
            defaultValue={service?.name ?? ""}
            placeholder="Ex.: Corte masculino"
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.name} />
        </div>

        <div>
          <label className={labelClass} htmlFor="service-category">
            Categoria
          </label>
          <input
            id="service-category"
            name="category"
            maxLength={80}
            defaultValue={service?.category ?? ""}
            placeholder="Cabelo, barba, combo..."
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.category} />
        </div>

        <div>
          <label className={labelClass} htmlFor="service-price">
            Preço (R$)
          </label>
          <input
            id="service-price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={service?.price ?? ""}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.price} />
        </div>

        <div>
          <label className={labelClass} htmlFor="service-duration">
            Duração (min)
          </label>
          <input
            id="service-duration"
            name="durationMin"
            type="number"
            min="5"
            step="5"
            required
            defaultValue={service?.durationMin ?? 30}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.durationMin} />
        </div>

        <div>
          <label className={labelClass} htmlFor="service-buffer">
            Intervalo após o serviço (min)
          </label>
          <input
            id="service-buffer"
            name="bufferMin"
            type="number"
            min="0"
            step="5"
            defaultValue={service?.bufferMin ?? 0}
            className={inputClass}
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Reservado para limpeza e troca de cliente. Não aparece como duração do serviço.
          </p>
          <FieldError messages={state.fieldErrors?.bufferMin} />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="service-description">
            Descrição
          </label>
          <textarea
            id="service-description"
            name="description"
            rows={2}
            maxLength={500}
            defaultValue={service?.description ?? ""}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.description} />
        </div>

        <div className="sm:col-span-2">
          <span className={labelClass}>Imagem do serviço</span>
          <input type="hidden" name="imageUrl" value={imageUrl} />
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg border border-line bg-paper sm:w-44">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="Prévia da imagem do serviço"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="grid h-full w-full place-items-center text-slate-400">
                  <ImagePlus className="h-6 w-6" aria-hidden />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className={buttonSmall}
                  disabled={imageLoading}
                >
                  {imageLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  {imageUrl ? "Trocar imagem" : "Anexar imagem"}
                </button>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl("");
                      setImageError(null);
                    }}
                    className={`${buttonSmall} text-red-700 hover:border-red-300 hover:bg-red-50`}
                  >
                    <X className="h-3.5 w-3.5" /> Remover
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">
                PNG, JPG ou WebP até 5 MB. A imagem é otimizada e pode ser exibida junto ao
                serviço.
              </p>
              {imageError && (
                <p className="mt-1 text-xs font-medium text-red-600">{imageError}</p>
              )}
              <FieldError messages={state.fieldErrors?.imageUrl} />
            </div>
          </div>
          <input
            ref={imageInputRef}
            id="service-image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={handleImageChange}
            aria-label="Anexar imagem do serviço"
          />
        </div>
      </div>

      <fieldset>
        <legend className={labelClass}>Profissionais que atendem este serviço</legend>
        {professionals.length === 0 ? (
          <p className="text-xs text-slate-500">
            Cadastre um profissional antes de vincular este serviço.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {professionals.map((professional) => (
              <label
                key={professional.id}
                className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  name="professionalIds"
                  value={professional.id}
                  defaultChecked={service?.professionalIds.includes(professional.id)}
                  className="h-4 w-4 rounded border-slate-300 accent-brand"
                />
                {professional.name}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="flex flex-wrap gap-4 rounded-xl bg-paper px-3 py-2.5">
        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
          <input
            type="checkbox"
            name="active"
            defaultChecked={service?.active ?? true}
            className="h-4 w-4 rounded border-slate-300 accent-brand"
          />
          Serviço ativo
        </label>
        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
          <input
            type="checkbox"
            name="onlineEnabled"
            defaultChecked={service?.onlineEnabled ?? true}
            className="h-4 w-4 rounded border-slate-300 accent-brand"
          />
          Disponível na página pública
        </label>
      </div>

      <div className="flex justify-end">
        <SubmitButton variant="brand">
          {mode === "create" ? "Criar serviço" : "Salvar alterações"}
        </SubmitButton>
      </div>
    </form>
  );
}
