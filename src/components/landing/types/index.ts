export interface AppointmentItem {
  id: string;
  time: string;
  duration: string;
  service: string;
  professional: string;
  status: 'Confirmado' | 'Pendente' | 'Em atendimento' | 'Concluído';
  price?: string;
  client?: string;
}

export interface BusinessNiche {
  id: string;
  name: string;
  label: string;
  iconName: string;
  tagline: string;
  description: string;
  sampleAppointments: AppointmentItem[];
  services: {
    id: string;
    title: string;
    duration: string;
    price: string;
    description: string;
  }[];
  professionals: {
    id: string;
    name: string;
    role: string;
    avatar: string;
    rating: string;
  }[];
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

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
  highlightMetric: string;
  rating: number;
}
