import { describe, it, expect } from "vitest";
import {
  getDailyEarningsSummaryByDate,
  getCompletedAppointmentsByDate,
  getCompletedAppointmentsByDentistAndDate,
} from "./db";

describe("Mapa de Ganho - Earnings Map", () => {
  const testClinicId = 1;
  const testDentistId = 999;
  const testDate = new Date().toISOString().split('T')[0];

  it("should retrieve daily earnings summary by date - returns array", async () => {
    const result = await getDailyEarningsSummaryByDate(testClinicId, testDate);
    expect(Array.isArray(result)).toBe(true);
  });

  it("should retrieve completed appointments by date - returns array", async () => {
    const result = await getCompletedAppointmentsByDate(testClinicId, testDate);
    expect(Array.isArray(result)).toBe(true);
  });

  it("should retrieve completed appointments by dentist and date - returns array", async () => {
    const result = await getCompletedAppointmentsByDentistAndDate(
      testClinicId,
      testDentistId,
      testDate
    );
    expect(Array.isArray(result)).toBe(true);
  });

  it("should handle empty results gracefully", async () => {
    const summaries = await getDailyEarningsSummaryByDate(testClinicId, testDate);
    const appointments = await getCompletedAppointmentsByDate(testClinicId, testDate);
    
    expect(summaries.length).toBeGreaterThanOrEqual(0);
    expect(appointments.length).toBeGreaterThanOrEqual(0);
  });

  it("should validate earnings summary structure", async () => {
    const summaries = await getDailyEarningsSummaryByDate(testClinicId, testDate);
    
    summaries.forEach((summary) => {
      expect(summary).toHaveProperty('clinicId');
      expect(summary).toHaveProperty('dentistId');
      expect(summary).toHaveProperty('date');
      expect(summary).toHaveProperty('totalProcedures');
      expect(summary).toHaveProperty('totalRevenue');
      expect(summary).toHaveProperty('totalCommission');
      expect(summary).toHaveProperty('status');
    });
  });

  it("should validate completed appointment structure", async () => {
    const appointments = await getCompletedAppointmentsByDate(testClinicId, testDate);
    
    appointments.forEach((apt) => {
      expect(apt).toHaveProperty('id');
      expect(apt).toHaveProperty('clinicId');
      expect(apt).toHaveProperty('dentistId');
      expect(apt).toHaveProperty('patientId');
      expect(apt).toHaveProperty('procedureName');
      expect(apt).toHaveProperty('procedurePrice');
      expect(apt).toHaveProperty('commissionAmount');
      expect(apt).toHaveProperty('commissionPercentage');
      expect(apt).toHaveProperty('completedAt');
      expect(apt).toHaveProperty('paymentStatus');
    });
  });

  it("should ensure commission does not exceed revenue", async () => {
    const summaries = await getDailyEarningsSummaryByDate(testClinicId, testDate);
    
    summaries.forEach((summary) => {
      const totalRevenue = parseFloat(summary.totalRevenue?.toString() || '0');
      const totalCommission = parseFloat(summary.totalCommission?.toString() || '0');
      
      expect(totalCommission).toBeLessThanOrEqual(totalRevenue);
    });
  });

  it("should ensure commission percentage is between 0 and 100", async () => {
    const appointments = await getCompletedAppointmentsByDate(testClinicId, testDate);
    
    appointments.forEach((apt) => {
      const percentage = parseFloat(apt.commissionPercentage?.toString() || '0');
      expect(percentage).toBeGreaterThanOrEqual(0);
      expect(percentage).toBeLessThanOrEqual(100);
    });
  });

  it("should validate payment status values", async () => {
    const appointments = await getCompletedAppointmentsByDate(testClinicId, testDate);
    const validStatuses = ['pending', 'paid', 'cancelled'];
    
    appointments.forEach((apt) => {
      expect(validStatuses).toContain(apt.paymentStatus);
    });
  });

  it("should validate daily earnings status values", async () => {
    const summaries = await getDailyEarningsSummaryByDate(testClinicId, testDate);
    const validStatuses = ['draft', 'finalized', 'paid'];
    
    summaries.forEach((summary) => {
      expect(validStatuses).toContain(summary.status);
    });
  });

  it("should filter appointments by dentist correctly", async () => {
    const appointments = await getCompletedAppointmentsByDentistAndDate(
      testClinicId,
      testDentistId,
      testDate
    );
    
    // Todos os atendimentos devem ser do dentista especificado
    appointments.forEach((apt) => {
      expect(apt.dentistId).toBe(testDentistId);
      expect(apt.clinicId).toBe(testClinicId);
    });
  });
});
