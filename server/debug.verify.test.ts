import { describe, it, expect } from 'vitest';
import * as db from './db';

describe('Debug - Verificar dados no banco', () => {
  it('Verificar últimos atendimentos completados', async () => {
    const appointments = await db.getCompletedAppointmentsByDate(new Date(), 1);
    console.log('=== Atendimentos completados hoje ===');
    console.log(JSON.stringify(appointments, null, 2));
    console.log(`Total: ${appointments.length}`);
  });

  it('Verificar resumo diário de ganhos', async () => {
    const today = new Date().toISOString().split('T')[0];
    const earnings = await db.getDailyEarningsSummaryByDate(today, 1);
    console.log('=== Resumo diário de ganhos ===');
    console.log(JSON.stringify(earnings, null, 2));
  });

  it('Verificar comissões cadastradas', async () => {
    const commissions = await db.getDentistCommissions(1, 0);
    console.log('=== Comissões cadastradas ===');
    console.log(JSON.stringify(commissions, null, 2));
  });
});
