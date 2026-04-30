import { describe, it } from 'vitest';
import * as db from './db';
import { getDb } from './db';
import { serviceQueue, completedAppointments } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Debug - Testar com ID específico', () => {
  it('Testar fluxo com ID 30006', async () => {
    const database = await getDb();
    if (!database) {
      console.log('Database não disponível');
      return;
    }

    // Buscar o atendimento específico
    const entries = await database
      .select()
      .from(serviceQueue)
      .where(eq(serviceQueue.id, 30006))
      .limit(1);

    if (entries.length === 0) {
      console.log('Atendimento não encontrado');
      return;
    }

    const entry = entries[0];
    console.log(`\n=== ATENDIMENTO ENCONTRADO ===`);
    console.log(`ID: ${entry.id}`);
    console.log(`Status: ${entry.status}`);
    console.log(`Valor: ${entry.amountToPay}`);
    console.log(`Dentista: ${entry.professionalId}`);
    console.log(`Clínica: ${entry.clinicId}`);

    // Verificar comissões
    const commissions = await db.getDentistCommissions(
      entry.clinicId || 1,
      entry.professionalId || undefined
    );
    console.log(`\nComissões do dentista: ${commissions.length}`);
    if (commissions.length > 0) {
      commissions.forEach(c => {
        console.log(`  - ${c.commissionPercentage}%`);
      });
    }

    // PASSO 1: Registrar pagamento
    console.log(`\n=== PASSO 1: REGISTRAR PAGAMENTO ===`);
    try {
      const paymentResult = await db.receivePayment(
        entry.id,
        Number(entry.amountToPay),
        'dinheiro'
      );
      console.log('Pagamento registrado:', paymentResult);
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      return;
    }

    // PASSO 2: Finalizar atendimento
    console.log(`\n=== PASSO 2: FINALIZAR ATENDIMENTO ===`);
    try {
      const completeResult = await db.completeService(
        entry.id, 
        'Teste ID 30006', 
        entry.clinicId || 1
      );
      console.log('Atendimento finalizado:', completeResult);
    } catch (error) {
      console.error('Erro ao finalizar:', error);
      return;
    }

    // PASSO 3: Verificar resultado
    console.log(`\n=== PASSO 3: VERIFICAR RESULTADO ===`);
    
    // Verificar se foi registrado em completedAppointments
    const completed = await database
      .select()
      .from(completedAppointments)
      .where((ca) => ca.dentistId === entry.professionalId)
      .limit(10);

    console.log(`Atendimentos completados do dentista ${entry.professionalId}: ${completed.length}`);
    if (completed.length > 0) {
      const latest = completed[0];
      console.log(`Último atendimento:`, {
        id: latest.id,
        dentistId: latest.dentistId,
        procedurePrice: latest.procedurePrice,
        commissionPercentage: latest.commissionPercentage,
        commissionAmount: latest.commissionAmount,
        paymentStatus: latest.paymentStatus,
      });
    }

    // Verificar resumo diário
    const today = new Date().toISOString().split('T')[0];
    const earnings = await db.getDailyEarningsSummaryByDate(today, entry.clinicId || 1);
    console.log(`\nResumos diários: ${earnings.length}`);
    if (earnings.length > 0) {
      earnings.forEach((e, idx) => {
        console.log(`[${idx}] Dentista ${e.dentistId}:`, {
          totalProcedures: e.totalProcedures,
          totalRevenue: e.totalRevenue,
          totalCommission: e.totalCommission,
        });
      });
    }
  });
});
