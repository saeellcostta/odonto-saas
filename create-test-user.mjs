import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dentrics',
  port: process.env.DB_PORT || 3306,
});

const password = '123456';
const passwordHash = await bcrypt.hash(password, 10);

try {
  await connection.execute(
    `INSERT INTO users (email, passwordHash, name, phone, clinicId, role, loginMethod, isActive, emailVerified, lastSignedIn, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    ['teste@dentrics.com', passwordHash, 'Teste User', '11999999999', 1, 'admin', 'email', true, false]
  );
  console.log('✅ Usuário de teste criado com sucesso!');
  console.log('Email: teste@dentrics.com');
  console.log('Senha: 123456');
} catch (error) {
  if (error.code === 'ER_DUP_ENTRY') {
    console.log('⚠️ Usuário já existe');
  } else {
    console.error('❌ Erro:', error.message);
  }
}

await connection.end();
