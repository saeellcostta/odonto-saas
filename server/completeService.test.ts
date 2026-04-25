import { describe, it, expect } from "vitest";
import {
  getCompletedAppointmentsByDentist,
  getDailyEarningsSummary,
  getCompletedAppointmentsByDate,
} from "./db";

describe("Complete Service - Validação de Dados de Ganhos", () => {
  const testClinicId = 1;
  const testDentistId = 1;
  const today = new Date().toISOString().split('T')[0];

  it("should retrieve completed appointments for dentist", async () => {
    const appointments = await getCompletedAppointmentsByDentist(testClinicId, testDentistId);
    expect(Array.isArray(appointments)).toBe(true);
  });

  it("should retrieve daily earnings summary", async () => {
    const summary = await getDailyEarningsSummary(testClinicId, testDentistId, today);
    
    if (summary) {
      expect(summary.clinicId).toBe(testClinicId);
      expect(summary.dentistId).toBe(testDentistId);
      expect(summary.totalProcedures).toBeGreaterThanOrEqual(0);
      expect(summary.totalRevenue).toBeDefined();
      expect(summary.totalCommission).toBeDefined();
    }
  });

  it("should validate completed appointment structure", async () => {
    const appointments = await getCompletedAppointmentsByDentist(testClinicId, testDentistId);
    
    appointments.forEach((apt) => {
      expect(apt).toHaveProperty('id');
      expect(apt).toHaveProperty('clinicId');
      expect(apt).toHaveProperty('dentistId');
      expect(apt).toHaveProperty('patientId');
      expect(apt).toHaveProperty('procedureName');
      expect(apt).toHaveProperty('procedurePrice');
      expect(apt).toHaveProperty('commissionPercentage');
      expect(apt).toHaveProperty('commissionAmount');
      expect(apt).toHaveProperty('completedAt');
      expect(apt).toHaveProperty('paymentStatus');
    });
  });

  it("should ensure commission does not exceed revenue", async () => {
    const appointments = await getCompletedAppointmentsByDentist(testClinicId, testDentistId);
    
    appointments.forEach((apt) => {
      const procedurePrice = parseFloat(apt.procedurePrice?.toString() || '0');
      const commissionAmount = parseFloat(apt.commissionAmount?.toString() || '0');
      
      expect(commissionAmount).toBeLessThanOrEqual(procedurePrice);
    });
  });

  it("should validate commission percentage is between 0 and 100", async () => {
    const appointments = await getCompletedAppointmentsByDentist(testClinicId, testDentistId);
    
    appointments.forEach((apt) => {
      const percentage = parseFloat(apt.commissionPercentage?.toString() || '0');
      expect(percentage).toBeGreaterThanOrEqual(0);
      expect(percentage).toBeLessThanOrEqual(100);
    });
  });

  it("should validate payment status values", async () => {
    const appointments = await getCompletedAppointmentsByDentist(testClinicId, testDentistId);
    const validStatuses = ['pending', 'paid', 'cancelled'];
    
    appointments.forEach((apt) => {
      expect(validStatuses).toContain(apt.paymentStatus);
    });
  });

  it("should retrieve completed appointments by date", async () => {
    const appointments = await getCompletedAppointmentsByDate(testClinicId, today);
    expect(Array.isArray(appointments)).toBe(true);
  });

  it("should calculate correct commission amounts", async () => {
    const appointments = await getCompletedAppointmentsByDentist(testClinicId, testDentistId);
    
    appointments.forEach((apt) => {
      const procedurePrice = parseFloat(apt.procedurePrice?.toString() || '0');
      const commissionPercentage = parseFloat(apt.commissionPercentage?.toString() || '0');
      const commissionAmount = parseFloat(apt.commissionAmount?.toString() || '0');
      
      // Validar cálculo: comissão = preço * percentual / 100
      const expectedCommission = (procedurePrice * commissionPercentage) / 100;
      expect(Math.abs(commissionAmount - expectedCommission)).toBeLessThan(0.01);
    });
  });

  it("should validate daily earnings summary calculations", async () => {
    const summary = await getDailyEarningsSummary(testClinicId, testDentistId, today);
    
    if (summary) {
      const totalRevenue = parseFloat(summary.totalRevenue?.toString() || '0');
      const totalCommission = parseFloat(summary.totalCommission?.toString() || '0');
      
      // Comissão total não deve ser maior que receita total
      expect(totalCommission).toBeLessThanOrEqual(totalRevenue);
      
      // Se há procedimentos, deve haver receita
      if (summary.totalProcedures > 0) {
        expect(totalRevenue).toBeGreaterThan(0);
      }
    }
  });

  it("should validate daily earnings status values", async () => {
    const summary = await getDailyEarningsSummary(testClinicId, testDentistId, today);
    const validStatuses = ['draft', 'finalized', 'paid'];
    
    if (summary) {
      expect(validStatuses).toContain(summary.status);
    }
  });
});
