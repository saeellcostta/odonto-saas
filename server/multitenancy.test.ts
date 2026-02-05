import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";

describe("Multi-tenancy", () => {
  let clinic1Id: number;
  let clinic2Id: number;
  let patient1Id: number;
  let patient2Id: number;

  beforeAll(async () => {
    // Criar duas clínicas de teste
    const clinic1 = await db.createClinic({
      name: "Clínica Teste 1",
      slug: "clinica-teste-1-" + Date.now(),
    });
    clinic1Id = clinic1.id;

    const clinic2 = await db.createClinic({
      name: "Clínica Teste 2",
      slug: "clinica-teste-2-" + Date.now(),
    });
    clinic2Id = clinic2.id;

    // Criar pacientes em cada clínica
    const p1 = await db.createPatient({
      name: "Paciente Clínica 1",
      clinicId: clinic1Id,
    });
    patient1Id = p1.id;

    const p2 = await db.createPatient({
      name: "Paciente Clínica 2",
      clinicId: clinic2Id,
    });
    patient2Id = p2.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (patient1Id) await db.deletePatient(patient1Id, clinic1Id);
    if (patient2Id) await db.deletePatient(patient2Id, clinic2Id);
    if (clinic1Id) await db.deleteClinic(clinic1Id);
    if (clinic2Id) await db.deleteClinic(clinic2Id);
  });

  describe("Pacientes", () => {
    it("deve retornar apenas pacientes da clínica 1 quando filtrado por clinicId 1", async () => {
      const patients = await db.getPatients(undefined, clinic1Id);
      
      // Deve conter o paciente da clínica 1
      const hasPatient1 = patients.some(p => p.id === patient1Id);
      expect(hasPatient1).toBe(true);
      
      // Não deve conter o paciente da clínica 2
      const hasPatient2 = patients.some(p => p.id === patient2Id);
      expect(hasPatient2).toBe(false);
    });

    it("deve retornar apenas pacientes da clínica 2 quando filtrado por clinicId 2", async () => {
      const patients = await db.getPatients(undefined, clinic2Id);
      
      // Deve conter o paciente da clínica 2
      const hasPatient2 = patients.some(p => p.id === patient2Id);
      expect(hasPatient2).toBe(true);
      
      // Não deve conter o paciente da clínica 1
      const hasPatient1 = patients.some(p => p.id === patient1Id);
      expect(hasPatient1).toBe(false);
    });

    it("deve retornar paciente por ID apenas se pertencer à clínica correta", async () => {
      // Paciente 1 deve ser encontrado com clinicId 1
      const patient1WithCorrectClinic = await db.getPatientById(patient1Id, clinic1Id);
      expect(patient1WithCorrectClinic).toBeDefined();
      expect(patient1WithCorrectClinic?.name).toBe("Paciente Clínica 1");

      // Paciente 1 NÃO deve ser encontrado com clinicId 2
      const patient1WithWrongClinic = await db.getPatientById(patient1Id, clinic2Id);
      expect(patient1WithWrongClinic).toBeUndefined();
    });
  });

  describe("Clínicas", () => {
    it("deve criar clínica com dados corretos", async () => {
      const clinic = await db.getClinicById(clinic1Id);
      expect(clinic).toBeDefined();
      expect(clinic?.name).toBe("Clínica Teste 1");
    });

    it("deve listar clínicas cadastradas", async () => {
      const clinics = await db.getClinics();
      expect(clinics.length).toBeGreaterThanOrEqual(2);
      
      const hasClinic1 = clinics.some(c => c.id === clinic1Id);
      const hasClinic2 = clinics.some(c => c.id === clinic2Id);
      
      expect(hasClinic1).toBe(true);
      expect(hasClinic2).toBe(true);
    });
  });

  describe("Verificação de acesso", () => {
    it("deve verificar se clínica pode acessar o sistema (status ativo)", async () => {
      // Atualizar clínica 1 para status ativo
      await db.updateClinic(clinic1Id, { subscriptionStatus: "active" });
      
      const canAccess = await db.checkClinicAccess(clinic1Id);
      expect(canAccess.canAccess).toBe(true);
    });

    it("deve bloquear acesso de clínica suspensa", async () => {
      // Atualizar clínica 2 para status suspenso
      await db.updateClinic(clinic2Id, { subscriptionStatus: "suspended" });
      
      const canAccess = await db.checkClinicAccess(clinic2Id);
      expect(canAccess.canAccess).toBe(false);
      expect(canAccess.reason).toContain("suspensa");
    });
  });
});
