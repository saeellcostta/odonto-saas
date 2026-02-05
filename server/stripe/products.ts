/**
 * Stripe Products Configuration
 * Define all Stripe products and prices here for centralized access
 */

export const STRIPE_PRODUCTS = {
  TREATMENT_PAYMENT: {
    name: "Pagamento de Tratamento Odontológico",
    description: "Pagamento de procedimentos e tratamentos odontológicos",
    priceId: process.env.STRIPE_TREATMENT_PRICE_ID || "",
  },
  BUDGET_PAYMENT: {
    name: "Pagamento de Orçamento",
    description: "Pagamento de orçamento odontológico aprovado",
    priceId: process.env.STRIPE_BUDGET_PRICE_ID || "",
  },
  SUBSCRIPTION_BASIC: {
    name: "Plano Básico Dentrics",
    description: "Assinatura mensal do plano básico",
    priceId: process.env.STRIPE_BASIC_PLAN_PRICE_ID || "",
  },
  SUBSCRIPTION_PRO: {
    name: "Plano Profissional Dentrics",
    description: "Assinatura mensal do plano profissional",
    priceId: process.env.STRIPE_PRO_PLAN_PRICE_ID || "",
  },
};

export type StripeProductKey = keyof typeof STRIPE_PRODUCTS;
