import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./drizzle/schema.js";
import { eq } from "drizzle-orm";
import mysql from "mysql2/promise";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL não configurada");
  process.exit(1);
}

async function initializeData() {
  const connection = await mysql.createConnection(dbUrl);
  const db = drizzle(connection, { schema, mode: 'default' });

  try {
    console.log("Verificando clínicas...");
    const clinics = await db.select().from(schema.clinics).limit(1);
    console.log("✓ Clínicas encontradas:", clinics.length);

    let clinicId = 1;
    if (clinics.length === 0) {
      console.log("Criando clínica padrão...");
      const [result] = await connection.query(
        "INSERT INTO clinics (name, email, phone) VALUES (?, ?, ?)",
        ["Clínica Padrão", "clinica@example.com", ""]
      );
      clinicId = result[0].insertId;
      console.log("✓ Clínica criada com ID:", clinicId);
    } else {
      clinicId = clinics[0].id;
      console.log("✓ Usando clínica existente ID:", clinicId);
    }

    console.log("Verificando usuários...");
    const users = await db.select().from(schema.users).limit(1);
    console.log("✓ Usuários encontrados:", users.length);

    if (users.length > 0) {
      const user = users[0];
      console.log("Atualizando usuário para associar à clínica...");
      await db.update(schema.users)
        .set({ clinicId })
        .where(eq(schema.users.id, user.id));
      console.log("✓ Usuário associado à clínica ID:", clinicId);
    }

    console.log("Verificando áreas especializadas...");
    const areas = await db.select()
      .from(schema.specializedAreaConfig)
      .where(eq(schema.specializedAreaConfig.clinicId, clinicId));
    console.log("✓ Áreas encontradas:", areas.length);

    if (areas.length === 0) {
      console.log("Criando áreas padrão...");
      const defaultAreas = [
        {
          clinicId,
          areaKey: "dentist",
          displayName: "Dentista",
          description: "Atendimento geral de odontologia",
          isActive: true,
          sortOrder: 1,
          icon: "tooth",
          color: "#10b981",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          clinicId,
          areaKey: "orthodontist",
          displayName: "Ortodontista",
          description: "Tratamentos ortodônticos",
          isActive: true,
          sortOrder: 2,
          icon: "smile",
          color: "#8b5cf6",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          clinicId,
          areaKey: "implantodontist",
          displayName: "Implantodontista",
          description: "Implantes dentários",
          isActive: true,
          sortOrder: 3,
          icon: "bone",
          color: "#f59e0b",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          clinicId,
          areaKey: "prosthodontist",
          displayName: "Protesista",
          description: "Próteses dentárias",
          isActive: true,
          sortOrder: 4,
          icon: "crown",
          color: "#06b6d4",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          clinicId,
          areaKey: "maxillofacial",
          displayName: "Buco-Maxilo-Facial",
          description: "Cirurgias buco-maxilofaciais",
          isActive: true,
          sortOrder: 5,
          icon: "skull",
          color: "#ef4444",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          clinicId,
          areaKey: "pediatric",
          displayName: "Odontopediatria",
          description: "Odontologia infantil",
          isActive: true,
          sortOrder: 6,
          icon: "baby",
          color: "#ec4899",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      await db.insert(schema.specializedAreaConfig).values(defaultAreas);
      console.log("✓ Áreas padrão criadas com sucesso!");
    } else {
      console.log("✓ Áreas já existem para esta clínica");
    }

    console.log("\n✅ Inicialização concluída com sucesso!");
  } catch (error) {
    console.error("❌ Erro durante inicialização:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

initializeData();
