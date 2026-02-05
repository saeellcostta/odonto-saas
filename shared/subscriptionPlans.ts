// Planos de assinatura do Dentrics
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number; // em centavos (R$ 149,00 = 14900)
  priceDisplay: string;
  interval: "month" | "year";
  features: string[];
  highlighted?: boolean;
  badge?: string;
  limits: {
    patients: number | "unlimited";
    users: number;
    dentists: number;
    storage: string;
    aiAnalysis: number | "unlimited";
    whatsappNotifications: boolean;
    customReports: boolean;
    prioritySupport: boolean;
    multiClinic: boolean;
    apiAccess: boolean;
  };
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "Básico",
    description: "Ideal para clínicas pequenas e consultórios individuais",
    price: 14900, // R$ 149,00
    priceDisplay: "R$ 149",
    interval: "month",
    features: [
      "Até 200 pacientes",
      "2 usuários",
      "1 dentista",
      "Agenda e prontuário",
      "Orçamentos básicos",
      "Relatórios simples",
      "Suporte por email",
    ],
    limits: {
      patients: 200,
      users: 2,
      dentists: 1,
      storage: "5GB",
      aiAnalysis: 10,
      whatsappNotifications: false,
      customReports: false,
      prioritySupport: false,
      multiClinic: false,
      apiAccess: false,
    },
  },
  {
    id: "professional",
    name: "Profissional",
    description: "Para clínicas em crescimento que precisam de mais recursos",
    price: 29900, // R$ 299,00
    priceDisplay: "R$ 299",
    interval: "month",
    highlighted: true,
    badge: "Mais Popular",
    features: [
      "Pacientes ilimitados",
      "5 usuários",
      "3 dentistas",
      "Agenda e prontuário completo",
      "Orçamentos com odontograma",
      "Análise de IA para radiografias",
      "Notificações WhatsApp",
      "Relatórios avançados",
      "Painel TV para sala de espera",
      "Suporte por chat",
    ],
    limits: {
      patients: "unlimited",
      users: 5,
      dentists: 3,
      storage: "50GB",
      aiAnalysis: 100,
      whatsappNotifications: true,
      customReports: true,
      prioritySupport: false,
      multiClinic: false,
      apiAccess: false,
    },
  },
  {
    id: "premium",
    name: "Premium",
    description: "Solução completa para redes de clínicas e grandes operações",
    price: 49900, // R$ 499,00
    priceDisplay: "R$ 499",
    interval: "month",
    badge: "Completo",
    features: [
      "Pacientes ilimitados",
      "Usuários ilimitados",
      "Dentistas ilimitados",
      "Todas as funcionalidades",
      "Análise de IA ilimitada",
      "Multi-clínicas",
      "API para integrações",
      "Relatórios personalizados",
      "Suporte prioritário 24/7",
      "Treinamento dedicado",
      "Backup em tempo real",
    ],
    limits: {
      patients: "unlimited",
      users: 999,
      dentists: 999,
      storage: "500GB",
      aiAnalysis: "unlimited",
      whatsappNotifications: true,
      customReports: true,
      prioritySupport: true,
      multiClinic: true,
      apiAccess: true,
    },
  },
];

export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId);
}

export function getDefaultPlan(): SubscriptionPlan {
  return SUBSCRIPTION_PLANS.find((plan) => plan.highlighted) || SUBSCRIPTION_PLANS[0];
}
