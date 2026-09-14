import { NextResponse } from "next/server";
import { generateId, getDb, saveDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const db = getDb();
  return NextResponse.json({ barbers: db.barbers });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const body = await request.json();
  const { name, specialty, avatar } = body;

  if (!name) {
    return NextResponse.json(
      { error: "Nome do funcionário é obrigatório" },
      { status: 400 }
    );
  }

  const db = getDb();
  const barber = {
    id: generateId("bar"),
    name,
    specialty: specialty ?? "",
    avatar: avatar || name.slice(0, 2).toUpperCase(),
    available: body.available ?? true,
  };

  db.barbers.push(barber);
  saveDb(db);

  return NextResponse.json({ barber }, { status: 201 });
}