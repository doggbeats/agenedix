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
import {
  createProfessionalAction,
  updateProfessionalAction,
} from "@/lib/actions/professionals";
import { prepareImageDataUrl } from "@/lib/image-file";
import { WEEKDAYS } from "@/lib/constants";

export type ProfessionalFormValues = {
  id?: string;
  name: string;
  bio: string;
  photoUrl: string;
  specialties: string;
  active: boolean;
  serviceIds: string[];
  workdays: number[];
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
};

export function ProfessionalForm({
  mode,
  professional,
  services,
}: {
  mode: "create" | "edit";
  professional?: ProfessionalFormValues;
  services: Array<{ id: string; name: string }>;
}) {
  const action = mode === "create" ? createProfessionalAction : updateProfessionalAction;
  const [state, formAction] = useActionState(action, initialActionState);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState(professional?.photoUrl ?? "");
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    setPhotoLoading(true);
    try {
      setPhotoUrl(await prepareImageDataUrl(file, 512));
    } catch (error) {
      setPhotoError(
        error instanceof Error ? error.message : "Não foi possível processar a imagem.",
      );
    } finally {
      setPhotoLoading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      {professional?.id && <input type="hidden" name="id" value={professional.id} />}
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="professional-name">
            Nome
          </label>
          <input
            id="professional-name"
            name="name"
            required
            maxLength={120}
            defaultValue={professional?.name ?? ""}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.name} />
        </div>
        <div>
          <label className={labelClass} htmlFor="professional-specialties">
            Especialidades
          </label>
          <input
            id="professional-specialties"
            name="specialties"
            maxLength={200}
            defaultValue={professional?.specialties ?? ""}
            placeholder="Corte, barba, coloração..."
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.specialties} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="professional-bio">
            Apresentação
          </label>
          <textarea
            id="professional-bio"
            name="bio"
            rows={2}
            maxLength={500}
            defaultValue={professional?.bio ?? ""}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.bio} />
        </div>
        <div className="sm:col-span-2">
          <span className={labelClass}>Foto do profissional</span>
          <input type="hidden" name="photoUrl" value={photoUrl} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-line bg-paper">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt="Prévia da foto do profissional"
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
                  onClick={() => photoInputRef.current?.click()}
                  className={buttonSmall}
                  disabled={photoLoading}
                >
                  {photoLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  {photoUrl ? "Trocar foto" : "Anexar foto"}
                </button>
                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoUrl("");
                      setPhotoError(null);
                    }}
                    className={`${buttonSmall} text-red-700 hover:border-red-300 hover:bg-red-50`}
                  >
                    <X className="h-3.5 w-3.5" /> Remover
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">
                PNG, JPG ou WebP até 5 MB. A imagem é otimizada e aparece no painel e na página
                pública.
              </p>
              {photoError && (
                <p className="mt-1 text-xs font-medium text-red-600">{photoError}</p>
              )}
              <FieldError messages={state.fieldErrors?.photoUrl} />
            </div>
          </div>
          <input
            ref={photoInputRef}
            id="professional-photo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={handlePhotoChange}
            aria-label="Anexar foto do profissional"
          />
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className={labelClass}>Dias de trabalho</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {WEEKDAYS.map((day) => (
            <label
              key={day.value}
              className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                name="workdays"
                value={day.value}
                defaultChecked={professional?.workdays.includes(day.value) ?? day.value !== 0}
                className="h-4 w-4 rounded border-slate-300 accent-brand"
              />
              {day.short}
            </label>
          ))}
        </div>
        <FieldError messages={state.fieldErrors?.workdays} />
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className={labelClass} htmlFor="professional-start">
              Início
            </label>
            <input
              id="professional-start"
              name="startTime"
              type="time"
              defaultValue={professional?.startTime ?? "09:00"}
              className={inputClass}
            />
            <FieldError messages={state.fieldErrors?.startTime} />
          </div>
          <div>
            <label className={labelClass} htmlFor="professional-end">
              Fim
            </label>
            <input
              id="professional-end"
              name="endTime"
              type="time"
              defaultValue={professional?.endTime ?? "18:00"}
              className={inputClass}
            />
            <FieldError messages={state.fieldErrors?.endTime} />
          </div>
          <div>
            <label className={labelClass} htmlFor="professional-break-start">
              Pausa início
            </label>
            <input
              id="professional-break-start"
              name="breakStart"
              type="time"
              defaultValue={professional?.breakStart ?? ""}
              className={inputClass}
            />
            <FieldError messages={state.fieldErrors?.breakStart} />
          </div>
          <div>
            <label className={labelClass} htmlFor="professional-break-end">
              Pausa fim
            </label>
            <input
              id="professional-break-end"
              name="breakEnd"
              type="time"
              defaultValue={professional?.breakEnd ?? ""}
              className={inputClass}
            />
            <FieldError messages={state.fieldErrors?.breakEnd} />
          </div>
        </div>
        <p className="text-[11px] text-slate-500">
          O mesmo expediente é aplicado aos dias marcados. Ajustes individuais podem ser feitos
          depois na agenda.
        </p>
      </fieldset>

      <fieldset>
        <legend className={labelClass}>Serviços que realiza</legend>
        {services.length === 0 ? (
          <p className="text-xs text-slate-500">
            Nenhum serviço cadastrado. Cadastre um serviço para vincular.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {services.map((service) => (
              <label
                key={service.id}
                className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  name="serviceIds"
                  value={service.id}
                  defaultChecked={professional?.serviceIds.includes(service.id)}
                  className="h-4 w-4 rounded border-slate-300 accent-brand"
                />
                {service.name}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <label className="flex items-center gap-2 rounded-xl bg-paper px-3 py-2.5 text-xs font-medium text-slate-700">
        <input
          type="checkbox"
          name="active"
          defaultChecked={professional?.active ?? true}
          className="h-4 w-4 rounded border-slate-300 accent-brand"
        />
        Profissional ativo (aparece na página pública e pode receber agendamentos)
      </label>

      <div className="flex justify-end">
        <SubmitButton variant="brand">
          {mode === "create" ? "Cadastrar profissional" : "Salvar alterações"}
        </SubmitButton>
      </div>
    </form>
  );
}
