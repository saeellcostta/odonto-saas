// Configuração do Stripe para o sistema Dentrics
import Stripe from "stripe";

// Chaves alternativas do Stripe (conta sem restrições)
const ALTERNATIVE_STRIPE_SECRET_KEY = "sk_test_51SxJplDmY17h3OvJ1NPBM0BO56BH9Zc7Zs5Anf9bwu7yRSnGfbGXfi6cQqPkSLOKEKxHWtdV23ra5HI1OeAtJepa00GvOXEaCC";

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
