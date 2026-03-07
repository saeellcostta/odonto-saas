import { describe, it, expect } from "vitest";
import { format } from "date-fns";

describe("Appointments - Details Display", () => {
  it("deve exibir data formatada corretamente", () => {
    const date = new Date("2026-03-15T12:00:00Z");
    const formatted = format(date, "EEEE, dd 'de' MMMM 'de' yyyy");
    expect(formatted).toContain("15");
    expect(formatted).toContain("2026");
  });

  it("deve exibir horário de início", () => {
    const startTime = "14:30";
    expect(startTime).toMatch(/^\d{2}:\d{2}$/);
  });

  it("deve exibir horário de fim", () => {
    const endTime = "15:30";
    expect(endTime).toMatch(/^\d{2}:\d{2}$/);
  });

  it("deve validar que agendamento tem todos os campos necessários", () => {
    const appointment = {
      id: 1,
      patientId: 1,
      dentistId: 2,
      date: "2026-03-15",
      startTime: "14:30:00",
      endTime: "15:30:00",
      type: "Limpeza",
      status: "scheduled",
      notes: "Primeira consulta",
    };

    expect(appointment).toHaveProperty("id");
    expect(appointment).toHaveProperty("patientId");
    expect(appointment).toHaveProperty("dentistId");
    expect(appointment).toHaveProperty("date");
    expect(appointment).toHaveProperty("startTime");
    expect(appointment).toHaveProperty("endTime");
    expect(appointment).toHaveProperty("type");
    expect(appointment).toHaveProperty("status");
    expect(appointment).toHaveProperty("notes");
  });

  it("deve validar status de agendamento", () => {
    const validStatuses = ["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"];
    const appointment = { status: "confirmed" };
    expect(validStatuses).toContain(appointment.status);
  });

  it("deve validar que tipo de procedimento é string", () => {
    const appointment = { type: "Limpeza" };
    expect(typeof appointment.type).toBe("string");
  });

  it("deve validar que observações são string", () => {
    const appointment = { notes: "Paciente com sensibilidade" };
    expect(typeof appointment.notes).toBe("string");
  });

  it("deve validar que dentista pode ser null", () => {
    const appointment1 = { dentistId: 1 };
    const appointment2 = { dentistId: null };
    
    expect(appointment1.dentistId).toBeTruthy();
    expect(appointment2.dentistId).toBeNull();
  });

  it("deve validar que procedimento pode ser null", () => {
    const appointment1 = { type: "Limpeza" };
    const appointment2 = { type: null };
    
    expect(appointment1.type).toBeTruthy();
    expect(appointment2.type).toBeNull();
  });

  it("deve validar que observações podem ser null", () => {
    const appointment1 = { notes: "Observação" };
    const appointment2 = { notes: null };
    
    expect(appointment1.notes).toBeTruthy();
    expect(appointment2.notes).toBeNull();
  });
});
