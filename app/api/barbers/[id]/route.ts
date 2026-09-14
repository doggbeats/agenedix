import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Params) {
  const { id } = await context.params;
  const body = await request.json();
  const db = getDb();
  const barber = db.barbers.find((b) => b.id === id);

  if (!barber) {
    return NextResponse.json(
      { error: "Funcionário não encontrado" },
      { status: 404 }
    );
  }

  if (body.name) barber.name = body.name;
  if (typeof body.specialty === "string") barber.specialty = body.specialty;
  if (typeof body.avatar === "string" && body.avatar) barber.avatar = body.avatar;
  if (typeof body.available === "boolean") barber.available = body.available;

  saveDb(db);
  return NextResponse.json({ barber });
}

export async function DELETE(_request: Request, context: Params) {
  const { id } = await context.params;
  const db = getDb();

  if (id === "any") {
    return NextResponse.json(
      { error: "O barbeiro padrão 'Qualquer' não pode ser removido" },
      { status: 400 }
    );
  }

  const index = db.barbers.findIndex((b) => b.id === id);
  if (index === -1) {
    return NextResponse.json(
      { error: "Funcionário não encontrado" },
      { status: 404 }
    );
  }

  db.barbers.splice(index, 1);
  saveDb(db);
  return NextResponse.json({ success: true });
}