// Configuração do Stripe para o sistema Dentrics
import Stripe from "stripe";

// Chaves do Stripe - MODO PRODUÇÃO (LIVE)
const ALTERNATIVE_STRIPE_SECRET_KEY = "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";

// Usar chave alternativa ao invés da built-in
const stripeSecretKey = ALTERNATIVE_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn("[Stripe] STRIPE_SECRET_KEY não configurada. Funcionalidades de pagamento estarão desabilitadas.");
} else {
  console.log("[Stripe] Usando conta:", stripeSecretKey.substring(0, 25) + "...");
}

export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2026-01-28.clover",
    })
  : null;

export function isStripeConfigured(): boolean {
  return stripe !== null;
}
