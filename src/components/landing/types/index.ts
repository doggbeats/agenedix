export interface AppointmentItem {
  id: string;
  time: string;
  duration: string;
  service: string;
  professional: string;
  status: "Confirmado" | "Pendente" | "Atendimento" | "Concluído";
  price?: string;
  client?: string;
}

export interface NicheService {
  id: string;
  title: string;
  duration: string;
  price: string;
  description: string;
}

export interface NicheProfessional {
  id: string;
  name: string;
  role: string;
  initials: string;
}

export interface BusinessNiche {
  id: string;
  name: string;
  label: string;
  iconName: string;
  tagline: string;
  description: string;
  sampleAppointments: AppointmentItem[];
  services: NicheService[];
  professionals: NicheProfessional[];
}

export interface PricingPlan {
  id: string;
  slug?: string;
  name: string;
  badge?: string;
  isPopular?: boolean;
  priceMonthly: number;
  /** Valor mensal equivalente quando a cobrança é anual. */
  priceAnnual: number;
  description: string;
  features: string[];
  ctaText: string;
  trialDays?: number;
}

export interface Scenario {
  id: string;
  segment: string;
  title: string;
  description: string;
  bullets: string[];
}
