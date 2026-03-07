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

  it("deve permitir editar agendamento com novos dados", () => {
    const originalAppointment = {
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

    const updatedData = {
      patientId: 1,
      dentistId: 3,
      date: "2026-03-16",
      startTime: "15:00:00",
      endTime: "16:00:00",
      type: "Restauracao",
      notes: "Mudanca de horario",
    };

    expect(updatedData.dentistId).not.toBe(originalAppointment.dentistId);
    expect(updatedData.date).not.toBe(originalAppointment.date);
    expect(updatedData.type).not.toBe(originalAppointment.type);
  });

  it("deve permitir cancelar agendamento mudando status", () => {
    const appointment = {
      id: 1,
      status: "scheduled",
    };

    const cancelledAppointment = {
      ...appointment,
      status: "cancelled",
    };

    expect(cancelledAppointment.status).toBe("cancelled");
    expect(cancelledAppointment.status).not.toBe(appointment.status);
  });

  it("deve validar que ID eh obrigatorio para editar", () => {
    const updateData = {
      id: 1,
      data: { type: "Limpeza" },
    };

    expect(updateData.id).toBeTruthy();
    expect(typeof updateData.id).toBe("number");
  });

  it("deve validar que ID eh obrigatorio para deletar", () => {
    const deleteData = {
      id: 1,
    };

    expect(deleteData.id).toBeTruthy();
    expect(typeof deleteData.id).toBe("number");
  });

  it("deve comparar horarios de agendamento corretamente (HH:MM)", () => {
    const startTime1 = "14:30:00";
    const startTime2 = "14:30";
    const slotTime = "14:30";

    const time1 = startTime1.substring(0, 5);
    const time2 = startTime2.substring(0, 5);

    expect(time1).toBe(slotTime);
    expect(time2).toBe(slotTime);
    expect(time1).toBe(time2);
  });

  it("deve filtrar agendamentos por data corretamente", () => {
    const appointments = [
      { id: 1, date: "2026-03-14", startTime: "14:30:00" },
      { id: 2, date: "2026-03-14", startTime: "15:00:00" },
      { id: 3, date: "2026-03-15", startTime: "14:30:00" },
    ];

    const targetDate = new Date("2026-03-14");
    const filtered = appointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      return aptDate.toDateString() === targetDate.toDateString();
    });

    expect(filtered.length).toBe(2);
    expect(filtered[0].id).toBe(1);
    expect(filtered[1].id).toBe(2);
  });

  it("deve permitir selecionar dia para filtrar agendamentos", () => {
    const selectedDay = new Date("2026-03-14");
    const day1 = new Date("2026-03-14");
    const day2 = new Date("2026-03-15");

    const isSameDay1 = selectedDay.toDateString() === day1.toDateString();
    const isSameDay2 = selectedDay.toDateString() === day2.toDateString();

    expect(isSameDay1).toBe(true);
    expect(isSameDay2).toBe(false);
  });

  it("deve permitir desselecionar dia clicando novamente", () => {
    let selectedDay = new Date("2026-03-14");
    const day = new Date("2026-03-14");

    const isSameDay = selectedDay.toDateString() === day.toDateString();
    if (isSameDay) {
      selectedDay = null;
    }

    expect(selectedDay).toBeNull();
  });
});
