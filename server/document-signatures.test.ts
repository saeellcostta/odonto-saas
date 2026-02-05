import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Document Signatures", () => {
  let testClinicId: number;
  let testPatientId: number;
  let testDentistId: number;
  let testDocumentId: number;

  beforeAll(async () => {
    // Criar clínica de teste
    const clinic = await db.createClinic({
      name: "Clínica Teste Assinaturas",
      slug: "clinica-teste-assinaturas-" + Date.now(),
      cnpj: "12345678000199",
      email: "teste-assinaturas@example.com",
      phone: "(11) 99999-9999",
      address: "Rua Teste, 123",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-567",
      status: "Ativo",
      subscriptionPlanId: 1,
    });
    testClinicId = clinic.id;

    // Criar paciente de teste
    const patient = await db.createPatient({
      clinicId: testClinicId,
      name: "Paciente Teste Assinatura",
      cpf: "12345678901",
      phone: "(11) 98888-8888",
      email: "paciente-teste@example.com",
      birthDate: new Date("1990-01-01"),
      gender: "male",
      address: "Rua Paciente, 456",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-567",
    });
    testPatientId = patient.id;

    // Criar dentista de teste
    const dentist = await db.createDentist({
      clinicId: testClinicId,
      name: "Dr. Teste Assinatura",
      cro: "SP-12345",
      specialty: "Clínico Geral",
      phone: "(11) 97777-7777",
      email: "dentista-teste@example.com",
    });
    testDentistId = dentist.id;

    // Criar documento médico de teste
    const document = await db.createMedicalDocument({
      clinicId: testClinicId,
      patientId: testPatientId,
      dentistId: testDentistId,
      type: "receituario",
      title: "Receituário de Teste",
      content: "Conteúdo do receituário de teste",
      documentDate: new Date(),
      createdAt: new Date(),
    });
    testDocumentId = document.id;
  });

  it("deve assinar documento como profissional", async () => {
    const signatureData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    
    // Assinar como profissional
    await db.updateMedicalDocument(testDocumentId, testClinicId, {
      professionalSignature: signatureData,
      professionalSignedAt: new Date(),
    });

    // Buscar documento atualizado
    const document = await db.getMedicalDocumentById(testDocumentId, testClinicId);
    
    expect(document).toBeDefined();
    expect(document?.professionalSignature).toBe(signatureData);
    expect(document?.professionalSignedAt).toBeInstanceOf(Date);
  });

  it("deve assinar documento como paciente", async () => {
    const signatureData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    
    // Assinar como paciente
    await db.updateMedicalDocument(testDocumentId, testClinicId, {
      patientSignature: signatureData,
      patientSignedAt: new Date(),
    });

    // Buscar documento atualizado
    const document = await db.getMedicalDocumentById(testDocumentId, testClinicId);
    
    expect(document).toBeDefined();
    expect(document?.patientSignature).toBe(signatureData);
    expect(document?.patientSignedAt).toBeInstanceOf(Date);
  });

  it("deve ter ambas as assinaturas após assinar como profissional e paciente", async () => {
    const document = await db.getMedicalDocumentById(testDocumentId, testClinicId);
    
    expect(document).toBeDefined();
    expect(document?.professionalSignature).toBeDefined();
    expect(document?.professionalSignedAt).toBeInstanceOf(Date);
    expect(document?.patientSignature).toBeDefined();
    expect(document?.patientSignedAt).toBeInstanceOf(Date);
  });
});
