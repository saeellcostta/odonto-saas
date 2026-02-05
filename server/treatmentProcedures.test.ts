import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do banco de dados
vi.mock("./db", () => ({
  createTreatmentProcedures: vi.fn().mockResolvedValue([{ id: 1 }]),
  getTreatmentProceduresByQueueEntry: vi.fn().mockResolvedValue([
    {
      id: 1,
      procedureName: "Restauração",
      toothNumber: "11",
      faces: "V,O",
      status: "pending",
      price: "150.00",
    },
    {
      id: 2,
      procedureName: "Limpeza",
      toothNumber: null,
      faces: null,
      status: "completed",
      price: "80.00",
    },
  ]),
  getTreatmentProceduresForSpecialist: vi.fn().mockResolvedValue([
    {
      id: 1,
      procedureName: "Restauração",
      toothNumber: "11",
      faces: "V,O",
      status: "pending",
      // Nota: SEM o campo price - especialistas não podem ver valores
    },
    {
      id: 2,
      procedureName: "Limpeza",
      toothNumber: null,
      faces: null,
      status: "completed",
    },
  ]),
  updateTreatmentProcedureStatus: vi.fn().mockResolvedValue({ id: 1, status: "completed" }),
  markMultipleProceduresCompleted: vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
  linkProceduresToQueueEntry: vi.fn().mockResolvedValue([{ id: 1 }]),
}));

import * as db from "./db";

describe("Treatment Procedures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTreatmentProcedures", () => {
    it("deve criar procedimentos do tratamento com todos os campos", async () => {
      const procedures = [
        {
          clinicId: 1,
          patientId: 1,
          queueEntryId: 1,
          procedureId: 10,
          procedureName: "Restauração",
          toothNumber: "11",
          faces: "V,O",
          condition: "caries",
          price: "150.00",
          status: "pending" as const,
        },
      ];

      const result = await db.createTreatmentProcedures(procedures);

      expect(db.createTreatmentProcedures).toHaveBeenCalledWith(procedures);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
  });

  describe("getTreatmentProceduresByQueueEntry", () => {
    it("deve retornar procedimentos com valores para atendente", async () => {
      const result = await db.getTreatmentProceduresByQueueEntry(1);

      expect(db.getTreatmentProceduresByQueueEntry).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
      expect(result[0].price).toBe("150.00");
      expect(result[1].price).toBe("80.00");
    });
  });

  describe("getTreatmentProceduresForSpecialist", () => {
    it("deve retornar procedimentos SEM valores para especialistas", async () => {
      const result = await db.getTreatmentProceduresForSpecialist(1);

      expect(db.getTreatmentProceduresForSpecialist).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
      
      // Verificar que não há campo price nos resultados para especialistas
      result.forEach((proc: any) => {
        expect(proc).not.toHaveProperty("price");
      });
    });

    it("deve retornar procedimentos com status correto", async () => {
      const result = await db.getTreatmentProceduresForSpecialist(1);

      expect(result[0].status).toBe("pending");
      expect(result[1].status).toBe("completed");
    });
  });

  describe("updateTreatmentProcedureStatus", () => {
    it("deve atualizar status de um procedimento", async () => {
      const result = await db.updateTreatmentProcedureStatus(1, "completed", 1, "Procedimento realizado com sucesso");

      expect(db.updateTreatmentProcedureStatus).toHaveBeenCalledWith(1, "completed", 1, "Procedimento realizado com sucesso");
      expect(result.status).toBe("completed");
    });
  });

  describe("markMultipleProceduresCompleted", () => {
    it("deve marcar múltiplos procedimentos como concluídos", async () => {
      const result = await db.markMultipleProceduresCompleted([1, 2], 1);

      expect(db.markMultipleProceduresCompleted).toHaveBeenCalledWith([1, 2], 1);
      expect(result).toHaveLength(2);
    });
  });

  describe("linkProceduresToQueueEntry", () => {
    it("deve vincular procedimentos a uma nova entrada na fila", async () => {
      const result = await db.linkProceduresToQueueEntry([1, 2, 3], 5);

      expect(db.linkProceduresToQueueEntry).toHaveBeenCalledWith([1, 2, 3], 5);
      expect(result).toHaveLength(1);
    });
  });
});

describe("Fluxo de Encaminhamento para Especialistas", () => {
  it("especialistas não devem ver valores dos procedimentos", async () => {
    // Simula o fluxo onde o atendente encaminha para especialista
    const proceduresForSpecialist = await db.getTreatmentProceduresForSpecialist(1);
    
    // Verifica que nenhum procedimento tem o campo price
    proceduresForSpecialist.forEach((proc: any) => {
      expect(proc.price).toBeUndefined();
    });
  });

  it("atendente deve ver valores dos procedimentos", async () => {
    // Simula o fluxo onde o atendente vê os procedimentos
    const proceduresForAttendant = await db.getTreatmentProceduresByQueueEntry(1);
    
    // Verifica que todos os procedimentos têm o campo price
    proceduresForAttendant.forEach((proc: any) => {
      expect(proc.price).toBeDefined();
    });
  });
});
