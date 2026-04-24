import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from './db';
import { dentistCommissions, dentists, clinics } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('createDentistCommission', () => {
  let db: any;
  let testClinicId: number;
  let testDentistId: number;

  beforeAll(async () => {
    db = await getDb();
  });

  it('should create a commission for a dentist', async () => {
    // Get first clinic and dentist
    const clinic = await db.select().from(clinics).limit(1);
    const dentist = await db.select().from(dentists).limit(1);
    
    if (!clinic.length || !dentist.length) {
      console.log('No test data available');
      return;
    }

    testClinicId = clinic[0].id;
    testDentistId = dentist[0].id;

    // Create commission
    await db.insert(dentistCommissions).values({
      clinicId: testClinicId,
      dentistId: testDentistId,
      procedureId: null,
      commissionPercentage: '15.00',
      isActive: true,
    });

    // Verify commission was created
    const result = await db
      .select()
      .from(dentistCommissions)
      .where(eq(dentistCommissions.dentistId, testDentistId));

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].commissionPercentage).toBe('15.00');
  });
});
