import { ZodError, type ZodType } from "zod";

export type ActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialActionState: ActionState = {};

export function failure(error: string, fieldErrors?: Record<string, string[]>): ActionState {
  return { ok: false, error, fieldErrors };
}

export function success(message: string): ActionState {
  return { ok: true, message };
}

export function zodFailure(error: ZodError): ActionState {
  const flat = error.flatten();
  const fieldErrors = Object.fromEntries(
    Object.entries(flat.fieldErrors).filter(
      ([, messages]) => Array.isArray(messages) && messages.length > 0,
    ),
  ) as Record<string, string[]>;
  const first = Object.values(fieldErrors)[0]?.[0] ?? flat.formErrors[0];
  return failure(first ?? "Verifique os dados informados.", fieldErrors);
}

export function parseForm<T>(schema: ZodType<T>, data: unknown): { data?: T; state?: ActionState } {
  const result = schema.safeParse(data);
  if (!result.success) return { state: zodFailure(result.error) };
  return { data: result.data };
}

export function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function formOptionalString(formData: FormData, key: string): string | undefined {
  const value = formString(formData, key).trim();
  return value ? value : undefined;
}

export function formBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

export function formNumber(formData: FormData, key: string): number {
  return Number(formString(formData, key));
}

export function formList(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string" && value.length > 0);
}

export function formCheckboxNumberList(formData: FormData, key: string): number[] {
  return formList(formData, key)
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value));
}
