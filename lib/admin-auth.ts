import crypto from "node:crypto";
import { cookies } from "next/headers";

const SECRET = process.env.ADMIN_SECRET ?? "agendamentos-jobs-admin-secret";
const EXPIRES_IN = 7 * 24 * 60 * 60 * 1000;

export function createAdminToken() {
  const expiry = Date.now() + EXPIRES_IN;
  const payload = Buffer.from(`admin:${expiry}`, "utf8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

export function isValidAdminToken(token?: string) {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("base64url");
  if (signature !== expected) return false;

  try {
    const raw = Buffer.from(payload, "base64url").toString("utf8");
    const expiry = Number(raw.replace("admin:", ""));
    if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
  } catch {
    return false;
  }
  return true;
}

export async function requireAdmin() {
  const store = await cookies();
  return isValidAdminToken(store.get("admin_token")?.value);
}