// Configuração do Stripe para o sistema Dentrics
import Stripe from "stripe";

// Inicializa o cliente Stripe com a chave secreta
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn("[Stripe] STRIPE_SECRET_KEY não configurada. Funcionalidades de pagamento estarão desabilitadas.");
}

export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2026-01-28.clover",
    })
  : null;

export function isStripeConfigured(): boolean {
  return stripe !== null;
}
