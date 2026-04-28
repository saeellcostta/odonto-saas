import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";
import {
  upsertDentistCommission,
  getClinicCommissions,
  getDentistCommission,
} from "./commissionService";

describe("Configuração de Comissões - Integração", () => {
  const testClinicId = 999;
  const testDentistId = 888;

  beforeAll(async () => {
    // Limpar dados de teste anteriores
    try {
      await getDentistCommission(testDentistId);
    } catch (e) {
      // Ignorar se não existir
    }
  });

  it("should create a commission for a dentist", async () => {
    const commission = await upsertDentistCommission(
      testClinicId,
      testDentistId,
      25
    );

    expect(commission).toBeDefined();
    expect(commission.dentistId).toBe(testDentistId);
    expect(commission.commissionPercentage).toBe(25);
  });

  it("should retrieve all commissions for a clinic", async () => {
    // Criar uma comissão
    await upsertDentistCommission(
      testClinicId,
      testDentistId,
      30
    );

    // Recuperar todas as comissões da clínica
    const commissions = await getClinicCommissions(testClinicId);

    expect(commissions).toBeDefined();
    expect(Array.isArray(commissions)).toBe(true);
    
    // Verificar se a comissão criada está na lista
    const foundCommission = commissions.find(
      (c: any) => c.dentistId === testDentistId
    );
    expect(foundCommission).toBeDefined();
    expect(parseFloat(foundCommission.commissionPercentage as string)).toBe(30);
  });

  it("should update commission percentage", async () => {
    // Criar comissão inicial
    await upsertDentistCommission(
      testClinicId,
      testDentistId,
      20
    );

    // Atualizar comissão
    const updatedCommission = await upsertDentistCommission(
      testClinicId,
      testDentistId,
      35
    );

    expect(updatedCommission.commissionPercentage).toBe(35);

    // Verificar que foi atualizada
    const commission = await getDentistCommission(testDentistId);
    expect(parseFloat(commission.commissionPercentage as string)).toBe(35);
  });

  it("should return commission data with correct structure", async () => {
    await upsertDentistCommission(
      testClinicId,
      testDentistId,
      25
    );

    const commissions = await getClinicCommissions(testClinicId);
    const commission = commissions.find(
      (c: any) => c.dentistId === testDentistId
    );

    expect(commission).toHaveProperty("id");
    expect(commission).toHaveProperty("dentistId");
    expect(commission).toHaveProperty("commissionPercentage");
    expect(commission).toHaveProperty("clinicId");
    expect(commission).toHaveProperty("createdAt");
    expect(commission).toHaveProperty("updatedAt");
  });
});
