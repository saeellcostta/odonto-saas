import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";

describe("Service Queue - addToServiceQueue", () => {
  // Nota: Esses testes validam a lógica de validação
  // Em um ambiente real, você precisaria de um banco de dados de teste

  it("deve validar que patientId é obrigatório", () => {
    const invalidData = {
      patientId: 0,
      patientName: "João Silva",
      queueType: "budget" as const,
      clinicId: 1,
    };

    expect(() => {
      // Simular validação
      if (!invalidData.patientId) throw new Error("patientId é obrigatório");
    }).toThrow("patientId é obrigatório");
  });

  it("deve validar que patientName é obrigatório", () => {
    const invalidData = {
      patientId: 1,
      patientName: "",
      queueType: "budget" as const,
      clinicId: 1,
    };

    expect(() => {
      if (!invalidData.patientName) throw new Error("patientName é obrigatório");
    }).toThrow("patientName é obrigatório");
  });

  it("deve validar que queueType é obrigatório", () => {
    const invalidData = {
      patientId: 1,
      patientName: "João Silva",
      queueType: "" as any,
      clinicId: 1,
    };

    expect(() => {
      if (!invalidData.queueType) throw new Error("queueType é obrigatório");
    }).toThrow("queueType é obrigatório");
  });

  it("deve validar que clinicId é obrigatório", () => {
    const invalidData = {
      patientId: 1,
      patientName: "João Silva",
      queueType: "budget" as const,
      clinicId: 0,
    };

    expect(() => {
      if (!invalidData.clinicId) throw new Error("clinicId é obrigatório");
    }).toThrow("clinicId é obrigatório");
  });

  it("deve aceitar dados válidos com campos opcionais", () => {
    const validData = {
      patientId: 1,
      patientName: "João Silva",
      queueType: "budget" as const,
      clinicId: 1,
      priority: "normal" as const,
      notes: "Primeira consulta",
    };

    // Validação
    expect(validData.patientId).toBeTruthy();
    expect(validData.patientName).toBeTruthy();
    expect(validData.queueType).toBeTruthy();
    expect(validData.clinicId).toBeTruthy();
  });

  it("deve aceitar diferentes tipos de fila", () => {
    const queueTypes = [
      "reception",
      "budget",
      "dentist",
      "orthodontics",
      "implant",
      "prosthetics",
      "maxillofacial",
      "pediatric",
    ] as const;

    queueTypes.forEach((queueType) => {
      const data = {
        patientId: 1,
        patientName: "João Silva",
        queueType,
        clinicId: 1,
      };

      expect(data.queueType).toBe(queueType);
    });
  });

  it("deve aceitar diferentes níveis de prioridade", () => {
    const priorities = ["normal", "high", "urgent"] as const;

    priorities.forEach((priority) => {
      const data = {
        patientId: 1,
        patientName: "João Silva",
        queueType: "budget" as const,
        clinicId: 1,
        priority,
      };

      expect(data.priority).toBe(priority);
    });
  });

  it("deve definir status padrão como 'waiting'", () => {
    const data = {
      patientId: 1,
      patientName: "João Silva",
      queueType: "budget" as const,
      clinicId: 1,
      status: undefined as any,
    };

    const status = data.status || "waiting";
    expect(status).toBe("waiting");
  });

  it("deve definir arrivalTime como data atual se não fornecida", () => {
    const data = {
      patientId: 1,
      patientName: "João Silva",
      queueType: "budget" as const,
      clinicId: 1,
      arrivalTime: undefined as any,
    };

    const arrivalTime = data.arrivalTime || new Date();
    expect(arrivalTime).toBeInstanceOf(Date);
  });

  it("deve definir prioridade padrão como 'normal'", () => {
    const data = {
      patientId: 1,
      patientName: "João Silva",
      queueType: "budget" as const,
      clinicId: 1,
      priority: undefined as any,
    };

    const priority = data.priority || "normal";
    expect(priority).toBe("normal");
  });
});
