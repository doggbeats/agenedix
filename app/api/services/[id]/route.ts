import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Params) {
  const { id } = await context.params;
  const body = await request.json();
  const db = getDb();
  const service = db.services.find((s) => s.id === id);

  if (!service) {
    return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });
  }

  if (body.name) service.name = body.name;
  if (typeof body.description === "string") service.description = body.description;
  if (body.price) service.price = Number(body.price);
  if (body.duration) service.duration = Number(body.duration);
  if (typeof body.icon === "string" && body.icon) service.icon = body.icon;

  saveDb(db);
  return NextResponse.json({ service });
}

export async function DELETE(_request: Request, context: Params) {
  const { id } = await context.params;
  const db = getDb();
  const index = db.services.findIndex((s) => s.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });
  }

  db.services.splice(index, 1);
  saveDb(db);
  return NextResponse.json({ success: true });
}