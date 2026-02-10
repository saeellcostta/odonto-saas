import { describe, expect, it, beforeAll, afterAll } from "vitest";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(clinicId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    clinicId,
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("dashboard.paymentStats", () => {
  it("returns pending payment counts for clinic", async () => {
    const clinicId = 1;
    const ctx = createAuthContext(clinicId);

    // Get pending payments
    const pendingPayments = await db.getPendingPayments(clinicId);

    // Verify it returns an array
    expect(Array.isArray(pendingPayments)).toBe(true);

    // Verify each entry has required fields
    if (pendingPayments.length > 0) {
      const entry = pendingPayments[0];
      expect(entry).toHaveProperty("id");
      expect(entry).toHaveProperty("clinicId");
      expect(entry).toHaveProperty("status");
      expect(entry).toHaveProperty("paymentStatus");
    }
  });

  it("returns return alerts for clinic", async () => {
    const clinicId = 1;
    const ctx = createAuthContext(clinicId);

    // Get return alerts
    const returnAlerts = await db.getReturnAlerts(clinicId);

    // Verify it returns an array
    expect(Array.isArray(returnAlerts)).toBe(true);

    // Verify each alert has required fields
    if (returnAlerts.length > 0) {
      const alert = returnAlerts[0];
      expect(alert).toHaveProperty("id");
      expect(alert).toHaveProperty("clinicId");
      expect(alert).toHaveProperty("status");
    }
  });

  it("filters pending payments by clinicId", async () => {
    const clinicId = 1;

    // Get pending payments for clinic 1
    const payments = await db.getPendingPayments(clinicId);

    // Verify all payments belong to clinic 1
    payments.forEach((payment) => {
      expect(payment.clinicId).toBe(clinicId);
      expect(payment.status).toBe("pending_payment");
      expect(["pending", "partial"]).toContain(payment.paymentStatus);
    });
  });

  it("filters return alerts by clinicId", async () => {
    const clinicId = 1;

    // Get return alerts for clinic 1
    const alerts = await db.getReturnAlerts(clinicId);

    // Verify all alerts belong to clinic 1
    alerts.forEach((alert) => {
      expect(alert.clinicId).toBe(clinicId);
    });
  });
});

describe("dashboard.stats", () => {
  it("returns dashboard statistics for clinic", async () => {
    const clinicId = 1;

    // Get dashboard stats
    const stats = await db.getDashboardStats(clinicId);

    // Verify it returns an object with expected properties
    expect(stats).toHaveProperty("totalPatients");
    expect(stats).toHaveProperty("todayAppointments");
    expect(stats).toHaveProperty("pendingBudgets");
    expect(stats).toHaveProperty("monthlyRevenue");
    expect(stats).toHaveProperty("lowStockItems");
    expect(stats).toHaveProperty("waitingPatients");

    // Verify values are numbers or strings (monthlyRevenue pode ser string)
    expect(typeof stats.totalPatients).toBe("number");
    expect(typeof stats.todayAppointments).toBe("number");
    expect(typeof stats.pendingBudgets).toBe("number");
    expect(["number", "string"]).toContain(typeof stats.monthlyRevenue);
    expect(typeof stats.lowStockItems).toBe("number");
    expect(typeof stats.waitingPatients).toBe("number");

    // Verify values are non-negative
    expect(stats.totalPatients).toBeGreaterThanOrEqual(0);
    expect(stats.todayAppointments).toBeGreaterThanOrEqual(0);
    expect(stats.pendingBudgets).toBeGreaterThanOrEqual(0);
    // monthlyRevenue pode ser string, entao apenas verificar que existe
    expect(stats.monthlyRevenue).toBeDefined();
    expect(stats.lowStockItems).toBeGreaterThanOrEqual(0);
    expect(stats.waitingPatients).toBeGreaterThanOrEqual(0);
  });
});
