import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  upsertDentistCommission,
  getClinicCommissions,
  getDentistCommission,
  deleteDentistCommission,
} from "./commissionService";
import { getDb } from "./db";
import { dentistCommissions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Commission Service", () => {
  const testClinicId = 1;
  const testDentistId = 999;

  beforeAll(async () => {
    // Limpar dados de teste antes de começar
    const db = await getDb();
    if (db) {
      await db
        .delete(dentistCommissions)
        .where(eq(dentistCommissions.dentistId, testDentistId));
    }
  });

  afterAll(async () => {
    // Limpar dados de teste após terminar
    const db = await getDb();
    if (db) {
      await db
        .delete(dentistCommissions)
        .where(eq(dentistCommissions.dentistId, testDentistId));
    }
  });

  it("should create a new commission", async () => {
    const result = await upsertDentistCommission(
      testClinicId,
      testDentistId,
      15
    );

    expect(result.success).toBe(true);
    expect(result.message).toContain("criada");
    expect(result.id).toBeDefined();
  });

  it("should update an existing commission", async () => {
    // Criar primeira comissão
    await upsertDentistCommission(testClinicId, testDentistId, 15);

    // Atualizar comissão
    const result = await upsertDentistCommission(
      testClinicId,
      testDentistId,
      25
    );

    expect(result.success).toBe(true);
    expect(result.message).toContain("atualizada");
  });

  it("should retrieve commission for a dentist", async () => {
    // Criar comissão
    await upsertDentistCommission(testClinicId, testDentistId, 20);

    // Buscar comissão
    const commission = await getDentistCommission(testDentistId);

    expect(commission).toBeDefined();
    expect(commission?.dentistId).toBe(testDentistId);
    expect(Number(commission?.commissionPercentage)).toBe(20);
  });

  it("should list clinic commissions", async () => {
    // Criar comissão
    await upsertDentistCommission(testClinicId, testDentistId, 18);

    // Listar comissões da clínica
    const commissions = await getClinicCommissions(testClinicId);

    expect(Array.isArray(commissions)).toBe(true);
    expect(commissions.length).toBeGreaterThan(0);

    const testCommission = commissions.find(
      (c) => c.dentistId === testDentistId
    );
    expect(testCommission).toBeDefined();
  });

  it("should delete a commission", async () => {
    // Criar comissão
    await upsertDentistCommission(testClinicId, testDentistId, 15);

    // Deletar comissão
    const result = await deleteDentistCommission(testDentistId);

    expect(result.success).toBe(true);

    // Verificar que foi deletada
    const commission = await getDentistCommission(testDentistId);
    expect(commission).toBeNull();
  });

  it("should validate commission percentage range", async () => {
    // Tentar criar com percentual inválido
    await expect(
      upsertDentistCommission(testClinicId, testDentistId, 150)
    ).rejects.toThrow();

    await expect(
      upsertDentistCommission(testClinicId, testDentistId, -10)
    ).rejects.toThrow();
  });

  it("should require clinicId and dentistId", async () => {
    // Tentar criar sem clinicId
    await expect(
      upsertDentistCommission(0, testDentistId, 15)
    ).rejects.toThrow();

    // Tentar criar sem dentistId
    await expect(
      upsertDentistCommission(testClinicId, 0, 15)
    ).rejects.toThrow();
  });
});
