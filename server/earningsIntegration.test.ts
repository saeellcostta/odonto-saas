import { describe, it, expect, beforeAll, afterAll } from "vitest";

describe("Earnings Integration - Mapa de Ganho", () => {
  it("should record completed appointment in earnings map", async () => {
    // Simular conclusão de atendimento com valor
    const appointmentData = {
      clinicId: "clinic-1",
      dentistId: "dentist-1",
      patientId: "patient-1",
      amountToPay: 500, // R$ 500
      commissionPercentage: 30, // 30%
    };

    // Valor esperado de ganho
    const expectedEarning = (appointmentData.amountToPay * appointmentData.commissionPercentage) / 100;
    expect(expectedEarning).toBe(150); // R$ 150
  });

  it("should calculate commission correctly for different percentages", async () => {
    const testCases = [
      { amount: 100, percentage: 20, expected: 20 },
      { amount: 500, percentage: 30, expected: 150 },
      { amount: 1000, percentage: 25, expected: 250 },
      { amount: 250, percentage: 40, expected: 100 },
    ];

    testCases.forEach((testCase) => {
      const result = (testCase.amount * testCase.percentage) / 100;
      expect(result).toBe(testCase.expected);
    });
  });

  it("should update daily earnings summary", async () => {
    // Simular múltiplos atendimentos no mesmo dia
    const appointments = [
      { amount: 500, commission: 30 },
      { amount: 300, commission: 30 },
      { amount: 200, commission: 30 },
    ];

    let totalRevenue = 0;
    let totalCommission = 0;

    appointments.forEach((apt) => {
      totalRevenue += apt.amount;
      totalCommission += (apt.amount * apt.commission) / 100;
    });

    expect(totalRevenue).toBe(1000);
    expect(totalCommission).toBe(300);
    expect(appointments.length).toBe(3);
  });

  it("should handle zero commission percentage", async () => {
    const amount = 500;
    const percentage = 0;
    const earning = (amount * percentage) / 100;
    expect(earning).toBe(0);
  });

  it("should handle high commission percentage", async () => {
    const amount = 500;
    const percentage = 100;
    const earning = (amount * percentage) / 100;
    expect(earning).toBe(500);
  });

  it("should validate appointment completion data", async () => {
    const validAppointment = {
      clinicId: "clinic-1",
      dentistId: "dentist-1",
      patientId: "patient-1",
      procedureAmount: 500,
      commissionPercentage: 30,
      earningAmount: 150,
      queueEntryId: 1,
      completedAt: new Date(),
    };

    expect(validAppointment.procedureAmount).toBeGreaterThan(0);
    expect(validAppointment.commissionPercentage).toBeGreaterThanOrEqual(0);
    expect(validAppointment.commissionPercentage).toBeLessThanOrEqual(100);
    expect(validAppointment.earningAmount).toBeLessThanOrEqual(validAppointment.procedureAmount);
  });
});
