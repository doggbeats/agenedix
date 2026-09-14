import { NextResponse } from "next/server";
import { generateId, getDb, saveDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  return NextResponse.json({ services: db.services });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, price, duration } = body;

  if (!name || !price || !duration) {
    return NextResponse.json(
      { error: "Nome, preço e duração são obrigatórios" },
      { status: 400 }
    );
  }

  const db = getDb();
  const service = {
    id: generateId("srv"),
    name,
    description: body.description ?? "",
    price: Number(price),
    duration: Number(duration),
    icon: body.icon ?? "💈",
  };

  db.services.push(service);
  saveDb(db);

  return NextResponse.json({ service }, { status: 201 });
}