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
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    clinicId: 1, // Added clinicId to fix the test
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

describe("Orthodontics Module", () => {
  it("should list orthodontic treatments", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.orthodontics.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should get orthodontics stats", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.orthodontics.stats();
    expect(result).toHaveProperty("activeTreatments");
    expect(result).toHaveProperty("completedTreatments");
    expect(result).toHaveProperty("totalPatients");
    expect(result).toHaveProperty("pendingMaintenances");
  });
});

describe("Implants Module", () => {
  it("should list implant plans", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.implants.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should get implants stats", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.implants.stats();
    expect(result).toHaveProperty("planningPhase");
    expect(result).toHaveProperty("surgeryScheduled");
    expect(result).toHaveProperty("healingPhase");
    expect(result).toHaveProperty("prosthesisPhase");
    expect(result).toHaveProperty("completed");
    expect(result).toHaveProperty("totalImplants");
  });
});

describe("WhatsApp Notifications Module", () => {
  it("should list notifications", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.whatsapp.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should get pending notifications", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.whatsapp.getPending();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should get notification settings", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.notificationSettings.get();
    expect(result).toBeDefined();
  });
});

describe("Access Profiles Module", () => {
  it("should list access profiles", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.accessProfiles.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should create and delete access profile", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Create profile
    const createResult = await caller.accessProfiles.create({
      name: "Test Profile",
      description: "Test description",
      permissions: JSON.stringify({ dashboard: { view: true } }),
    });
    expect(createResult).toHaveProperty("id");
    
    // Delete profile
    await caller.accessProfiles.delete({ id: createResult.id });
    
    // Verify deletion
    const profiles = await caller.accessProfiles.list();
    const found = profiles.find(p => p.id === createResult.id);
    expect(found).toBeUndefined();
  });
});

describe("Appointments Module", () => {
  it("should list appointments", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.appointments.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should list treatments", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.treatments.list({ patientId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});
