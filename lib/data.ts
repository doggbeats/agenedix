import { Barber, Service } from "./types";

export const seedServices: Service[] = [
  {
    id: "corte-classico",
    name: "Corte Clássico",
    description: "Corte masculino com máquina e tesoura, inclui lavagem.",
    price: 45,
    duration: 30,
    icon: "✂️",
  },
  {
    id: "corte-degrade",
    name: "Corte Degradê",
    description: "Degradê perfeito com acabamento na navalha.",
    price: 55,
    duration: 40,
    icon: "💇",
  },
  {
    id: "barba",
    name: "Barba",
    description: "Aparar e modelar a barba com navalha quente.",
    price: 35,
    duration: 25,
    icon: "🪒",
  },
  {
    id: "corte-barba",
    name: "Corte + Barba",
    description: "Combo completo: corte masculino e barba.",
    price: 80,
    duration: 60,
    icon: "🔥",
  },
  {
    id: "sobrancelha",
    name: "Sobrancelha",
    description: "Design de sobrancelha com navalha.",
    price: 20,
    duration: 15,
    icon: "👁️",
  },
  {
    id: "corte-infantil",
    name: "Corte Infantil",
    description: "Corte para crianças até 12 anos.",
    price: 35,
    duration: 30,
    icon: "👦",
  },
];

export const seedBarbers: Barber[] = [
  {
    id: "carlos",
    name: "Carlos Silva",
    specialty: "Degradê e cortes modernos",
    avatar: "CS",
    available: true,
  },
  {
    id: "rafael",
    name: "Rafael Oliveira",
    specialty: "Barbas e navalha quente",
    avatar: "RO",
    available: true,
  },
  {
    id: "marcos",
    name: "Marcos Costa",
    specialty: "Cortes clássicos e infantil",
    avatar: "MC",
    available: true,
  },
  {
    id: "any",
    name: "Qualquer barbeiro",
    specialty: "Disponível para todos os serviços",
    avatar: "✓",
    available: true,
  },
];