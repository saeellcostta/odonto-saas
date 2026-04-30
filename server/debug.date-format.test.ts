import { describe, it } from 'vitest';
import { getDb } from './db';
import { dailyEarningsSummary } from '../drizzle/schema';

describe('Debug - Verificar formato de data', () => {
  it('Listar todas as datas no banco', async () => {
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

    console.log(`\n=== DATAS NO BANCO ===`);
    all.forEach((summary, idx) => {
      console.log(`[${idx}] ID: ${summary.id}`);
      console.log(`    Data bruta: ${summary.date}`);
      console.log(`    Data tipo: ${typeof summary.date}`);
      console.log(`    Data ISO: ${new Date(summary.date).toISOString()}`);
      console.log(`    Data YYYY-MM-DD: ${new Date(summary.date).toISOString().split('T')[0]}`);
    });

    // Testar comparação de data
    console.log(`\n=== TESTE DE COMPARAÇÃO ===`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    console.log(`Hoje (string): ${todayStr}`);
    console.log(`Hoje (Date): ${today.toISOString()}`);
    console.log(`Hoje (Date sem hora): ${new Date(todayStr).toISOString()}`);

    // Buscar registros de hoje
    const todayRecords = all.filter(s => {
      const summaryDate = new Date(s.date);
      const summaryDateStr = summaryDate.toISOString().split('T')[0];
      console.log(`Comparando: ${summaryDateStr} === ${todayStr}? ${summaryDateStr === todayStr}`);
      return summaryDateStr === todayStr;
    });
    
    console.log(`\nRegistros de hoje: ${todayRecords.length}`);
  });
});
