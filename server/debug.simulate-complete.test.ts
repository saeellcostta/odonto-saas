import { describe, it, expect } from 'vitest';
import * as db from './db';
import { getDb } from './db';
import { serviceQueue, completedAppointments } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Debug - Simular finalização de atendimento', () => {
  it('Encontrar um atendimento com amountToPay e finalizar', async () => {
    const database = await getDb();
    if (!database) {
      console.log('Database não disponível');
      return;
    }

    // Buscar um atendimento com amountToPay > 0
    const entries = await database
      .select()
      .from(serviceQueue)
      .where((sq) => {
        // Buscar atendimentos que ainda não foram finalizados e têm valor
        return sq.amountToPay !== null && sq.status !== 'completed';
      })
      .limit(1);

    if (entries.length === 0) {
      console.log('Nenhum atendimento disponível para finalizar');
      return;
    }

    const entry = entries[0];
    console.log(`\n=== ATENDIMENTO ENCONTRADO ===`);
    console.log(`ID: ${entry.id}`);
    console.log(`Status: ${entry.status}`);
    console.log(`Valor: ${entry.amountToPay}`);
    console.log(`Dentista: ${entry.professionalId}`);
    console.log(`Clínica: ${entry.clinicId}`);

    // Verificar comissões antes
    const commissionsBefore = await db.getDentistCommissions(
      entry.clinicId || 1,
      entry.professionalId || 0
    );
    console.log(`\nComissões antes: ${commissionsBefore.length}`);

    // Finalizar o atendimento
    console.log(`\n=== FINALIZANDO ATENDIMENTO ${entry.id} ===`);
    try {
      const result = await db.completeService(entry.id, 'Teste de debug');
      console.log('Resultado:', result);
    } catch (error) {
      console.error('Erro ao finalizar:', error);
      return;
    }

    // Verificar se foi registrado em completedAppointments
    console.log(`\n=== VERIFICANDO RESULTADO ===`);
    const completed = await database
      .select()
      .from(completedAppointments)
      .where((ca) => {
        // Buscar atendimentos completados no mesmo dia
        return ca.dentistId === entry.professionalId;
      })
      .limit(10);

    console.log(`Atendimentos completados do dentista: ${completed.length}`);
    if (completed.length > 0) {
      console.log(`Último atendimento:`, {
        id: completed[0].id,
        dentistId: completed[0].dentistId,
        procedurePrice: completed[0].procedurePrice,
        commissionAmount: completed[0].commissionAmount,
        completedAt: completed[0].completedAt,
      });
    }
  });
});
