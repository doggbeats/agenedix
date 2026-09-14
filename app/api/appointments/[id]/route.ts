import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Params) {
  const { id } = await context.params;
  const db = getDb();
  const appointment = db.appointments.find((a) => a.id === id);

  if (!appointment) {
    return NextResponse.json(
      { error: "Agendamento não encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({ appointment });
}

export async function PATCH(request: Request, context: Params) {
  const { id } = await context.params;
  const body = await request.json();
  const db = getDb();
  const appointment = db.appointments.find((a) => a.id === id);

  if (!appointment) {
    return NextResponse.json(
      { error: "Agendamento não encontrado" },
      { status: 404 }
    );
  }

  const isClientCancel =
    Object.keys(body).length === 1 && body.status === "cancelled";
  if (!isClientCancel && !(await requireAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (
    body.status &&
    ["confirmed", "cancelled", "completed"].includes(body.status)
  ) {
    appointment.status = body.status;
  }
  if (typeof body.clientName === "string" && body.clientName) {
    appointment.clientName = body.clientName;
  }
  if (typeof body.barberId === "string" && body.barberId) {
    appointment.barberId = body.barberId;
  }

  saveDb(db);
  return NextResponse.json({ appointment });
}

export async function DELETE(_request: Request, context: Params) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await context.params;
  const db = getDb();
  const index = db.appointments.findIndex((a) => a.id === id);

  if (index === -1) {
    return NextResponse.json(
      { error: "Agendamento não encontrado" },
      { status: 404 }
    );
  }

  db.appointments.splice(index, 1);
  saveDb(db);
  return NextResponse.json({ success: true });
}