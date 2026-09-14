export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // em minutos
  icon: string;
}

export interface Barber {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  available: boolean;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  password: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  barberId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: "confirmed" | "cancelled" | "completed";
  createdAt: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}
