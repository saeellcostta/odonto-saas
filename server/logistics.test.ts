import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("Logistics - Offices (Consultórios)", () => {
  it("should list offices", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.offices.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should create an office", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.offices.create({
      name: "Consultório 1",
      description: "Consultório principal",
    });
    expect(result).toBeDefined();
  });
});

describe("Logistics - Service Queue (Fila de Serviço)", () => {
  it("should list service queue", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.serviceQueue.list({ queueType: "dentist" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("should add patient to queue", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.serviceQueue.add({
      patientId: 1,
      patientName: "João Silva",
      queueType: "dentist",
      priority: "normal",
    });
    expect(result).toBeDefined();
  });

  it("should get queue stats", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.serviceQueue.stats();
    expect(result).toBeDefined();
    // Stats returns an object with queue type counts
    expect(result).toHaveProperty("budget");
    expect(result).toHaveProperty("dentist");
  });
});

describe("Logistics - TV Panel", () => {
  it("should get active calls", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tvPanel.activeCalls();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Logistics - Queue Flow", () => {
  it("should have forward mutation available", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Verify the forward mutation exists
    expect(caller.serviceQueue.forward).toBeDefined();
  });

  it("should have callPatient mutation available", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Verify the callPatient mutation exists
    expect(caller.serviceQueue.callPatient).toBeDefined();
  });

  it("should have startService mutation available", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Verify the startService mutation exists
    expect(caller.serviceQueue.startService).toBeDefined();
  });
});
