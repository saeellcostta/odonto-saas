import { getDb } from "./server/db.ts";
import { eq, and } from "drizzle-orm";
import * as schema from "./drizzle/schema.ts";

async function seedTestData() {
  console.log("🌱 Iniciando seed de dados de teste...");

  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // 1. Buscar todas as clínicas
    const clinics = await db.select().from(schema.clinics);
    console.log(`📍 Encontradas ${clinics.length} clínicas`);

    if (clinics.length === 0) {
      console.log("⚠️  Nenhuma clínica encontrada. Criando clínica de teste...");
      await db.insert(schema.clinics).values({
        name: "Clínica Teste",
        phone: "(11) 9999-9999",
        email: "teste@clinica.com",
        address: "Rua Teste, 123",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234-567",
        cnpj: "12.345.678/0001-90",
      });
      const updatedClinics = await db.select().from(schema.clinics);
      clinics.push(updatedClinics[updatedClinics.length - 1]);
    }

    // 2. Para cada clínica, criar dados de teste
    for (const clinic of clinics) {
      console.log(`\n🏥 Processando clínica: ${clinic.name}`);

      // Criar dentistas de teste
      const dentistNames = [
        { name: "Dr. Misael Pinheiro teste", cro: "12345-SP" },
        { name: "Dra. Ana Silva teste", cro: "12346-SP" },
        { name: "Dr. Carlos Santos teste", cro: "12347-SP" },
        { name: "Dra. Beatriz Costa teste", cro: "12348-SP" },
      ];

      for (const dentist of dentistNames) {
        // Verificar se dentista já existe
        const existing = await db
          .select()
          .from(schema.dentists)
          .where(
            and(
              eq(schema.dentists.clinicId, clinic.id),
              eq(schema.dentists.name, dentist.name)
            )
          )
          .limit(1);

        if (existing.length === 0) {
          await db.insert(schema.dentists).values({
            clinicId: clinic.id,
            name: dentist.name,
            cro: dentist.cro,
            phone: "(11) 9999-9999",
            email: `${dentist.name.toLowerCase().replace(/\s+/g, ".")}@clinica.com`,
            specialty: "Geral",
            isActive: true,
          });
          console.log(`  ✅ Dentista criado: ${dentist.name}`);
        } else {
          console.log(`  ℹ️  Dentista já existe: ${dentist.name}`);
        }
      }

      // Criar procedimentos pré-configurados
      const procedures = [
        {
          name: "Restauração Simples",
          description: "Restauração em resina composta",
          pricePerTooth: 150.0,
          duration: 30,
        },
        {
          name: "Restauração Dupla",
          description: "Restauração em resina composta dupla",
          pricePerTooth: 250.0,
          duration: 45,
        },
        {
          name: "Restauração Tripla",
          description: "Restauração em resina composta tripla",
          pricePerTooth: 350.0,
          duration: 60,
        },
        {
          name: "Prótese Fixa",
          description: "Prótese fixa sobre implante",
          pricePerTooth: 1500.0,
          duration: 120,
        },
        {
          name: "Prótese Removível",
          description: "Prótese removível total ou parcial",
          pricePerTooth: 1200.0,
          duration: 90,
        },
        {
          name: "Implante Unitário",
          description: "Implante dentário unitário",
          pricePerTooth: 2500.0,
          duration: 120,
        },
        {
          name: "Implante Múltiplo",
          description: "Implante dentário múltiplo",
          pricePerTooth: 4000.0,
          duration: 180,
        },
        {
          name: "Tratamento de Canal",
          description: "Tratamento endodôntico",
          pricePerTooth: 800.0,
          duration: 90,
        },
        {
          name: "Cirurgia de Extração",
          description: "Extração dentária simples",
          pricePerTooth: 300.0,
          duration: 30,
        },
        {
          name: "Cirurgia de Impactado",
          description: "Extração de dente impactado",
          pricePerTooth: 600.0,
          duration: 60,
        },
        {
          name: "Cirurgia de Enxerto",
          description: "Enxerto ósseo ou gengival",
          pricePerTooth: 1000.0,
          duration: 90,
        },
      ];

      for (const proc of procedures) {
        // Verificar se procedimento já existe
        const existing = await db
          .select()
          .from(schema.procedures)
          .where(
            and(
              eq(schema.procedures.clinicId, clinic.id),
              eq(schema.procedures.name, proc.name)
            )
          )
          .limit(1);

        if (existing.length === 0) {
          await db.insert(schema.procedures).values({
            clinicId: clinic.id,
            name: proc.name,
            description: proc.description,
            pricePerTooth: proc.pricePerTooth,
            duration: proc.duration,
            isActive: true,
          });
          console.log(`  ✅ Procedimento criado: ${proc.name}`);
        } else {
          console.log(`  ℹ️  Procedimento já existe: ${proc.name}`);
        }
      }

      // Criar pacientes de teste
      const patientNames = [
        { name: "Rute teste", gender: "female" },
        { name: "Maria teste", gender: "female" },
        { name: "João teste", gender: "male" },
        { name: "Pedro teste", gender: "male" },
        { name: "Ana teste", gender: "female" },
        { name: "Carlos teste", gender: "male" },
      ];

      for (const patient of patientNames) {
        // Verificar se paciente já existe
        const existing = await db
          .select()
          .from(schema.patients)
          .where(
            and(
              eq(schema.patients.clinicId, clinic.id),
              eq(schema.patients.name, patient.name)
            )
          )
          .limit(1);

        if (existing.length === 0) {
          await db.insert(schema.patients).values({
            clinicId: clinic.id,
            name: patient.name,
            email: `${patient.name.toLowerCase().replace(/\s+/g, ".")}@teste.com`,
            phone: "(11) 9999-9999",
            birthDate: new Date("1990-01-01"),
            cpf: `${Math.random().toString().slice(2, 12)}`,
            gender: patient.gender,
            address: "Rua Teste, 123",
            city: "São Paulo",
            state: "SP",
            zipCode: "01234-567",
            isActive: true,
          });
          console.log(`  ✅ Paciente criado: ${patient.name}`);
        } else {
          console.log(`  ℹ️  Paciente já existe: ${patient.name}`);
        }
      }
    }

    console.log("\n✅ Seed de dados de teste concluído com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao fazer seed:", error);
    throw error;
  }
}

seedTestData().catch(console.error);
