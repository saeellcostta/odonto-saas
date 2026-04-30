import { describe, it } from 'vitest';
import { getDb } from './db';
import { serviceQueue } from '../drizzle/schema';
import { isNotNull, and } from 'drizzle-orm';

describe('Debug - Encontrar atendimentos com amountToPay', () => {
  it('Listar todos os atendimentos com amountToPay preenchido', async () => {
    const database = await getDb();
    if (!database) {
      console.log('Database não disponível');
      return;
    }

    // Buscar atendimentos com amountToPay NOT NULL
    const entries = await database
      .select()
      .from(serviceQueue)
      .where(isNotNull(serviceQueue.amountToPay))
      .limit(20);

    console.log(`\n=== ATENDIMENTOS COM AMOUNT ===`);
    console.log(`Total: ${entries.length}`);
    
    entries.forEach((entry, idx) => {
      console.log(`\n[${idx}] ID: ${entry.id}`);
      console.log(`    Status: ${entry.status}`);
      console.log(`    Amount: ${entry.amountToPay}`);
      console.log(`    Dentista: ${entry.professionalId}`);
      console.log(`    Clínica: ${entry.clinicId}`);
    });
  });
});
