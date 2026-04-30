import { describe, it } from 'vitest';
import * as db from './db';
import { getDb } from './db';
import { dentistCommissions } from '../drizzle/schema';

describe('Debug - Verificar comissões cadastradas', () => {
  it('Listar todas as comissões', async () => {
    const database = await getDb();
    if (!database) {
      console.log('Database não disponível');
      return;
    }

    // Buscar todas as comissões
    const allCommissions = await database
      .select()
      .from(dentistCommissions)
      .limit(50);

    console.log(`\n=== TODAS AS COMISSÕES ===`);
    console.log(`Total: ${allCommissions.length}`);
    
    if (allCommissions.length > 0) {
      allCommissions.forEach((c, idx) => {
        console.log(`\n[${idx}] ID: ${c.id}`);
        console.log(`    Dentista: ${c.dentistId}`);
        console.log(`    Clínica: ${c.clinicId}`);
        console.log(`    Comissão: ${c.commissionPercentage}%`);
        console.log(`    Ativa: ${c.isActive}`);
      });
    }

    // Verificar comissões para dentista 1
    console.log(`\n=== COMISSÕES DO DENTISTA 1 ===`);
    const dentist1Commissions = await db.getDentistCommissions(1, 1);
    console.log(`Total: ${dentist1Commissions.length}`);
    if (dentist1Commissions.length > 0) {
      dentist1Commissions.forEach(c => {
        console.log(`  - ${c.commissionPercentage}%`);
      });
    }

    // Verificar comissões para dentista 90001
    console.log(`\n=== COMISSÕES DO DENTISTA 90001 ===`);
    const dentist90001Commissions = await db.getDentistCommissions(1, 90001);
    console.log(`Total: ${dentist90001Commissions.length}`);
    if (dentist90001Commissions.length > 0) {
      dentist90001Commissions.forEach(c => {
        console.log(`  - ${c.commissionPercentage}%`);
      });
    }
  });
});
