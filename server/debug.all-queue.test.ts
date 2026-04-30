import { describe, it } from 'vitest';
import { getDb } from './db';
import { serviceQueue } from '../drizzle/schema';

describe('Debug - Verificar todos os atendimentos', () => {
  it('Listar TODOS os atendimentos na fila (independente de status)', async () => {
    const database = await getDb();
    if (!database) {
      console.log('Database não disponível');
      return;
    }

    // Buscar todos os atendimentos sem filtro
    const allEntries = await database.select().from(serviceQueue).limit(100);
    
    console.log(`\n=== TODOS OS ATENDIMENTOS NA FILA ===`);
    console.log(`Total: ${allEntries.length}`);
    
    if (allEntries.length > 0) {
      allEntries.forEach((entry, idx) => {
        console.log(`\n[${idx}] ID: ${entry.id}`);
        console.log(`    Status: ${entry.status}`);
        console.log(`    Queue: ${entry.queueType}`);
        console.log(`    Patient: ${entry.patientId}`);
        console.log(`    Professional: ${entry.professionalId}`);
        console.log(`    Amount: ${entry.amountToPay}`);
        console.log(`    Created: ${entry.createdAt}`);
        console.log(`    Updated: ${entry.updatedAt}`);
      });
    }

    // Contar por status
    const statusCounts: Record<string, number> = {};
    allEntries.forEach(entry => {
      statusCounts[entry.status] = (statusCounts[entry.status] || 0) + 1;
    });
    
    console.log(`\n=== CONTAGEM POR STATUS ===`);
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`${status}: ${count}`);
    });
  });

  it('Listar TODOS os atendimentos completados', async () => {
    const database = await getDb();
    if (!database) {
      console.log('Database não disponível');
      return;
    }

    // Buscar todos os atendimentos completados
    const completed = await database.query.completedAppointments.findMany({
      limit: 100,
    });
    
    console.log(`\n=== TODOS OS ATENDIMENTOS COMPLETADOS ===`);
    console.log(`Total: ${completed.length}`);
    
    if (completed.length > 0) {
      completed.forEach((appt, idx) => {
        console.log(`\n[${idx}] ID: ${appt.id}`);
        console.log(`    Dentista: ${appt.dentistId}`);
        console.log(`    Paciente: ${appt.patientId}`);
        console.log(`    Preço: ${appt.procedurePrice}`);
        console.log(`    Comissão %: ${appt.commissionPercentage}`);
        console.log(`    Comissão $: ${appt.commissionAmount}`);
        console.log(`    Completado em: ${appt.completedAt}`);
      });
    }
  });
});
