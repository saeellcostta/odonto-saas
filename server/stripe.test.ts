import { describe, expect, it, vi } from "vitest";
import { isStripeConfigured } from "./stripe/stripe";

describe("Stripe Integration", () => {
  it("should check if Stripe is configured", () => {
    // O teste verifica se a função isStripeConfigured existe e retorna um boolean
    const result = isStripeConfigured();
    expect(typeof result).toBe("boolean");
  });

  it("should have stripe products defined", async () => {
    const { STRIPE_PRODUCTS } = await import("./stripe/products");
    
    expect(STRIPE_PRODUCTS).toBeDefined();
    expect(STRIPE_PRODUCTS.TREATMENT_PAYMENT).toBeDefined();
    expect(STRIPE_PRODUCTS.TREATMENT_PAYMENT.name).toBe("Pagamento de Tratamento Odontológico");
    expect(STRIPE_PRODUCTS.BUDGET_PAYMENT).toBeDefined();
    expect(STRIPE_PRODUCTS.BUDGET_PAYMENT.name).toBe("Pagamento de Orçamento");
  });
});
