import type { Prisma, PrismaClient } from "@prisma/client";
import { RESERVED_SLUGS } from "./constants";

export function slugify(value: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 60);

  if (normalized.length < 3) return "estabelecimento";
  return normalized;
}

type Db = PrismaClient | Prisma.TransactionClient;

export async function ensureUniqueSlug(
  db: Db,
  desired: string,
  ignoreId?: string,
): Promise<string> {
  const base = RESERVED_SLUGS.has(slugify(desired))
    ? `${slugify(desired)}-agenda`
    : slugify(desired);

  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = await db.establishment.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === ignoreId) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
    if (suffix > 200) return `${base}-${Date.now()}`;
  }
}
