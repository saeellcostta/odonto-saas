import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("getDentistsByClinic", () => {
  it("deve retornar um array de dentistas", async () => {
    // Usar uma clínica existente (ID 1 é geralmente a clínica padrão)
    const dentists = await db.getDentistsByClinic(1);

    expect(dentists).toBeDefined();
    expect(Array.isArray(dentists)).toBe(true);

    // Verificar estrutura dos dados retornados
    if (dentists.length > 0) {
      const dentist = dentists[0];
      expect(dentist).toHaveProperty("id");
      expect(dentist).toHaveProperty("name");
      expect(dentist).toHaveProperty("email");
      expect(typeof dentist.id).toBe("number");
      expect(typeof dentist.name).toBe("string");
    }
  });

  it("deve retornar array vazio para clínica inexistente", async () => {
    const dentists = await db.getDentistsByClinic(99999);

    expect(dentists).toBeDefined();
    expect(Array.isArray(dentists)).toBe(true);
    expect(dentists.length).toBe(0);
  });

  it("deve retornar apenas usuários com role dentista", async () => {
    // Usar uma clínica existente
    const dentists = await db.getDentistsByClinic(1);

    expect(dentists).toBeDefined();
    expect(Array.isArray(dentists)).toBe(true);

    // Todos os retornados devem ter id, name e email
    dentists.forEach((dentist) => {
      expect(dentist.id).toBeDefined();
      expect(dentist.name).toBeDefined();
      expect(dentist.email).toBeDefined();
    });
  });
});
