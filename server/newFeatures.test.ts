import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthenticatedContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-openid",
    email: "test@dentrics.com",
    name: "Test User",
    loginMethod: "email",
    role: "admin",
    clinicId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Dashboard Advanced Stats", () => {
  it("should return advanced dashboard stats structure", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.dashboard.advanced();
    
    expect(result).toHaveProperty("budgetEvolution");
    expect(result).toHaveProperty("paymentMethods");
    expect(result).toHaveProperty("conversionRate");
    expect(result.conversionRate).toHaveProperty("approved");
    expect(result.conversionRate).toHaveProperty("rejected");
    expect(result.conversionRate).toHaveProperty("pending");
  });

  it("should return queue stats structure", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.dashboard.queueStats();
    
    expect(result).toHaveProperty("budgetQueue");
    expect(result).toHaveProperty("dentistQueue");
    expect(result).toHaveProperty("orthodonticsQueue");
    expect(result).toHaveProperty("implantQueue");
    expect(result).toHaveProperty("prosthesisQueue");
    expect(result).toHaveProperty("inService");
    expect(result).toHaveProperty("completedToday");
  });
});

describe("Laboratories", () => {
  it("should list laboratories", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.laboratories.list();
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("should create a laboratory", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.laboratories.create({
      name: "Lab Teste",
      phone: "(11) 99999-9999",
      email: "lab@teste.com",
    });
    
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });
});

describe("Prosthesis Types", () => {
  it("should list prosthesis types", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.prosthesisTypes.list();
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("should create a prosthesis type", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.prosthesisTypes.create({
      name: "Coroa de Porcelana",
      description: "Coroa total em porcelana",
      defaultPrice: "1500.00",
      estimatedDays: 10,
    });
    
    expect(result).toHaveProperty("id");
  });
});

describe("Prosthesis Orders", () => {
  it("should list prosthesis orders", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.prosthesisOrders.list();
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("should return prosthesis stats", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.prosthesisOrders.stats();
    
    expect(result).toHaveProperty("pending");
    expect(result).toHaveProperty("installed");
    expect(result).toHaveProperty("labCost");
    expect(result).toHaveProperty("revenue");
  });
});

describe("AI Analysis", () => {
  it("should list AI analyses", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.aiAnalysis.list();
    
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Check-ins", () => {
  it("should list check-ins", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.checkins.list();
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("should create a check-in", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.checkins.create({
      patientName: "João Silva",
      phone: "(11) 99999-9999",
      reason: "Consulta de rotina",
      queueType: "budget",
    });
    
    expect(result).toHaveProperty("id");
  });
});
