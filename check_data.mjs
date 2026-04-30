import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

// Verificar últimos atendimentos completados
const serviceQueue = await db.query.serviceQueue.findMany({
  orderBy: (sq, { desc }) => desc(sq.updatedAt),
  limit: 5,
});

console.log('=== Últimos atendimentos na fila ===');
console.log(JSON.stringify(serviceQueue, null, 2));

// Verificar atendimentos completados
const completedAppointments = await db.query.completedAppointments.findMany({
  orderBy: (ca, { desc }) => desc(ca.completedAt),
  limit: 5,
});

console.log('\n=== Últimos atendimentos completados ===');
console.log(JSON.stringify(completedAppointments, null, 2));

await connection.end();
