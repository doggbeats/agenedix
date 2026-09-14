import fs from "node:fs";
import path from "node:path";
import type { Appointment, Barber, Client, Service, TimeSlot } from "./types";
import { seedBarbers, seedServices } from "./data";

export interface Database {
  services: Service[];
  barbers: Barber[];
  clients: Client[];
  appointments: Appointment[];
}

export const workingHours = {
  start: 9, // 09:00
  end: 19, // 19:00
  interval: 30, // slots de 30min
};

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

export function getDb(): Database {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      return {
        services: parsed.services ?? [],
        barbers: parsed.barbers ?? [],
        clients: parsed.clients ?? [],
        appointments: parsed.appointments ?? [],
      };
    }
  } catch {
    // arquivo corrompido: recria a partir do seed
  }

  const initial: Database = {
    services: seedServices,
    barbers: seedBarbers,
    clients: [],
    appointments: [],
  };
  saveDb(initial);
  return initial;
}

export function saveDb(db: Database): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function findService(db: Database, serviceId: string): Service | undefined {
  return db.services.find((s) => s.id === serviceId);
}

export function findBarber(db: Database, barberId: string): Barber | undefined {
  return db.barbers.find((b) => b.id === barberId);
}

export function generateTimeSlots(
  db: Database,
  date: string,
  barberId: string,
  serviceDuration: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const { start, end, interval } = workingHours;
  const realBarbers = db.barbers
    .filter((b) => b.id !== "any" && b.available)
    .map((b) => b.id);

  for (let hour = start; hour < end; hour++) {
    for (let min = 0; min < 60; min += interval) {
      const time = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
      const slotEndMinutes = hour * 60 + min + serviceDuration;

      if (slotEndMinutes > end * 60) continue;

      let isAvailable: boolean;

      if (barberId === "any") {
        isAvailable = realBarbers.some(
          (b) => !isBarberBusy(db, b, date, time, serviceDuration)
        );
      } else {
        isAvailable = !isBarberBusy(db, barberId, date, time, serviceDuration);
      }

      slots.push({ time, available: isAvailable });
    }
  }

  return slots;
}

function isBarberBusy(
  db: Database,
  barberId: string,
  date: string,
  time: string,
  serviceDuration: number
): boolean {
  return db.appointments.some(
    (a) =>
      a.date === date &&
      a.barberId === barberId &&
      a.status === "confirmed" &&
      isTimeOverlap(
        time,
        a.time,
        getServiceDuration(db, a.serviceId),
        serviceDuration
      )
  );
}

function isTimeOverlap(
  start1: string,
  start2: string,
  duration1: number,
  duration2: number
): boolean {
  const [h1, m1] = start1.split(":").map(Number);
  const [h2, m2] = start2.split(":").map(Number);
  const s1 = h1 * 60 + m1;
  const s2 = h2 * 60 + m2;
  return s1 < s2 + duration2 && s2 < s1 + duration1;
}

function getServiceDuration(db: Database, serviceId: string): number {
  return findService(db, serviceId)?.duration ?? 30;
}