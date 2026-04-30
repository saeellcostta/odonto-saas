import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Debug - Fluxo completo de finalização', () => {
  let clinicId = 1;
  let dentistId = 1;
  let patientId = 1;
  let queueEntryId = 0;

  beforeAll(async () => {
    // Verificar se existe clínica
    const clinics = await db.getClinics();
    if (clinics.length > 0) {
      clinicId = clinics[0].id;
      console.log(`[beforeAll] Clínica encontrada: ${clinicId}`);
    }

    // Verificar se existe dentista
    const dentists = await db.getDentists();
    if (dentists.length > 0) {
      dentistId = dentists[0].id;
      console.log(`[beforeAll] Dentista encontrado: ${dentistId}`);
    }

    // Verificar se existe paciente
    const patients = await db.getPatients();
    if (patients.length > 0) {
      patientId = patients[0].id;
      console.log(`[beforeAll] Paciente encontrado: ${patientId}`);
    }
  });

  it('Verificar dados antes de finalizar', async () => {
    console.log('\n=== ANTES DE FINALIZAR ===');
    console.log(`clinicId: ${clinicId}`);
    console.log(`dentistId: ${dentistId}`);
    console.log(`patientId: ${patientId}`);

    // Verificar comissões
    const commissions = await db.getDentistCommissions(clinicId, dentistId);
    console.log(`Comissões do dentista ${dentistId}:`, commissions);

    // Verificar atendimentos na fila
    const queueEntries = await db.getServiceQueue(undefined, clinicId);
    console.log(`Atendimentos na fila:`, queueEntries.length);
    if (queueEntries.length > 0) {
      const entry = queueEntries[0];
      queueEntryId = entry.id;
      console.log(`Primeiro atendimento:`, {
        id: entry.id,
        patientId: entry.patientId,
        professionalId: entry.professionalId,
        amountToPay: entry.amountToPay,
        status: entry.status,
      });
    }

    // Verificar atendimentos completados
    const completed = await db.getCompletedAppointmentsByDate(new Date(), clinicId);
    console.log(`Atendimentos completados hoje: ${completed.length}`);
  });

  it('Simular finalização de atendimento', async () => {
    if (queueEntryId === 0) {
      console.log('Nenhum atendimento na fila para finalizar');
      return;
    }

    console.log(`\n=== FINALIZANDO ATENDIMENTO ${queueEntryId} ===`);
    
    try {
      const result = await db.completeService(queueEntryId, 'Teste de debug');
      console.log('Resultado da finalização:', result);
    } catch (error) {
      console.error('Erro ao finalizar:', error);
    }
  });

  it('Verificar dados após finalizar', async () => {
    console.log('\n=== DEPOIS DE FINALIZAR ===');

    // Verificar atendimentos completados
    const completed = await db.getCompletedAppointmentsByDate(new Date(), clinicId);
    console.log(`Atendimentos completados hoje: ${completed.length}`);
    if (completed.length > 0) {
      console.log('Primeiro atendimento completado:', completed[0]);
    }

    // Verificar resumo diário
    const today = new Date().toISOString().split('T')[0];
    const earnings = await db.getDailyEarningsSummaryByDate(today, clinicId);
    console.log(`Resumos diários: ${earnings.length}`);
    if (earnings.length > 0) {
      console.log('Primeiro resumo:', earnings[0]);
    }
  });
});
