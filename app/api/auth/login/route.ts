import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { maskPhone } from "@/lib/utils";
import { Client } from "@/lib/types";

function toSafeClient(c: Client) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    createdAt: c.createdAt,
  };
}

export async function POST(request: Request) {
  const body = await request.json();
  const identifier = String(body.identifier ?? "").trim();
  const password = String(body.password ?? "");

  if (!identifier || !password) {
    return NextResponse.json(
      { error: "Informe telefone/e-mail e senha" },
      { status: 400 }
    );
  }

  const db = getDb();
  const cleanPhone = maskPhone(identifier);
  const lowerIdentifier = identifier.toLowerCase();

  const client = db.clients.find(
    (c) => c.phone === cleanPhone || (c.email && c.email.toLowerCase() === lowerIdentifier)
  );

  if (!client) {
    return NextResponse.json(
      { error: "Cliente não encontrado. Verifique seus dados." },
      { status: 401 }
    );
  }

  if (!client.password) {
    return NextResponse.json(
      { error: "Este cliente ainda não possui senha. Faça seu cadastro completo." },
      { status: 401 }
    );
  }

  if (!bcrypt.compareSync(password, client.password)) {
    return NextResponse.json(
      { error: "Senha incorreta." },
      { status: 401 }
    );
  }

  return NextResponse.json({ client: toSafeClient(client), ok: true });
}