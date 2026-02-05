import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Mock do contexto com usuário autenticado e clinicId
function createMockContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    email: "test@test.com",
    name: "Test User",
    role: "admin",
    clinicId: 1,
    openId: "test-openid",
    phone: null,
    loginMethod: "email",
    isActive: true,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    passwordHash: null,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// Mock do contexto sem autenticação
function createUnauthenticatedContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("patients router", () => {
  it("should list patients when authenticated", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.patients.list();
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("should reject unauthenticated requests", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.patients.list()).rejects.toThrow();
  });

  it("should create a patient with valid data", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const patientData = {
      name: "João Silva Test",
      cpf: "123.456.789-00",
      phone: "(11) 99999-9999",
      email: "joao@email.com",
    };

    const result = await caller.patients.create(patientData);
    
    // Drizzle retorna um objeto com affectedRows e insertId
    expect(result).toBeDefined();
  });

  it("should search patients by name", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.patients.list({ search: "João" });
    
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("dashboard router", () => {
  it("should return dashboard stats", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.stats();
    
    expect(result).toBeDefined();
    expect(result.totalPatients).toBeDefined();
    expect(result.todayAppointments).toBeDefined();
    expect(result.monthlyRevenue).toBeDefined();
    expect(result.lowStockItems).toBeDefined();
    expect(result.pendingBudgets).toBeDefined();
  });
});

describe("dentists router", () => {
  it("should list dentists when authenticated", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dentists.list();
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("should reject unauthenticated requests", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.dentists.list()).rejects.toThrow();
  });

  it("should create a dentist with valid data", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const dentistData = {
      name: "Dr. Carlos Test",
      cro: "SP-12345",
      specialty: "Ortodontia",
      phone: "(11) 88888-8888",
    };

    const result = await caller.dentists.create(dentistData);
    
    expect(result).toBeDefined();
  });
});

describe("procedures router", () => {
  it("should list procedures when authenticated", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.procedures.list();
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("should reject unauthenticated requests", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.procedures.list()).rejects.toThrow();
  });
});

describe("appointments router", () => {
  it("should list appointments when authenticated", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.appointments.list();
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("should reject unauthenticated requests", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.appointments.list()).rejects.toThrow();
  });
});

describe("insurances router", () => {
  it("should list insurances when authenticated", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.insurances.list();
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("should reject unauthenticated requests", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.insurances.list()).rejects.toThrow();
  });

  it("should create an insurance when authenticated", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const insuranceData = {
      name: "Convênio Teste",
      code: "CONV001",
      phone: "(11) 77777-7777",
    };

    const result = await caller.insurances.create(insuranceData);
    
    expect(result).toBeDefined();
  });
});

describe("budgets router", () => {
  it("should list budgets when authenticated", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.budgets.list();
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("should reject unauthenticated requests", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.budgets.list()).rejects.toThrow();
  });
});
