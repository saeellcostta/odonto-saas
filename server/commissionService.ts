import { getDb } from "./db";
import { dentistCommissions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Criar ou atualizar comissão de dentista
 */
export async function upsertDentistCommission(
  clinicId: number,
  dentistId: number,
  commissionPercentage: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validação básica
  if (!clinicId || !dentistId || commissionPercentage === undefined) {
    throw new Error("clinicId, dentistId e commissionPercentage são obrigatórios");
  }

  if (commissionPercentage < 0 || commissionPercentage > 100) {
    throw new Error("commissionPercentage deve estar entre 0 e 100");
  }

  try {
    // Verificar se já existe comissão para este dentista
    const existing = await db
      .select()
      .from(dentistCommissions)
      .where(eq(dentistCommissions.dentistId, dentistId))
      .limit(1);

    if (existing.length > 0) {
      // Atualizar
      await db
        .update(dentistCommissions)
        .set({
          commissionPercentage: commissionPercentage.toString(),
          updatedAt: new Date(),
        })
        .where(eq(dentistCommissions.dentistId, dentistId));

      return {
        success: true,
        message: "Comissão atualizada com sucesso",
        id: existing[0].id,
      };
    } else {
      // Inserir novo
      await db.insert(dentistCommissions).values({
        clinicId,
        dentistId,
        procedureId: null,
        commissionPercentage: commissionPercentage.toString(),
        isActive: true,
      });

      // Buscar a comissão criada
      const created = await db
        .select()
        .from(dentistCommissions)
        .where(eq(dentistCommissions.dentistId, dentistId))
        .limit(1);

      return {
        success: true,
        message: "Comissão criada com sucesso",
        id: created[0]?.id,
      };
    }
  } catch (error: any) {
    console.error("Erro ao criar/atualizar comissão:", error);
    throw new Error(`Erro ao salvar comissão: ${error.message}`);
  }
}

/**
 * Obter comissões de uma clínica
 */
export async function getClinicCommissions(clinicId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const commissions = await db
      .select()
      .from(dentistCommissions)
      .where(eq(dentistCommissions.clinicId, clinicId));

    return commissions;
  } catch (error: any) {
    console.error("Erro ao buscar comissões:", error);
    throw new Error(`Erro ao buscar comissões: ${error.message}`);
  }
}

/**
 * Obter comissão de um dentista específico
 */
export async function getDentistCommission(dentistId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db
      .select()
      .from(dentistCommissions)
      .where(eq(dentistCommissions.dentistId, dentistId))
      .limit(1);

    return result[0] || null;
  } catch (error: any) {
    console.error("Erro ao buscar comissão do dentista:", error);
    throw new Error(`Erro ao buscar comissão: ${error.message}`);
  }
}

/**
 * Deletar comissão
 */
export async function deleteDentistCommission(dentistId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .delete(dentistCommissions)
      .where(eq(dentistCommissions.dentistId, dentistId));

    return { success: true, message: "Comissão removida com sucesso" };
  } catch (error: any) {
    console.error("Erro ao deletar comissão:", error);
    throw new Error(`Erro ao remover comissão: ${error.message}`);
  }
}
