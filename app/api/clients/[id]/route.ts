import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import { maskPhone } from "@/lib/utils";
import { Client } from "@/lib/types";
import { requireAdmin } from "@/lib/admin-auth";

type Params = { params: Promise<{ id: string }> };

function toSafeClient(c: Client) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    createdAt: c.createdAt,
  };
}

export async function GET(_request: Request, context: Params) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await context.params;
  const db = getDb();
  const client = db.clients.find((c) => c.id === id);

  if (!client) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ client: toSafeClient(client) });
}

export async function PATCH(request: Request, context: Params) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await context.params;
  const body = await request.json();
  const db = getDb();
  const client = db.clients.find((c) => c.id === id);

  if (!client) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  if (body.name) client.name = body.name;
  if (body.phone) client.phone = maskPhone(String(body.phone));
  if (typeof body.email === "string") client.email = body.email;
  if (body.password) {
    if (String(body.password).length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      );
    }
    client.password = bcrypt.hashSync(String(body.password), 10);
  }

  saveDb(db);
  return NextResponse.json({ client: toSafeClient(client) });
}

export async function DELETE(_request: Request, context: Params) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await context.params;
  const db = getDb();
  const index = db.clients.findIndex((c) => c.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  db.clients.splice(index, 1);
  saveDb(db);
  return NextResponse.json({ success: true });
}