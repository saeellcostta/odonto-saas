import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Debug - Mapa de Ganho Data Retrieval", () => {
  it("should check if there are any dentists in the database", async () => {
    // Verificar se há dentistas
    const dentists = await db.getDentists(1); // clinic_id = 1
    console.log("Total dentistas:", dentists.length);
    console.log("Dentistas completos:", JSON.stringify(dentists, null, 2));
    expect(Array.isArray(dentists)).toBe(true);
  });

  it("should check if there are any completed appointments", async () => {
    // Verificar se há atendimentos completados
    const appointments = await db.getCompletedAppointmentsByDate(1); // clinic_id = 1
    console.log("Total atendimentos completados:", appointments.length);
    console.log("Atendimentos completos:", JSON.stringify(appointments, null, 2));
    if (appointments.length > 0) {
      console.log("Primeiro atendimento:", appointments[0]);
      console.log("Data do atendimento:", appointments[0].completedAt);
      console.log("Dentista ID:", appointments[0].dentistId);
    }
    expect(Array.isArray(appointments)).toBe(true);
  });

  // Função getClinicCommissions não existe, pulando este teste
  // it("should check if there are any commissions configured", async () => {
  //   const commissions = await db.getClinicCommissions(1);
  //   expect(Array.isArray(commissions)).toBe(true);
  // });

  it("should check daily earnings summary", async () => {
    // Verificar resumo diário de ganhos
    const today = new Date().toISOString().split('T')[0];
    const summary = await db.getDailyEarningsSummaryByDate(1, today); // clinic_id = 1
    console.log("Resumo diário:", summary);
    expect(Array.isArray(summary)).toBe(true);
  });

  it("should check specialties", async () => {
    // Verificar especialidades
    const specialties = await db.getSpecialties(1); // clinic_id = 1
    console.log("Especialidades:", specialties);
    expect(Array.isArray(specialties)).toBe(true);
  });

  it("should check completed appointments by specialty", async () => {
    // Verificar atendimentos por especialidade
    const today = new Date().toISOString().split('T')[0];
    const specialties = await db.getSpecialties(1);
    
    // Filtrar especialidades vazias
    const validSpecialties = specialties.filter(s => s && s.trim());
    
    if (validSpecialties.length > 0) {
      const appointments = await db.getCompletedAppointmentsBySpecialty(
        1,
        validSpecialties[0],
        today
      );
      console.log(`Atendimentos para especialidade ${validSpecialties[0]}:`, appointments);
      expect(Array.isArray(appointments)).toBe(true);
    }
  });
});
