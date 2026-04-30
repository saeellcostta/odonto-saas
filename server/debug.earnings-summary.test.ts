import { describe, it } from 'vitest';
import { getDb } from './db';
import { dailyEarningsSummary } from '../drizzle/schema';

describe('Debug - Verificar Mapa de Ganho', () => {
  it('Listar todos os resumos diários', async () => {
    const database = await getDb();
    if (!database) {
      console.log('Database não disponível');
      return;
    }

    // Buscar todos os resumos
    const all = await database
      .select()
      .from(dailyEarningsSummary)
      .limit(100);

    console.log(`\n=== TODOS OS RESUMOS DIÁRIOS ===`);
    console.log(`Total: ${all.length}`);
    
    all.forEach((summary, idx) => {
      console.log(`\n[${idx}] ID: ${summary.id}`);
      console.log(`    Dentista: ${summary.dentistId}`);
      console.log(`    Clínica: ${summary.clinicId}`);
      console.log(`    Data: ${summary.date}`);
      console.log(`    Procedimentos: ${summary.totalProcedures}`);
      console.log(`    Receita: ${summary.totalRevenue}`);
      console.log(`    Comissão: ${summary.totalCommission}`);
      console.log(`    Status: ${summary.status}`);
    });

    // Verificar resumos de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    console.log(`\n=== RESUMOS DE HOJE (${todayStr}) ===`);
    const todaySummaries = all.filter(s => {
      const summaryDate = new Date(s.date);
      summaryDate.setHours(0, 0, 0, 0);
      return summaryDate.toISOString().split('T')[0] === todayStr;
    });
    
    console.log(`Total: ${todaySummaries.length}`);
    todaySummaries.forEach((summary, idx) => {
      console.log(`\n[${idx}] Dentista ${summary.dentistId}:`);
      console.log(`    Procedimentos: ${summary.totalProcedures}`);
      console.log(`    Receita: ${summary.totalRevenue}`);
      console.log(`    Comissão: ${summary.totalCommission}`);
    });
  });
});
