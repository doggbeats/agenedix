import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { generateId, getDb, saveDb } from "@/lib/db";
import { maskPhone } from "@/lib/utils";
import { Client } from "@/lib/types";
import { requireAdmin } from "@/lib/admin-auth";

function toSafeClient(c: Client) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    createdAt: c.createdAt,
  };
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const db = getDb();
  return NextResponse.json({ clients: db.clients.map(toSafeClient) });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, phone, email, password } = body;

  if (!name || !phone) {
    return NextResponse.json(
      { error: "Nome e telefone são obrigatórios" },
      { status: 400 }
    );
  }

  if (!password || String(password).length < 6) {
    return NextResponse.json(
      { error: "A senha deve ter pelo menos 6 caracteres" },
      { status: 400 }
    );
  }

  const db = getDb();
  const cleanPhone = maskPhone(String(phone));

  const existing = db.clients.find((c) => c.phone === cleanPhone);
  if (existing) {
    if (name !== existing.name || (email && email !== existing.email)) {
      existing.name = name;
      existing.email = email ?? existing.email;
      saveDb(db);
    }
    return NextResponse.json({ client: toSafeClient(existing), exists: true });
  }

  const client: Client = {
    id: generateId("cli"),
    name,
    phone: cleanPhone,
    email: email ?? "",
    password: bcrypt.hashSync(String(password), 10),
    createdAt: new Date().toISOString(),
  };

  db.clients.unshift(client);
  saveDb(db);

  return NextResponse.json({ client: toSafeClient(client), exists: false }, { status: 201 });
}