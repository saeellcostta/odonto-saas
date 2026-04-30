import { describe, it } from 'vitest';
import { getDb } from './db';
import { completedAppointments } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Debug - Verificar todos os completedAppointments', () => {
  it('Listar todos os registros de completedAppointments', async () => {
    const database = await getDb();
    if (!database) {
      console.log('Database não disponível');
      return;
    }

    // Buscar todos os atendimentos completados
    const all = await database
      .select()
      .from(completedAppointments)
      .limit(100);

    console.log(`\n=== TODOS OS ATENDIMENTOS COMPLETADOS ===`);
    console.log(`Total: ${all.length}`);
    
    all.forEach((appt, idx) => {
      console.log(`\n[${idx}] ID: ${appt.id}`);
      console.log(`    Dentista: ${appt.dentistId}`);
      console.log(`    Preço: ${appt.procedurePrice}`);
      console.log(`    Comissão %: ${appt.commissionPercentage}`);
      console.log(`    Comissão $: ${appt.commissionAmount}`);
      console.log(`    Completado: ${appt.completedAt}`);
    });

    // Buscar especificamente do dentista 1
    console.log(`\n=== ATENDIMENTOS DO DENTISTA 1 ===`);
    const dentist1 = await database
      .select()
      .from(completedAppointments)
      .where(eq(completedAppointments.dentistId, 1));

    console.log(`Total: ${dentist1.length}`);
    dentist1.forEach((appt, idx) => {
      console.log(`\n[${idx}] ID: ${appt.id}`);
      console.log(`    Preço: ${appt.procedurePrice}`);
      console.log(`    Comissão %: ${appt.commissionPercentage}`);
      console.log(`    Comissão $: ${appt.commissionAmount}`);
    });
  });
});
