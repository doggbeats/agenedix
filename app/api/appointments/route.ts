import { NextRequest, NextResponse } from "next/server";
import { findBarber, findService, generateId, generateTimeSlots, getDb, saveDb } from "@/lib/db";
import { Appointment } from "@/lib/types";
import { maskPhone } from "@/lib/utils";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const barberId = searchParams.get("barberId");
  const serviceId = searchParams.get("serviceId");
  const phone = searchParams.get("phone");

  const db = getDb();

  if (date && barberId && serviceId) {
    const service = findService(db, serviceId);
    if (!service) {
      return NextResponse.json({ error: "Serviço não encontrado" }, { status: 400 });
    }
    const slots = generateTimeSlots(db, date, barberId, service.duration);
    return NextResponse.json({ slots });
  }

  if (!phone && !(await requireAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const list = phone
    ? db.appointments.filter((a) => a.clientPhone === maskPhone(phone))
    : db.appointments;

  return NextResponse.json({ appointments: list });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { clientName, clientPhone, serviceId, barberId, date, time } = body;

  if (!clientName || !clientPhone || !serviceId || !barberId || !date || !time) {
    return NextResponse.json(
      { error: "Todos os campos são obrigatórios" },
      { status: 400 }
    );
  }

  const db = getDb();
  const service = findService(db, serviceId);
  const barber = findBarber(db, barberId);

  if (!service || !barber) {
    return NextResponse.json(
      { error: "Serviço ou barbeiro inválido" },
      { status: 400 }
    );
  }

  const slots = generateTimeSlots(db, date, barberId, service.duration);
  const slot = slots.find((s) => s.time === time);

  if (!slot || !slot.available) {
    return NextResponse.json(
      { error: "Horário indisponível" },
      { status: 409 }
    );
  }

  // Registra o cliente automaticamente (upsert por telefone)
  const cleanPhone = maskPhone(String(clientPhone));
  const existingClient = db.clients.find((c) => c.phone === cleanPhone);
  if (existingClient) {
    existingClient.name = clientName;
  } else {
    db.clients.unshift({
      id: generateId("cli"),
      name: clientName,
      phone: cleanPhone,
      email: "",
      password: "",
      createdAt: new Date().toISOString(),
    });
  }

  const appointment: Appointment = {
    id: generateId("app"),
    clientName,
    clientPhone: cleanPhone,
    serviceId,
    barberId,
    date,
    time,
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };

  db.appointments.push(appointment);
  saveDb(db);

  return NextResponse.json({ appointment }, { status: 201 });
}