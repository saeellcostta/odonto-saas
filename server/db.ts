import { eq, desc, and, gte, lte, lt, sql, like, or, asc, inArray, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  clinics, InsertClinic, Clinic,
  userClinics, InsertUserClinic, UserClinic,
  rolePermissions, InsertRolePermission, RolePermission,
  patients, InsertPatient, Patient,
  dentists, InsertDentist, Dentist,
  procedures, InsertProcedure, Procedure,
  procedureCategories, InsertProcedureCategory,
  appointments, InsertAppointment, Appointment,
  budgets, InsertBudget, Budget,
  budgetItems, InsertBudgetItem,
  transactions, InsertTransaction, Transaction,
  insurances, InsertInsurance, Insurance,
  stockItems, InsertStockItem, StockItem,
  stockCategories, InsertStockCategory,
  stockMovements, InsertStockMovement,
  waitingQueue, InsertWaitingQueue,
  anamnesis, InsertAnamnesis,
  chairs, InsertChair,
  clinicSettings, InsertClinicSettings,
  treatments, InsertTreatment,
  patientDocuments, InsertPatientDocument,
  whatsappNotifications, InsertWhatsappNotification,
  notificationSettings, InsertNotificationSettings,
  orthodonticTreatments, InsertOrthodonticTreatment,
  orthodonticMaintenances, InsertOrthodonticMaintenance,
  implantPlans, InsertImplantPlan,
  userPermissions, InsertUserPermission,
  accessProfiles, InsertAccessProfile,
  offices, InsertOffice, Office,
  serviceQueue, InsertServiceQueue, ServiceQueue,
  queueHistory, InsertQueueHistory,
  tvPanelCalls, InsertTvPanelCall,
  plans, InsertPlan, Plan,
  iaConversations, InsertIaConversation, IaConversation,
  smileDesigns, InsertSmileDesign, SmileDesign,
  returnAlerts, InsertReturnAlert, ReturnAlert,
  returnPeriodSettings, InsertReturnPeriodSetting, ReturnPeriodSetting,
  whatsappReminderHistory, InsertWhatsappReminderHistory, WhatsappReminderHistory,
  reminderTemplates, InsertReminderTemplate, ReminderTemplate,
  patientModels3D, InsertPatientModel3D, PatientModel3D,
  models3DLibrary, InsertModel3DLibrary, Model3DLibrary,
  treatmentProcedures, InsertTreatmentProcedure, TreatmentProcedure,
  medicalDocuments, InsertMedicalDocument, MedicalDocument,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USERS ====================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  // Verificar se usuário já existe
  const existingUser = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
  const isNewUser = existingUser.length === 0;

  // Email é obrigatório no schema, usar openId como fallback
  const values: InsertUser = { 
    openId: user.openId,
    email: user.email || `${user.openId}@manus.auth`,
    clinicId: 1, // Associar automaticamente à clínica padrão
  };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "loginMethod"] as const;
  textFields.forEach(field => {
    const value = user[field];
    if (value !== undefined) {
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    }
  });
  
  // Email separado para evitar sobrescrever com fallback
  if (user.email) {
    values.email = user.email;
    updateSet.email = user.email;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = 'superadmin';
    updateSet.role = 'superadmin';
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });

  // Se é um novo usuário, adicionar à tabela user_clinics também
  if (isNewUser) {
    const newUser = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
    if (newUser.length > 0) {
      // Verificar se já existe relação na user_clinics
      const existingRelation = await db.select().from(userClinics)
        .where(and(eq(userClinics.userId, newUser[0].id), eq(userClinics.clinicId, 1)))
        .limit(1);
      
      if (existingRelation.length === 0) {
        await db.insert(userClinics).values({
          userId: newUser[0].id,
          clinicId: 1,
          role: user.openId === ENV.ownerOpenId ? 'owner' : 'admin',
        });
      }
    }
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== PATIENTS ====================
export async function getPatients(search?: string, clinicId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (clinicId) conditions.push(eq(patients.clinicId, clinicId));
  
  if (search) {
    conditions.push(or(
      like(patients.name, `%${search}%`),
      like(patients.cpf, `%${search}%`),
      like(patients.phone, `%${search}%`)
    )!);
  }
  
  if (conditions.length > 0) {
    return db.select().from(patients)
      .where(and(...conditions))
      .orderBy(desc(patients.createdAt));
  }
  
  return db.select().from(patients).orderBy(desc(patients.createdAt));
}

export async function getPatientById(id: number, clinicId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  const conditions = [eq(patients.id, id)];
  if (clinicId) conditions.push(eq(patients.clinicId, clinicId));
  const result = await db.select().from(patients).where(and(...conditions)).limit(1);
  return result[0];
}

export async function createPatient(data: InsertPatient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Paciente é ativado automaticamente ao cadastrar E ativado como paciente do dia
  const result = await db.insert(patients).values({
    ...data,
    isActive: true,
    isActiveToday: true,
    activatedAt: new Date(),
  });
  return { id: result[0].insertId };
}

export async function updatePatient(id: number, data: Partial<InsertPatient>, clinicId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(patients.id, id)];
  if (clinicId) conditions.push(eq(patients.clinicId, clinicId));
  await db.update(patients).set(data).where(and(...conditions));
}

export async function deletePatient(id: number, clinicId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(patients.id, id)];
  if (clinicId) conditions.push(eq(patients.clinicId, clinicId));
  await db.delete(patients).where(and(...conditions));
}

export async function getPatientsCount(clinicId?: number) {
  const db = await getDb();
  if (!db) return 0;
  if (clinicId) {
    const result = await db.select({ count: sql<number>`count(*)` }).from(patients).where(eq(patients.clinicId, clinicId));
    return result[0]?.count ?? 0;
  }
  const result = await db.select({ count: sql<number>`count(*)` }).from(patients);
  return result[0]?.count ?? 0;
}

export async function getPatientsActiveToday(clinicId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(patients.isActiveToday, true)];
  if (clinicId) conditions.push(eq(patients.clinicId, clinicId));
  return db.select().from(patients)
    .where(and(...conditions))
    .orderBy(desc(patients.activatedAt));
}

// ==================== DENTISTS ====================
export async function getDentists(activeOnly = false, clinicId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (clinicId) conditions.push(eq(dentists.clinicId, clinicId));
  if (activeOnly) conditions.push(eq(dentists.isActive, true));
  
  if (conditions.length > 0) {
    return db.select().from(dentists).where(and(...conditions)).orderBy(dentists.name);
  }
  return db.select().from(dentists).orderBy(dentists.name);
}

export async function getDentistById(id: number, clinicId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  const conditions = [eq(dentists.id, id)];
  if (clinicId) conditions.push(eq(dentists.clinicId, clinicId));
  const result = await db.select().from(dentists).where(and(...conditions)).limit(1);
  return result[0];
}

export async function createDentist(data: InsertDentist) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(dentists).values(data);
  return { id: result[0].insertId };
}

export async function updateDentist(id: number, data: Partial<InsertDentist>, clinicId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(dentists.id, id)];
  if (clinicId) conditions.push(eq(dentists.clinicId, clinicId));
  await db.update(dentists).set(data).where(and(...conditions));
}

export async function deleteDentist(id: number, clinicId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(dentists.id, id)];
  if (clinicId) conditions.push(eq(dentists.clinicId, clinicId));
  await db.delete(dentists).where(and(...conditions));
}

// ==================== PROCEDURES ====================
export async function getProcedures(search?: string, clinicId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (clinicId) conditions.push(eq(procedures.clinicId, clinicId));
  if (search) {
    conditions.push(or(
      like(procedures.name, `%${search}%`),
      like(procedures.code, `%${search}%`)
    )!);
  }
  if (conditions.length > 0) {
    return db.select().from(procedures).where(and(...conditions)).orderBy(procedures.name);
  }
  return db.select().from(procedures).orderBy(procedures.name);
}

export async function getProcedureById(id: number, clinicId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  const conditions = [eq(procedures.id, id)];
  if (clinicId) conditions.push(eq(procedures.clinicId, clinicId));
  const result = await db.select().from(procedures).where(and(...conditions)).limit(1);
  return result[0];
}

export async function createProcedure(data: InsertProcedure) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(procedures).values(data);
  return { id: result[0].insertId };
}

export async function updateProcedure(id: number, data: Partial<InsertProcedure>, clinicId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(procedures.id, id)];
  if (clinicId) conditions.push(eq(procedures.clinicId, clinicId));
  await db.update(procedures).set(data).where(and(...conditions));
}

export async function deleteProcedure(id: number, clinicId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(procedures.id, id)];
  if (clinicId) conditions.push(eq(procedures.clinicId, clinicId));
  await db.delete(procedures).where(and(...conditions));
}

// ==================== PROCEDURE CATEGORIES ====================
export async function getProcedureCategories(clinicId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (clinicId) {
    return db.select().from(procedureCategories).where(eq(procedureCategories.clinicId, clinicId)).orderBy(procedureCategories.name);
  }
  return db.select().from(procedureCategories).orderBy(procedureCategories.name);
}

export async function createProcedureCategory(data: InsertProcedureCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(procedureCategories).values(data);
  return { id: result[0].insertId };
}

// ==================== APPOINTMENTS ====================
export async function getAppointments(startDate?: string, endDate?: string, dentistId?: number, clinicId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  let conditions = [];
  if (clinicId) conditions.push(eq(appointments.clinicId, clinicId));
  if (startDate) conditions.push(sql`DATE(${appointments.date}) >= DATE(${startDate})`);
  if (endDate) conditions.push(sql`DATE(${appointments.date}) <= DATE(${endDate})`);
  if (dentistId) conditions.push(eq(appointments.dentistId, dentistId));
  
  if (conditions.length > 0) {
    return db.select().from(appointments).where(and(...conditions)).orderBy(appointments.date, appointments.startTime);
  }
  return db.select().from(appointments).orderBy(appointments.date, appointments.startTime);
}

export async function getAppointmentById(id: number, clinicId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  const conditions = [eq(appointments.id, id)];
  if (clinicId) conditions.push(eq(appointments.clinicId, clinicId));
  const result = await db.select().from(appointments).where(and(...conditions)).limit(1);
  return result[0];
}

export async function createAppointment(data: InsertAppointment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(appointments).values(data);
  return { id: result[0].insertId };
}

export async function updateAppointment(id: number, data: Partial<InsertAppointment>, clinicId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(appointments.id, id)];
  if (clinicId) conditions.push(eq(appointments.clinicId, clinicId));
  await db.update(appointments).set(data).where(and(...conditions));
}

export async function deleteAppointment(id: number, clinicId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(appointments.id, id)];
  if (clinicId) conditions.push(eq(appointments.clinicId, clinicId));
  await db.delete(appointments).where(and(...conditions));
}

export async function getTodayAppointmentsCount(clinicId?: number) {
  const db = await getDb();
  if (!db) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const conditions = [eq(appointments.date, today)];
  if (clinicId) conditions.push(eq(appointments.clinicId, clinicId));
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(appointments)
    .where(and(...conditions));
  return result[0]?.count ?? 0;
}

export async function getPatientsWithAppointmentsToday(clinicId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const conditions = [
    gte(appointments.date, today),
    lt(appointments.date, tomorrow)
  ];
  if (clinicId) conditions.push(eq(appointments.clinicId, clinicId));
  
  // Get appointments for today with patient and dentist info
  const todayAppointments = await db
    .select({
      appointmentId: appointments.id,
      appointmentDate: appointments.date,
      appointmentTime: appointments.startTime,
      appointmentEndTime: appointments.endTime,
      appointmentStatus: appointments.status,
      appointmentType: appointments.type,
      patientId: patients.id,
      patientName: patients.name,
      patientPhone: patients.phone,
      patientWhatsapp: patients.whatsapp,
      patientCpf: patients.cpf,
      dentistId: dentists.id,
      dentistName: dentists.name,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .leftJoin(dentists, eq(appointments.dentistId, dentists.id))
    .where(and(...conditions))
    .orderBy(appointments.startTime);
  
  return todayAppointments;
}

// ==================== BUDGETS ====================
export async function getBudgets(patientId?: number, clinicId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (clinicId) conditions.push(eq(budgets.clinicId, clinicId));
  if (patientId) conditions.push(eq(budgets.patientId, patientId));
  
  if (conditions.length > 0) {
    return db.select().from(budgets).where(and(...conditions)).orderBy(desc(budgets.createdAt));
  }
  return db.select().from(budgets).orderBy(desc(budgets.createdAt));
}

export async function getBudgetById(id: number, clinicId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  const conditions = [eq(budgets.id, id)];
  if (clinicId) conditions.push(eq(budgets.clinicId, clinicId));
  const result = await db.select().from(budgets).where(and(...conditions)).limit(1);
  return result[0];
}

export async function createBudget(data: InsertBudget) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(budgets).values(data);
  return { id: result[0].insertId };
}

export async function updateBudget(id: number, data: Partial<InsertBudget>, clinicId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(budgets.id, id)];
  if (clinicId) conditions.push(eq(budgets.clinicId, clinicId));
  await db.update(budgets).set(data).where(and(...conditions));
}

export async function getPendingBudgetsCount(clinicId?: number) {
  const db = await getDb();
  if (!db) return 0;
  const conditions = [eq(budgets.status, "pending")];
  if (clinicId) conditions.push(eq(budgets.clinicId, clinicId));
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(budgets)
    .where(and(...conditions));
  return result[0]?.count ?? 0;
}

// ==================== BUDGET ITEMS ====================
export async function getBudgetItems(budgetId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(budgetItems).where(eq(budgetItems.budgetId, budgetId));
}

export async function createBudgetItem(data: InsertBudgetItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(budgetItems).values(data);
  return { id: result[0].insertId };
}

export async function updateBudgetItem(id: number, data: Partial<InsertBudgetItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(budgetItems).set(data).where(eq(budgetItems.id, id));
  return { success: true };
}

// ==================== TRANSACTIONS ====================
export async function getTransactions(startDate?: string, endDate?: string, type?: "income" | "expense", clinicId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  let conditions = [];
  if (clinicId) conditions.push(eq(transactions.clinicId, clinicId));
  if (startDate) conditions.push(gte(transactions.date, new Date(startDate)));
  if (endDate) conditions.push(lte(transactions.date, new Date(endDate)));
  if (type) conditions.push(eq(transactions.type, type));
  
  if (conditions.length > 0) {
    return db.select().from(transactions).where(and(...conditions)).orderBy(desc(transactions.createdAt));
  }
  return db.select().from(transactions).orderBy(desc(transactions.createdAt));
}

export async function createTransaction(data: InsertTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(transactions).values(data);
  return { id: result[0].insertId };
}

export async function updateTransaction(id: number, data: Partial<InsertTransaction>, clinicId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(transactions.id, id)];
  if (clinicId) conditions.push(eq(transactions.clinicId, clinicId));
  await db.update(transactions).set(data).where(and(...conditions));
}

export async function deleteTransaction(id: number, clinicId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(transactions.id, id)];
  if (clinicId) conditions.push(eq(transactions.clinicId, clinicId));
  await db.delete(transactions).where(and(...conditions));
}

export async function getMonthlyRevenue(clinicId?: number) {
  const db = await getDb();
  if (!db) return 0;
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const conditions = [
    eq(transactions.type, "income"),
    eq(transactions.status, "paid"),
    gte(transactions.date, firstDay),
    lte(transactions.date, lastDay)
  ];
  if (clinicId) conditions.push(eq(transactions.clinicId, clinicId));
  
  const result = await db.select({ total: sql<number>`COALESCE(SUM(value), 0)` })
    .from(transactions)
    .where(and(...conditions));
  return result[0]?.total ?? 0;
}

// ==================== INSURANCES ====================
export async function getInsurances(clinicId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (clinicId) {
    return db.select().from(insurances).where(eq(insurances.clinicId, clinicId)).orderBy(insurances.name);
  }
  return db.select().from(insurances).orderBy(insurances.name);
}

export async function createInsurance(data: InsertInsurance) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(insurances).values(data);
  return { id: result[0].insertId };
}

export async function updateInsurance(id: number, data: Partial<InsertInsurance>, clinicId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(insurances.id, id)];
  if (clinicId) conditions.push(eq(insurances.clinicId, clinicId));
  await db.update(insurances).set(data).where(and(...conditions));
}

export async function deleteInsurance(id: number, clinicId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(insurances.id, id)];
  if (clinicId) conditions.push(eq(insurances.clinicId, clinicId));
  await db.delete(insurances).where(and(...conditions));
}

// ==================== STOCK ====================
export async function getStockItems(search?: string, clinicId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (clinicId) conditions.push(eq(stockItems.clinicId, clinicId));
  if (search) conditions.push(like(stockItems.name, `%${search}%`));
  
  if (conditions.length > 0) {
    return db.select().from(stockItems).where(and(...conditions)).orderBy(stockItems.name);
  }
  return db.select().from(stockItems).orderBy(stockItems.name);
}

export async function createStockItem(data: InsertStockItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(stockItems).values(data);
  return { id: result[0].insertId };
}

export async function updateStockItem(id: number, data: Partial<InsertStockItem>, clinicId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(stockItems.id, id)];
  if (clinicId) conditions.push(eq(stockItems.clinicId, clinicId));
  await db.update(stockItems).set(data).where(and(...conditions));
}

export async function deleteStockItem(id: number, clinicId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(stockItems.id, id)];
  if (clinicId) conditions.push(eq(stockItems.clinicId, clinicId));
  await db.delete(stockItems).where(eq(stockItems.id, id));
}

export async function getStockCategories(clinicId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (clinicId) {
    return db.select().from(stockCategories).where(eq(stockCategories.clinicId, clinicId)).orderBy(stockCategories.name);
  }
  return db.select().from(stockCategories).orderBy(stockCategories.name);
}

export async function createStockCategory(data: InsertStockCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(stockCategories).values(data);
  return { id: result[0].insertId };
}

export async function getStockMovements(stockItemId?: number, clinicId?: number, limit?: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Join with stockItems to get item name and filter by clinic
  const query = db
    .select({
      id: stockMovements.id,
      stockItemId: stockMovements.stockItemId,
      type: stockMovements.type,
      quantity: stockMovements.quantity,
      reason: stockMovements.reason,
      createdAt: stockMovements.createdAt,
      itemName: stockItems.name,
    })
    .from(stockMovements)
    .innerJoin(stockItems, eq(stockMovements.stockItemId, stockItems.id));
  
  const conditions = [];
  if (stockItemId) conditions.push(eq(stockMovements.stockItemId, stockItemId));
  if (clinicId) conditions.push(eq(stockItems.clinicId, clinicId));
  
  if (conditions.length > 0) {
    return query.where(and(...conditions)).orderBy(desc(stockMovements.createdAt)).limit(limit || 100);
  }
  return query.orderBy(desc(stockMovements.createdAt)).limit(limit || 100);
}

export async function createStockMovement(data: InsertStockMovement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Update stock quantity
  const item = await db.select().from(stockItems).where(eq(stockItems.id, data.stockItemId)).limit(1);
  if (item[0]) {
    const newQty = data.type === 'in' 
      ? (item[0].quantity ?? 0) + data.quantity 
      : (item[0].quantity ?? 0) - data.quantity;
    await db.update(stockItems).set({ quantity: newQty }).where(eq(stockItems.id, data.stockItemId));
  }
  
  const result = await db.insert(stockMovements).values(data);
  return { id: result[0].insertId };
}

export async function getLowStockCount(clinicId?: number) {
  const db = await getDb();
  if (!db) return 0;
  if (clinicId) {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(stockItems)
      .where(and(
        eq(stockItems.clinicId, clinicId),
        sql`${stockItems.quantity} <= ${stockItems.minQuantity}`
      ));
    return result[0]?.count ?? 0;
  }
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(stockItems)
    .where(sql`${stockItems.quantity} <= ${stockItems.minQuantity}`);
  return result[0]?.count ?? 0;
}

// ==================== WAITING QUEUE ====================
export async function getWaitingQueue(queueType?: string, clinicId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(waitingQueue.status, "waiting")];
  if (clinicId) conditions.push(eq(waitingQueue.clinicId, clinicId));
  if (queueType) conditions.push(eq(waitingQueue.queueType, queueType as any));
  
  return db.select().from(waitingQueue)
    .where(and(...conditions))
    .orderBy(waitingQueue.arrivalTime);
}

export async function addToQueue(data: InsertWaitingQueue) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(waitingQueue).values(data);
  return { id: result[0].insertId };
}

export async function updateQueueStatus(id: number, status: "waiting" | "in_service" | "completed" | "cancelled", clinicId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Partial<InsertWaitingQueue> = { status };
  if (status === "in_service") updateData.startTime = new Date();
  if (status === "completed" || status === "cancelled") updateData.endTime = new Date();
  const conditions = [eq(waitingQueue.id, id)];
  if (clinicId) conditions.push(eq(waitingQueue.clinicId, clinicId));
  await db.update(waitingQueue).set(updateData).where(and(...conditions));
}

// ==================== ANAMNESIS ====================
export async function getAnamnesis(patientId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(anamnesis).where(eq(anamnesis.patientId, patientId)).limit(1);
  return result[0];
}

export async function upsertAnamnesis(data: InsertAnamnesis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getAnamnesis(data.patientId);
  if (existing) {
    await db.update(anamnesis).set(data).where(eq(anamnesis.patientId, data.patientId));
    return { id: existing.id };
  } else {
    const result = await db.insert(anamnesis).values(data);
    return { id: result[0].insertId };
  }
}

// ==================== CHAIRS ====================
export async function getChairs(clinicId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(chairs.isActive, true)];
  if (clinicId) conditions.push(eq(chairs.clinicId, clinicId));
  return db.select().from(chairs).where(and(...conditions)).orderBy(chairs.name);
}

export async function createChair(data: InsertChair) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chairs).values(data);
  return { id: result[0].insertId };
}

// ==================== CLINIC SETTINGS ====================
export async function getClinicSettings(clinicId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(clinicSettings).where(eq(clinicSettings.clinicId, clinicId)).limit(1);
  return result[0] || null; // Retorna null ao invés de undefined
}

export async function upsertClinicSettings(clinicId: number, data: Omit<InsertClinicSettings, 'clinicId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getClinicSettings(clinicId);
  if (existing) {
    await db.update(clinicSettings).set(data).where(eq(clinicSettings.id, existing.id));
    return { id: existing.id };
  } else {
    const result = await db.insert(clinicSettings).values({ ...data, clinicId });
    return { id: result[0].insertId };
  }
}

// ==================== TREATMENTS ====================
export async function getTreatments(patientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(treatments).where(eq(treatments.patientId, patientId));
}

export async function createTreatment(data: InsertTreatment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(treatments).values(data);
  return { id: result[0].insertId };
}

export async function updateTreatment(id: number, data: Partial<InsertTreatment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(treatments).set(data).where(eq(treatments.id, id));
}

export async function deleteTreatment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(treatments).where(eq(treatments.id, id));
}

// ==================== PATIENT DOCUMENTS ====================
export async function getPatientDocuments(patientId: number, type?: string) {
  const db = await getDb();
  if (!db) return [];
  if (type) {
    return db.select().from(patientDocuments)
      .where(and(
        eq(patientDocuments.patientId, patientId),
        eq(patientDocuments.type, type as any)
      ))
      .orderBy(desc(patientDocuments.createdAt));
  }
  return db.select().from(patientDocuments)
    .where(eq(patientDocuments.patientId, patientId))
    .orderBy(desc(patientDocuments.createdAt));
}

export async function createPatientDocument(data: InsertPatientDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(patientDocuments).values(data);
  return { id: result[0].insertId };
}

export async function deletePatientDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(patientDocuments).where(eq(patientDocuments.id, id));
}

// ==================== DASHBOARD STATS ====================
export async function getDashboardStats(clinicId?: number) {
  const db = await getDb();
  if (!db) return {
    totalPatients: 0,
    todayAppointments: 0,
    pendingBudgets: 0,
    monthlyRevenue: 0,
    lowStockItems: 0,
    waitingPatients: 0
  };

  const waitingConditions = [eq(waitingQueue.status, "waiting")];
  if (clinicId) waitingConditions.push(eq(waitingQueue.clinicId, clinicId));

  const [patientsCount, appointmentsCount, budgetsCount, revenue, lowStock, waiting] = await Promise.all([
    getPatientsCount(clinicId),
    getTodayAppointmentsCount(clinicId),
    getPendingBudgetsCount(clinicId),
    getMonthlyRevenue(clinicId),
    getLowStockCount(clinicId),
    db.select({ count: sql<number>`count(*)` }).from(waitingQueue).where(and(...waitingConditions))
  ]);

  return {
    totalPatients: patientsCount,
    todayAppointments: appointmentsCount,
    pendingBudgets: budgetsCount,
    monthlyRevenue: revenue,
    lowStockItems: lowStock,
    waitingPatients: waiting[0]?.count ?? 0
  };
}


// ==================== LABORATORIES ====================
import { 
  laboratories, InsertLaboratory,
  prosthesisTypes, InsertProsthesisType,
  prosthesisOrders, InsertProsthesisOrder,
  aiAnalysis, InsertAiAnalysis,
  checkins, InsertCheckin
} from "../drizzle/schema";

export async function getLaboratories(clinicId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (clinicId) {
    return db.select().from(laboratories).where(eq(laboratories.clinicId, clinicId)).orderBy(laboratories.name);
  }
  return db.select().from(laboratories).orderBy(laboratories.name);
}

export async function createLaboratory(data: InsertLaboratory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(laboratories).values(data);
  return { id: result[0].insertId };
}

export async function updateLaboratory(id: number, data: Partial<InsertLaboratory>, clinicId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(laboratories.id, id)];
  if (clinicId) conditions.push(eq(laboratories.clinicId, clinicId));
  await db.update(laboratories).set(data).where(and(...conditions));
}

export async function deleteLaboratory(id: number, clinicId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(laboratories.id, id)];
  if (clinicId) conditions.push(eq(laboratories.clinicId, clinicId));
  await db.delete(laboratories).where(and(...conditions));
}

// ==================== PROSTHESIS TYPES ====================
export async function getProsthesisTypes(clinicId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (clinicId) {
    return db.select().from(prosthesisTypes).where(eq(prosthesisTypes.clinicId, clinicId)).orderBy(prosthesisTypes.name);
  }
  return db.select().from(prosthesisTypes).orderBy(prosthesisTypes.name);
}

export async function createProsthesisType(data: InsertProsthesisType) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(prosthesisTypes).values(data);
  return { id: result[0].insertId };
}

export async function updateProsthesisType(id: number, data: Partial<InsertProsthesisType>, clinicId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(prosthesisTypes.id, id)];
  if (clinicId) conditions.push(eq(prosthesisTypes.clinicId, clinicId));
  await db.update(prosthesisTypes).set(data).where(and(...conditions));
}

export async function deleteProsthesisType(id: number, clinicId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(prosthesisTypes.id, id)];
  if (clinicId) conditions.push(eq(prosthesisTypes.clinicId, clinicId));
  await db.delete(prosthesisTypes).where(and(...conditions));
}

// ==================== PROSTHESIS ORDERS ====================
export async function getProsthesisOrders(status?: string, clinicId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (clinicId) conditions.push(eq(prosthesisOrders.clinicId, clinicId));
  if (status) conditions.push(eq(prosthesisOrders.status, status as any));
  
  if (conditions.length > 0) {
    return db.select().from(prosthesisOrders)
      .where(and(...conditions))
      .orderBy(desc(prosthesisOrders.createdAt));
  }
  return db.select().from(prosthesisOrders).orderBy(desc(prosthesisOrders.createdAt));
}

export async function getProsthesisOrderById(id: number, clinicId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  const conditions = [eq(prosthesisOrders.id, id)];
  if (clinicId) conditions.push(eq(prosthesisOrders.clinicId, clinicId));
  const result = await db.select().from(prosthesisOrders).where(and(...conditions)).limit(1);
  return result[0];
}

export async function createProsthesisOrder(data: InsertProsthesisOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(prosthesisOrders).values(data);
  return { id: result[0].insertId };
}

export async function updateProsthesisOrder(id: number, data: Partial<InsertProsthesisOrder>, clinicId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(prosthesisOrders.id, id)];
  if (clinicId) conditions.push(eq(prosthesisOrders.clinicId, clinicId));
  await db.update(prosthesisOrders).set(data).where(and(...conditions));
}

export async function deleteProsthesisOrder(id: number, clinicId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(prosthesisOrders.id, id)];
  if (clinicId) conditions.push(eq(prosthesisOrders.clinicId, clinicId));
  await db.delete(prosthesisOrders).where(and(...conditions));
}

export async function getProsthesisStats(clinicId?: number) {
  const db = await getDb();
  if (!db) return { pending: 0, sentToLab: 0, inProduction: 0, ready: 0, delivered: 0, installed: 0, total: 0, labCost: 0, revenue: 0 };
  
  const clinicCondition = clinicId ? eq(prosthesisOrders.clinicId, clinicId) : undefined;
  
  const [pending, sentToLab, inProduction, ready, delivered, installed, costs] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(prosthesisOrders).where(clinicCondition ? and(eq(prosthesisOrders.status, "pending"), clinicCondition) : eq(prosthesisOrders.status, "pending")),
    db.select({ count: sql<number>`count(*)` }).from(prosthesisOrders).where(clinicCondition ? and(eq(prosthesisOrders.status, "sent_to_lab"), clinicCondition) : eq(prosthesisOrders.status, "sent_to_lab")),
    db.select({ count: sql<number>`count(*)` }).from(prosthesisOrders).where(clinicCondition ? and(eq(prosthesisOrders.status, "in_production"), clinicCondition) : eq(prosthesisOrders.status, "in_production")),
    db.select({ count: sql<number>`count(*)` }).from(prosthesisOrders).where(clinicCondition ? and(eq(prosthesisOrders.status, "ready"), clinicCondition) : eq(prosthesisOrders.status, "ready")),
    db.select({ count: sql<number>`count(*)` }).from(prosthesisOrders).where(clinicCondition ? and(eq(prosthesisOrders.status, "delivered"), clinicCondition) : eq(prosthesisOrders.status, "delivered")),
    db.select({ count: sql<number>`count(*)` }).from(prosthesisOrders).where(clinicCondition ? and(eq(prosthesisOrders.status, "installed"), clinicCondition) : eq(prosthesisOrders.status, "installed")),
    db.select({ 
      labCost: sql<number>`COALESCE(SUM(${prosthesisOrders.labCost}), 0)`,
      revenue: sql<number>`COALESCE(SUM(${prosthesisOrders.price}), 0)`,
      total: sql<number>`count(*)`
    }).from(prosthesisOrders).where(clinicCondition)
  ]);
  
  return {
    pending: pending[0]?.count ?? 0,
    sentToLab: sentToLab[0]?.count ?? 0,
    inProduction: inProduction[0]?.count ?? 0,
    ready: ready[0]?.count ?? 0,
    delivered: delivered[0]?.count ?? 0,
    installed: installed[0]?.count ?? 0,
    total: costs[0]?.total ?? 0,
    labCost: costs[0]?.labCost ?? 0,
    revenue: costs[0]?.revenue ?? 0
  };
}

// ==================== AI ANALYSIS ====================
export async function getAiAnalyses(patientId?: number, clinicId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (clinicId) conditions.push(eq(aiAnalysis.clinicId, clinicId));
  if (patientId) conditions.push(eq(aiAnalysis.patientId, patientId));
  
  if (conditions.length > 0) {
    return db.select().from(aiAnalysis)
      .where(and(...conditions))
      .orderBy(desc(aiAnalysis.createdAt));
  }
  return db.select().from(aiAnalysis).orderBy(desc(aiAnalysis.createdAt));
}

export async function createAiAnalysis(data: InsertAiAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(aiAnalysis).values(data);
  return { id: result[0].insertId };
}

export async function updateAiAnalysis(id: number, data: Partial<InsertAiAnalysis>, clinicId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(aiAnalysis.id, id)];
  if (clinicId) conditions.push(eq(aiAnalysis.clinicId, clinicId));
  await db.update(aiAnalysis).set(data).where(and(...conditions));
}

// ==================== CHECKINS ====================
export async function getCheckins(status?: string, clinicId?: number) {
  const db = await getDb();
  if (!db) return [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const conditions = [gte(checkins.checkinTime, today)];
  if (clinicId) conditions.push(eq(checkins.clinicId, clinicId));
  if (status) conditions.push(eq(checkins.status, status as any));
  
  return db.select().from(checkins)
    .where(and(...conditions))
    .orderBy(checkins.checkinTime);
}

export async function createCheckin(data: InsertCheckin) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Se não tem patientId mas tem nome e telefone, cadastrar paciente automaticamente
  if (!data.patientId && data.patientName && data.phone) {
    // Verificar se já existe paciente com esse telefone
    const [existingPatient] = await db.select()
      .from(patients)
      .where(and(
        eq(patients.phone, data.phone),
        eq(patients.clinicId, data.clinicId!)
      ))
      .limit(1);
    
    if (existingPatient) {
      // Usar paciente existente
      data.patientId = existingPatient.id;
    } else {
      // Criar novo paciente
      const newPatient = await db.insert(patients).values({
        name: data.patientName,
        phone: data.phone,
        clinicId: data.clinicId!,
        isActive: true,
        createdAt: new Date(),
      });
      data.patientId = newPatient[0].insertId;
    }
  }
  
  const result = await db.insert(checkins).values(data);
  return { id: result[0].insertId };
}

export async function updateCheckin(id: number, data: Partial<InsertCheckin>, clinicId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(checkins.id, id)];
  if (clinicId) conditions.push(eq(checkins.clinicId, clinicId));
  await db.update(checkins).set(data).where(and(...conditions));
}

export async function getCheckinQueuePosition(id: number) {
  const db = await getDb();
  if (!db) return { position: 0, status: "waiting" as const };
  
  // Buscar o check-in específico
  const [checkin] = await db.select().from(checkins).where(eq(checkins.id, id)).limit(1);
  if (!checkin) return { position: 0, status: "waiting" as const };
  
  // Contar quantos estão na frente (mesmo tipo de fila, status waiting, criados antes)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const waitingBefore = await db.select({ count: sql<number>`count(*)` })
    .from(checkins)
    .where(and(
      sql`${checkins.clinicId} = ${checkin.clinicId}`,
      sql`${checkins.queueType} = ${checkin.queueType}`,
      eq(checkins.status, "waiting"),
      gte(checkins.checkinTime, today),
      lt(checkins.checkinTime, checkin.checkinTime)
    ));
  
  const position = (waitingBefore[0]?.count || 0) + 1;
  
  return {
    position,
    status: checkin.status,
    queueType: checkin.queueType,
    patientName: checkin.patientName,
  };
}

// ==================== ADVANCED DASHBOARD STATS ====================
export async function getAdvancedDashboardStats(days: number = 30, clinicId?: number) {
  const db = await getDb();
  if (!db) return {
    budgetEvolution: [],
    paymentMethods: [],
    conversionRate: { approved: 0, rejected: 0, pending: 0 },
    monthlyPerformance: []
  };

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Budget evolution by day - using raw SQL to avoid GROUP BY issues
  const clinicFilter = clinicId ? sql` AND clinicId = ${clinicId}` : sql``;
  const budgetEvolutionResult = await db.execute(
    sql`SELECT DATE(createdAt) as date, COUNT(*) as count, COALESCE(SUM(finalValue), 0) as total 
        FROM budgets 
        WHERE createdAt >= ${startDate}${clinicFilter}
        GROUP BY DATE(createdAt) 
        ORDER BY DATE(createdAt)`
  );
  const budgetEvolution = (budgetEvolutionResult[0] as unknown) as Array<{date: string, count: number, total: number}>;

  // Payment methods distribution
  const transactionConditions = [
    eq(transactions.type, "income"),
    gte(transactions.date, startDate)
  ];
  if (clinicId) transactionConditions.push(eq(transactions.clinicId, clinicId));
  
  const paymentMethods = await db.select({
    method: transactions.paymentMethod,
    count: sql<number>`COUNT(*)`,
    total: sql<number>`COALESCE(SUM(${transactions.value}), 0)`
  })
    .from(transactions)
    .where(and(...transactionConditions))
    .groupBy(transactions.paymentMethod);

  // Conversion rate
  const budgetConditions = [gte(budgets.createdAt, startDate)];
  if (clinicId) budgetConditions.push(eq(budgets.clinicId, clinicId));
  
  const conversionRate = await db.select({
    status: budgets.status,
    count: sql<number>`COUNT(*)`
  })
    .from(budgets)
    .where(and(...budgetConditions))
    .groupBy(budgets.status);

  const conversion = {
    approved: 0,
    rejected: 0,
    pending: 0
  };
  conversionRate.forEach(item => {
    if (item.status === 'approved' || item.status === 'completed' || item.status === 'in_progress') {
      conversion.approved += item.count;
    } else if (item.status === 'rejected') {
      conversion.rejected += item.count;
    } else {
      conversion.pending += item.count;
    }
  });

  return {
    budgetEvolution,
    paymentMethods,
    conversionRate: conversion,
    monthlyPerformance: budgetEvolution
  };
}

// ==================== QUEUE STATS ====================
export async function getQueueStats(clinicId?: number) {
  const db = await getDb();
  if (!db) return {
    budgetQueue: 0,
    dentistQueue: 0,
    orthodonticsQueue: 0,
    implantQueue: 0,
    prosthesisQueue: 0,
    inService: 0,
    completedToday: 0,
    pendingActions: 0
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build conditions for each queue type
  const budgetCond = clinicId 
    ? and(eq(waitingQueue.queueType, "budget"), eq(waitingQueue.status, "waiting"), eq(waitingQueue.clinicId, clinicId))
    : and(eq(waitingQueue.queueType, "budget"), eq(waitingQueue.status, "waiting"));
  const dentistCond = clinicId
    ? and(eq(waitingQueue.queueType, "dentist"), eq(waitingQueue.status, "waiting"), eq(waitingQueue.clinicId, clinicId))
    : and(eq(waitingQueue.queueType, "dentist"), eq(waitingQueue.status, "waiting"));
  const orthoCond = clinicId
    ? and(eq(waitingQueue.queueType, "orthodontics"), eq(waitingQueue.status, "waiting"), eq(waitingQueue.clinicId, clinicId))
    : and(eq(waitingQueue.queueType, "orthodontics"), eq(waitingQueue.status, "waiting"));
  const implantCond = clinicId
    ? and(eq(waitingQueue.queueType, "implant"), eq(waitingQueue.status, "waiting"), eq(waitingQueue.clinicId, clinicId))
    : and(eq(waitingQueue.queueType, "implant"), eq(waitingQueue.status, "waiting"));
  const prosthCond = clinicId
    ? and(eq(waitingQueue.queueType, "prosthetics"), eq(waitingQueue.status, "waiting"), eq(waitingQueue.clinicId, clinicId))
    : and(eq(waitingQueue.queueType, "prosthetics"), eq(waitingQueue.status, "waiting"));
  const inServiceCond = clinicId
    ? and(eq(waitingQueue.status, "in_service"), eq(waitingQueue.clinicId, clinicId))
    : eq(waitingQueue.status, "in_service");
  const completedCond = clinicId
    ? and(eq(waitingQueue.status, "completed"), gte(waitingQueue.createdAt, today), eq(waitingQueue.clinicId, clinicId))
    : and(eq(waitingQueue.status, "completed"), gte(waitingQueue.createdAt, today));

  const [budgetQ, dentistQ, orthoQ, implantQ, prosthQ, inService, completed] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(waitingQueue).where(budgetCond),
    db.select({ count: sql<number>`count(*)` }).from(waitingQueue).where(dentistCond),
    db.select({ count: sql<number>`count(*)` }).from(waitingQueue).where(orthoCond),
    db.select({ count: sql<number>`count(*)` }).from(waitingQueue).where(implantCond),
    db.select({ count: sql<number>`count(*)` }).from(waitingQueue).where(prosthCond),
    db.select({ count: sql<number>`count(*)` }).from(waitingQueue).where(inServiceCond),
    db.select({ count: sql<number>`count(*)` }).from(waitingQueue).where(completedCond)
  ]);

  return {
    budgetQueue: budgetQ[0]?.count ?? 0,
    dentistQueue: dentistQ[0]?.count ?? 0,
    orthodonticsQueue: orthoQ[0]?.count ?? 0,
    implantQueue: implantQ[0]?.count ?? 0,
    prosthesisQueue: prosthQ[0]?.count ?? 0,
    inService: inService[0]?.count ?? 0,
    completedToday: completed[0]?.count ?? 0,
    pendingActions: 0
  };
}


// ==================== WHATSAPP NOTIFICATIONS ====================
export async function createWhatsappNotification(data: InsertWhatsappNotification) {
  const db = await getDb();
  if (!db) return { id: 0 };
  const result = await db.insert(whatsappNotifications).values(data);
  return { id: result[0].insertId };
}

export async function getWhatsappNotifications(filters?: { status?: string; type?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(whatsappNotifications);
  const conditions = [];
  
  if (filters?.status) {
    conditions.push(eq(whatsappNotifications.status, filters.status as any));
  }
  if (filters?.type) {
    conditions.push(eq(whatsappNotifications.type, filters.type as any));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return query.orderBy(desc(whatsappNotifications.createdAt)).limit(100);
}

export async function updateWhatsappNotification(id: number, data: Partial<InsertWhatsappNotification>) {
  const db = await getDb();
  if (!db) return;
  await db.update(whatsappNotifications).set(data).where(eq(whatsappNotifications.id, id));
}

export async function getPendingNotifications() {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  return db.select().from(whatsappNotifications)
    .where(and(
      eq(whatsappNotifications.status, "pending"),
      or(
        sql`${whatsappNotifications.scheduledFor} IS NULL`,
        lte(whatsappNotifications.scheduledFor, now)
      )
    ))
    .orderBy(whatsappNotifications.createdAt);
}

// ==================== NOTIFICATION SETTINGS ====================
export async function getNotificationSettings() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(notificationSettings).limit(1);
  return result[0] || null;
}

export async function upsertNotificationSettings(data: InsertNotificationSettings) {
  const db = await getDb();
  if (!db) return;
  
  const existing = await getNotificationSettings();
  if (existing) {
    await db.update(notificationSettings).set(data).where(eq(notificationSettings.id, existing.id));
  } else {
    await db.insert(notificationSettings).values(data);
  }
}

// ==================== ORTHODONTIC TREATMENTS ====================
export async function createOrthodonticTreatment(data: InsertOrthodonticTreatment) {
  const db = await getDb();
  if (!db) return { id: 0 };
  const result = await db.insert(orthodonticTreatments).values(data);
  return { id: result[0].insertId };
}

export async function getOrthodonticTreatments(filters?: { patientId?: number; dentistId?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(orthodonticTreatments);
  const conditions = [];
  
  if (filters?.patientId) {
    conditions.push(eq(orthodonticTreatments.patientId, filters.patientId));
  }
  if (filters?.dentistId) {
    conditions.push(eq(orthodonticTreatments.dentistId, filters.dentistId));
  }
  if (filters?.status) {
    conditions.push(eq(orthodonticTreatments.status, filters.status as any));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return query.orderBy(desc(orthodonticTreatments.createdAt));
}

export async function getOrthodonticTreatmentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(orthodonticTreatments).where(eq(orthodonticTreatments.id, id)).limit(1);
  return result[0] || null;
}

export async function updateOrthodonticTreatment(id: number, data: Partial<InsertOrthodonticTreatment>) {
  const db = await getDb();
  if (!db) return;
  await db.update(orthodonticTreatments).set(data).where(eq(orthodonticTreatments.id, id));
}

// ==================== ORTHODONTIC MAINTENANCES ====================
export async function createOrthodonticMaintenance(data: InsertOrthodonticMaintenance) {
  const db = await getDb();
  if (!db) return { id: 0 };
  const result = await db.insert(orthodonticMaintenances).values(data);
  return { id: result[0].insertId };
}

export async function getOrthodonticMaintenances(treatmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orthodonticMaintenances)
    .where(eq(orthodonticMaintenances.treatmentId, treatmentId))
    .orderBy(desc(orthodonticMaintenances.date));
}

// ==================== IMPLANT PLANS ====================
export async function createImplantPlan(data: InsertImplantPlan) {
  const db = await getDb();
  if (!db) return { id: 0 };
  const result = await db.insert(implantPlans).values(data);
  return { id: result[0].insertId };
}

export async function getImplantPlans(filters?: { patientId?: number; dentistId?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(implantPlans);
  const conditions = [];
  
  if (filters?.patientId) {
    conditions.push(eq(implantPlans.patientId, filters.patientId));
  }
  if (filters?.dentistId) {
    conditions.push(eq(implantPlans.dentistId, filters.dentistId));
  }
  if (filters?.status) {
    conditions.push(eq(implantPlans.status, filters.status as any));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return query.orderBy(desc(implantPlans.createdAt));
}

export async function getImplantPlanById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(implantPlans).where(eq(implantPlans.id, id)).limit(1);
  return result[0] || null;
}

export async function updateImplantPlan(id: number, data: Partial<InsertImplantPlan>) {
  const db = await getDb();
  if (!db) return;
  await db.update(implantPlans).set(data).where(eq(implantPlans.id, id));
}

// ==================== USER PERMISSIONS ====================
export async function getUserPermissions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userPermissions).where(eq(userPermissions.userId, userId));
}

export async function setUserPermission(data: InsertUserPermission) {
  const db = await getDb();
  if (!db) return { id: 0 };
  
  // Check if permission already exists
  const existing = await db.select().from(userPermissions)
    .where(and(
      eq(userPermissions.userId, data.userId),
      eq(userPermissions.module, data.module)
    )).limit(1);
  
  if (existing.length > 0) {
    await db.update(userPermissions).set(data).where(eq(userPermissions.id, existing[0].id));
    return { id: existing[0].id };
  } else {
    const result = await db.insert(userPermissions).values(data);
    return { id: result[0].insertId };
  }
}

export async function deleteUserPermissions(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(userPermissions).where(eq(userPermissions.userId, userId));
}

// ==================== ACCESS PROFILES ====================
export async function getAccessProfiles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(accessProfiles).orderBy(accessProfiles.name);
}

export async function createAccessProfile(data: InsertAccessProfile) {
  const db = await getDb();
  if (!db) return { id: 0 };
  const result = await db.insert(accessProfiles).values(data);
  return { id: result[0].insertId };
}

export async function updateAccessProfile(id: number, data: Partial<InsertAccessProfile>) {
  const db = await getDb();
  if (!db) return;
  await db.update(accessProfiles).set(data).where(eq(accessProfiles.id, id));
}

export async function deleteAccessProfile(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(accessProfiles).where(eq(accessProfiles.id, id));
}

// ==================== DENTIST AREA STATS ====================
export async function getDentistAreaStats(dentistId: number) {
  const db = await getDb();
  if (!db) return {
    todayAppointments: [],
    pendingTreatments: 0,
    monthlyPatients: 0,
    pendingBudgets: 0
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todayAppts, pendingTreatments, monthlyPatients, pendingBudgets] = await Promise.all([
    db.select().from(appointments)
      .where(and(
        eq(appointments.dentistId, dentistId),
        gte(appointments.date, today),
        lte(appointments.date, tomorrow)
      ))
      .orderBy(appointments.startTime),
    db.select({ count: sql<number>`count(*)` }).from(budgetItems)
      .where(and(
        eq(budgetItems.status, "in_progress")
      )),
    db.select({ count: sql<number>`count(distinct patientId)` }).from(appointments)
      .where(and(
        eq(appointments.dentistId, dentistId),
        gte(appointments.date, monthStart)
      )),
    db.select({ count: sql<number>`count(*)` }).from(budgets)
      .where(and(
        eq(budgets.dentistId, dentistId),
        eq(budgets.status, "pending")
      ))
  ]);

  return {
    todayAppointments: todayAppts,
    pendingTreatments: pendingTreatments[0]?.count ?? 0,
    monthlyPatients: monthlyPatients[0]?.count ?? 0,
    pendingBudgets: pendingBudgets[0]?.count ?? 0
  };
}

// ==================== ORTHODONTIST STATS ====================
export async function getOrthodontistStats(dentistId?: number) {
  const db = await getDb();
  if (!db) return {
    activeTreatments: 0,
    completedTreatments: 0,
    pendingMaintenances: 0,
    totalPatients: 0
  };

  const conditions = dentistId ? [eq(orthodonticTreatments.dentistId, dentistId)] : [];
  
  const [active, completed, patients] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(orthodonticTreatments)
      .where(conditions.length > 0 ? and(eq(orthodonticTreatments.status, "active"), ...conditions) : eq(orthodonticTreatments.status, "active")),
    db.select({ count: sql<number>`count(*)` }).from(orthodonticTreatments)
      .where(conditions.length > 0 ? and(eq(orthodonticTreatments.status, "completed"), ...conditions) : eq(orthodonticTreatments.status, "completed")),
    db.select({ count: sql<number>`count(distinct patientId)` }).from(orthodonticTreatments)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
  ]);

  return {
    activeTreatments: active[0]?.count ?? 0,
    completedTreatments: completed[0]?.count ?? 0,
    pendingMaintenances: 0,
    totalPatients: patients[0]?.count ?? 0
  };
}

// ==================== IMPLANTOLOGIST STATS ====================
export async function getImplantologistStats(dentistId?: number) {
  const db = await getDb();
  if (!db) return {
    planningPhase: 0,
    surgeryScheduled: 0,
    healingPhase: 0,
    prosthesisPhase: 0,
    completed: 0,
    totalImplants: 0
  };

  const conditions = dentistId ? [eq(implantPlans.dentistId, dentistId)] : [];
  
  const stats = await db.select({
    status: implantPlans.status,
    count: sql<number>`count(*)`
  }).from(implantPlans)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(implantPlans.status);

  const result = {
    planningPhase: 0,
    surgeryScheduled: 0,
    healingPhase: 0,
    prosthesisPhase: 0,
    completed: 0,
    totalImplants: 0
  };

  stats.forEach(s => {
    if (s.status === "planning") result.planningPhase = s.count;
    if (s.status === "surgery_scheduled") result.surgeryScheduled = s.count;
    if (s.status === "healing") result.healingPhase = s.count;
    if (s.status === "prosthesis_phase") result.prosthesisPhase = s.count;
    if (s.status === "completed") result.completed = s.count;
    result.totalImplants += s.count;
  });

  return result;
}


// ==================== CONSULTÓRIOS ====================
export async function getOffices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(offices).orderBy(offices.name);
}

export async function getOfficesByClinic(clinicId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(offices).where(eq(offices.clinicId, clinicId)).orderBy(offices.name);
}

export async function getActiveOffices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(offices).where(eq(offices.isActive, true)).orderBy(offices.name);
}

export async function getActiveOfficesByClinic(clinicId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(offices).where(and(eq(offices.clinicId, clinicId), eq(offices.isActive, true))).orderBy(offices.name);
}

export async function getOfficeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(offices).where(eq(offices.id, id)).limit(1);
  return result[0];
}

export async function createOffice(data: InsertOffice) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(offices).values(data);
  return { id: result[0].insertId };
}

export async function updateOffice(id: number, data: Partial<InsertOffice>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(offices).set(data).where(eq(offices.id, id));
  return { success: true };
}

export async function deleteOffice(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(offices).where(eq(offices.id, id));
  return { success: true };
}

// ==================== FILA DE ATENDIMENTO ====================
export async function getServiceQueue(queueType?: string, clinicId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  
  if (clinicId) {
    conditions.push(eq(serviceQueue.clinicId, clinicId));
  }
  
  conditions.push(or(
    eq(serviceQueue.status, "waiting"),
    eq(serviceQueue.status, "called"),
    eq(serviceQueue.status, "in_service"),
    eq(serviceQueue.status, "pending_payment")
  ));
  
  if (queueType) {
    conditions.push(eq(serviceQueue.queueType, queueType as any));
    return db.select().from(serviceQueue)
      .where(and(...conditions))
      .orderBy(serviceQueue.arrivalTime);
  }
  
  return db.select().from(serviceQueue)
    .where(and(...conditions))
    .orderBy(serviceQueue.arrivalTime);
}

export async function getServiceQueueEntry(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(serviceQueue).where(eq(serviceQueue.id, id)).limit(1);
  return result[0];
}

export async function addToServiceQueue(data: InsertServiceQueue) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(serviceQueue).values(data);
  
  // Adicionar ao histórico
  await db.insert(queueHistory).values({
    queueEntryId: result[0].insertId,
    patientId: data.patientId,
    action: "added",
    toQueue: data.queueType,
    notes: data.notes,
  });
  
  return { id: result[0].insertId };
}

export async function updateServiceQueueEntry(id: number, data: Partial<InsertServiceQueue>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(serviceQueue).set({ ...data, updatedAt: new Date() }).where(eq(serviceQueue.id, id));
  return { success: true };
}

export async function callPatientFromQueue(id: number, officeId: number, officeName: string, professionalId?: number, professionalName?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const entry = await getServiceQueueEntry(id);
  if (!entry) throw new Error("Queue entry not found");
  
  // Atualizar entrada na fila
  await db.update(serviceQueue).set({
    status: "called",
    officeId,
    officeName,
    professionalId,
    professionalName,
    calledTime: new Date(),
    updatedAt: new Date(),
  }).where(eq(serviceQueue.id, id));
  
  // Adicionar ao histórico
  await db.insert(queueHistory).values({
    queueEntryId: id,
    patientId: entry.patientId,
    action: "called",
    fromQueue: entry.queueType,
    officeId,
    officeName,
    professionalId,
    professionalName,
  });
  
  // Adicionar chamada ao painel TV
  await db.insert(tvPanelCalls).values({
    queueEntryId: id,
    patientName: entry.patientName,
    officeName,
    officeNumber: officeName,
    professionalName,
    queueType: entry.queueType,
    isActive: true,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // Expira em 5 minutos
  });
  
  return { success: true };
}

export async function startService(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const entry = await getServiceQueueEntry(id);
  if (!entry) throw new Error("Queue entry not found");
  
  await db.update(serviceQueue).set({
    status: "in_service",
    serviceStartTime: new Date(),
    updatedAt: new Date(),
  }).where(eq(serviceQueue.id, id));
  
  // Desativar chamada no painel TV
  await db.update(tvPanelCalls).set({ isActive: false }).where(eq(tvPanelCalls.queueEntryId, id));
  
  // Adicionar ao histórico
  await db.insert(queueHistory).values({
    queueEntryId: id,
    patientId: entry.patientId,
    action: "started",
    fromQueue: entry.queueType,
    officeId: entry.officeId,
    officeName: entry.officeName,
    professionalId: entry.professionalId,
    professionalName: entry.professionalName,
  });
  
  return { success: true };
}

export async function finishServiceAndForward(id: number, nextQueue: string, notes?: string, evaluationNotes?: string, amountToPay?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const entry = await getServiceQueueEntry(id);
  if (!entry) throw new Error("Queue entry not found");
  
  // Atualizar entrada atual como encaminhada
  await db.update(serviceQueue).set({
    status: "forwarded",
    serviceEndTime: new Date(),
    nextQueue,
    notes: notes || entry.notes,
    evaluationNotes,
    amountToPay: amountToPay ? amountToPay.toString() : entry.amountToPay,
    updatedAt: new Date(),
  }).where(eq(serviceQueue.id, id));
  
  // Adicionar ao histórico
  await db.insert(queueHistory).values({
    queueEntryId: id,
    patientId: entry.patientId,
    action: "forwarded",
    fromQueue: entry.queueType,
    toQueue: nextQueue,
    officeId: entry.officeId,
    officeName: entry.officeName,
    professionalId: entry.professionalId,
    professionalName: entry.professionalName,
    notes,
  });
  
  // Criar nova entrada na próxima fila
  const newEntry = await db.insert(serviceQueue).values({
    clinicId: entry.clinicId,
    patientId: entry.patientId,
    patientName: entry.patientName,
    queueType: nextQueue as any,
    status: "waiting",
    priority: entry.priority,
    budgetId: entry.budgetId,
    budgetValue: entry.budgetValue,
    amountToPay: amountToPay ? amountToPay.toString() : entry.amountToPay,
    amountPaid: entry.amountPaid,
    paymentStatus: entry.paymentStatus,
    originQueue: entry.queueType,
    originProfessional: entry.professionalName,
    notes: notes || entry.notes,
    evaluationNotes,
  });
  
  // Adicionar ao histórico da nova entrada
  await db.insert(queueHistory).values({
    queueEntryId: newEntry[0].insertId,
    patientId: entry.patientId,
    action: "added",
    fromQueue: entry.queueType,
    toQueue: nextQueue,
    notes: `Encaminhado de ${entry.queueType}`,
  });
  
  return { success: true, newEntryId: newEntry[0].insertId };
}

export async function requestPayment(id: number, amountToPay: number, evaluationNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const entry = await getServiceQueueEntry(id);
  if (!entry) throw new Error("Queue entry not found");
  
  // Permitir requisição de pagamento independentemente do status do atendimento
  // Isso permite atendimentos manuais diretos no Orçamentista sem passar pelo Atendente
  
  await db.update(serviceQueue).set({
    status: "pending_payment",
    amountToPay: amountToPay.toString(),
    evaluationNotes,
    serviceEndTime: new Date(),
    nextQueue: "reception",
    updatedAt: new Date(),
  }).where(eq(serviceQueue.id, id));
  
  // Adicionar ao histórico
  await db.insert(queueHistory).values({
    queueEntryId: id,
    patientId: entry.patientId,
    action: "payment_requested",
    fromQueue: entry.queueType,
    toQueue: "reception",
    professionalId: entry.professionalId,
    professionalName: entry.professionalName,
    notes: `Valor: R$ ${amountToPay.toFixed(2)}`,
  });
  
  // Criar entrada na recepção para pagamento
  const newEntry = await db.insert(serviceQueue).values({
    clinicId: entry.clinicId,
    patientId: entry.patientId,
    patientName: entry.patientName,
    queueType: "reception",
    status: "pending_payment",
    priority: entry.priority,
    budgetId: entry.budgetId,
    budgetValue: entry.budgetValue,
    amountToPay: amountToPay.toString(),
    paymentStatus: "pending",
    originQueue: entry.queueType,
    originProfessional: entry.professionalName,
    evaluationNotes,
    notes: entry.notes,
  });
  
  return { success: true, newEntryId: newEntry[0].insertId };
}

export async function receivePayment(id: number, amountPaid: number, paymentMethod: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const entry = await getServiceQueueEntry(id);
  if (!entry) throw new Error("Queue entry not found");
  
  const totalPaid = Number(entry.amountPaid || 0) + amountPaid;
  const amountToPay = Number(entry.amountToPay || 0);
  const paymentStatus = totalPaid >= amountToPay ? "paid" : "partial";
  
  await db.update(serviceQueue).set({
    amountPaid: totalPaid.toString(),
    paymentMethod,
    paymentStatus,
    updatedAt: new Date(),
  }).where(eq(serviceQueue.id, id));
  
  // Adicionar ao histórico
  await db.insert(queueHistory).values({
    queueEntryId: id,
    patientId: entry.patientId,
    action: "payment_received",
    notes: `Valor: R$ ${amountPaid.toFixed(2)} - ${paymentMethod}`,
  });
  
  return { success: true, paymentStatus };
}

export async function completeService(id: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const entry = await getServiceQueueEntry(id);
  if (!entry) throw new Error("Queue entry not found");
  
  await db.update(serviceQueue).set({
    status: "completed",
    serviceEndTime: new Date(),
    notes: notes || entry.notes,
    updatedAt: new Date(),
  }).where(eq(serviceQueue.id, id));
  
  // Desativar chamada no painel TV
  await db.update(tvPanelCalls).set({ isActive: false }).where(eq(tvPanelCalls.queueEntryId, id));
  
  // Adicionar ao histórico
  await db.insert(queueHistory).values({
    queueEntryId: id,
    patientId: entry.patientId,
    action: "completed",
    fromQueue: entry.queueType,
    officeId: entry.officeId,
    officeName: entry.officeName,
    professionalId: entry.professionalId,
    professionalName: entry.professionalName,
    notes,
  });
  
  return { success: true };
}

export async function cancelServiceQueueEntry(id: number, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const entry = await getServiceQueueEntry(id);
  if (!entry) throw new Error("Queue entry not found");
  
  // Marcar como cancelado (usando status completed mas com nota de cancelamento)
  await db.update(serviceQueue).set({
    status: "completed",
    serviceEndTime: new Date(),
    notes: reason ? `CANCELADO: ${reason}` : "CANCELADO pelo orçamentista",
    updatedAt: new Date(),
  }).where(eq(serviceQueue.id, id));
  
  // Desativar chamada no painel TV
  await db.update(tvPanelCalls).set({ isActive: false }).where(eq(tvPanelCalls.queueEntryId, id));
  
  // Adicionar ao histórico
  await db.insert(queueHistory).values({
    queueEntryId: id,
    patientId: entry.patientId,
    action: "cancelled",
    fromQueue: entry.queueType,
    officeId: entry.officeId,
    officeName: entry.officeName,
    professionalId: entry.professionalId,
    professionalName: entry.professionalName,
    notes: reason || "Cancelado pelo orçamentista",
  });
  
  return { success: true };
}

export async function getServiceQueueStats(clinicId?: number) {
  const db = await getDb();
  if (!db) return {
    reception: 0,
    budget: 0,
    dentist: 0,
    orthodontics: 0,
    implant: 0,
    prosthetics: 0,
    maxillofacial: 0,
    pediatric: 0,
    total: 0,
  };
  
  const conditions = [];
  
  if (clinicId) {
    conditions.push(eq(serviceQueue.clinicId, clinicId));
  }
  
  conditions.push(or(
    eq(serviceQueue.status, "waiting"),
    eq(serviceQueue.status, "called"),
    eq(serviceQueue.status, "in_service"),
    eq(serviceQueue.status, "pending_payment")
  ));
  
  const result = await db.select({
    queueType: serviceQueue.queueType,
    count: sql<number>`count(*)`,
  }).from(serviceQueue)
    .where(and(...conditions))
    .groupBy(serviceQueue.queueType);
  
  const stats = {
    reception: 0,
    budget: 0,
    dentist: 0,
    orthodontics: 0,
    implant: 0,
    prosthetics: 0,
    maxillofacial: 0,
    pediatric: 0,
    total: 0,
  };
  
  result.forEach((r) => {
    const key = r.queueType as keyof typeof stats;
    if (key in stats) {
      stats[key] = Number(r.count);
      stats.total += Number(r.count);
    }
  });
  
  return stats;
}

// ==================== PAINEL TV ====================
export async function getActiveTvPanelCalls() {
  const db = await getDb();
  if (!db) return [];
  
  // Desativar chamadas expiradas
  await db.update(tvPanelCalls)
    .set({ isActive: false })
    .where(and(
      eq(tvPanelCalls.isActive, true),
      lte(tvPanelCalls.expiresAt, new Date())
    ));
  
  return db.select().from(tvPanelCalls)
    .where(eq(tvPanelCalls.isActive, true))
    .orderBy(desc(tvPanelCalls.calledAt))
    .limit(10);
}

export async function getRecentTvPanelCalls() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(tvPanelCalls)
    .orderBy(desc(tvPanelCalls.calledAt))
    .limit(20);
}

// ==================== HISTÓRICO DA FILA ====================
export async function getQueueHistoryByPatient(patientId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(queueHistory)
    .where(eq(queueHistory.patientId, patientId))
    .orderBy(desc(queueHistory.createdAt));
}

export async function getQueueHistoryByEntry(queueEntryId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(queueHistory)
    .where(eq(queueHistory.queueEntryId, queueEntryId))
    .orderBy(queueHistory.createdAt);
}


// ==================== AUTENTICAÇÃO PRÓPRIA ====================
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserWithPassword(data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  clinicId?: number;
  role?: "user" | "admin" | "superadmin";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const passwordHash = await hashPassword(data.password);
  
  const result = await db.insert(users).values({
    email: data.email,
    passwordHash,
    name: data.name,
    phone: data.phone || null,
    clinicId: data.clinicId || null,
    role: data.role || "user",
    loginMethod: "email",
    isActive: true,
    emailVerified: false,
    lastSignedIn: new Date(),
  });
  
  return { id: result[0].insertId };
}

export async function updateUserPassword(userId: number, newPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function updateUserLastSignIn(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

// ==================== CLÍNICAS ====================
export async function getClinics() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clinics).orderBy(desc(clinics.createdAt));
}

export async function getClinicById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clinics).where(eq(clinics.id, id)).limit(1);
  return result[0];
}

export async function getClinicBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clinics).where(eq(clinics.slug, slug)).limit(1);
  return result[0];
}

export async function createClinic(data: InsertClinic) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clinics).values(data);
  return { id: result[0].insertId };
}

export async function updateClinic(id: number, data: Partial<InsertClinic>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clinics).set(data).where(eq(clinics.id, id));
}

export async function deleteClinic(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clinics).where(eq(clinics.id, id));
}

export async function getClinicsCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(clinics);
  return result[0]?.count ?? 0;
}

// ==================== RELAÇÃO USUÁRIO-CLÍNICA ====================
export async function getUserClinics(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    userClinic: userClinics,
    clinic: clinics,
  })
    .from(userClinics)
    .innerJoin(clinics, eq(userClinics.clinicId, clinics.id))
    .where(eq(userClinics.userId, userId));
}

export async function getClinicUsers(clinicId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    userClinic: userClinics,
    user: users,
  })
    .from(userClinics)
    .innerJoin(users, eq(userClinics.userId, users.id))
    .where(eq(userClinics.clinicId, clinicId));
}

export async function addUserToClinic(data: InsertUserClinic) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(userClinics).values(data);
  return { id: result[0].insertId };
}

export async function removeUserFromClinic(userId: number, clinicId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userClinics)
    .where(and(eq(userClinics.userId, userId), eq(userClinics.clinicId, clinicId)));
}

export async function updateUserClinicRole(userId: number, clinicId: number, role: "owner" | "admin" | "atendente" | "dentista" | "protesista" | "ortodontista" | "implantodontista" | "bucomaxilo" | "odontopediatria") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(userClinics)
    .set({ role })
    .where(and(eq(userClinics.userId, userId), eq(userClinics.clinicId, clinicId)));
}

export async function getUserClinicRole(userId: number, clinicId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select()
    .from(userClinics)
    .where(and(eq(userClinics.userId, userId), eq(userClinics.clinicId, clinicId)))
    .limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getUsersByClinicId(clinicId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Buscar usuários que estão associados à clínica via user_clinics ou pelo clinicId direto
  const usersFromUserClinics = await db
    .select({
      id: users.id,
      openId: users.openId,
      name: users.name,
      email: users.email,
      role: users.role,
      clinicId: users.clinicId,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      lastSignedIn: users.lastSignedIn,
      loginMethod: users.loginMethod,
      clinicRole: userClinics.role,
    })
    .from(users)
    .innerJoin(userClinics, eq(users.id, userClinics.userId))
    .where(eq(userClinics.clinicId, clinicId))
    .orderBy(desc(users.createdAt));
  
  // Também buscar usuários que têm clinicId direto (para compatibilidade)
  const usersFromClinicId = await db
    .select()
    .from(users)
    .where(eq(users.clinicId, clinicId))
    .orderBy(desc(users.createdAt));
  
  // Combinar e remover duplicatas
  const allUserIds = new Set<number>();
  const combinedUsers: any[] = [];
  
  for (const user of usersFromUserClinics) {
    if (!allUserIds.has(user.id)) {
      allUserIds.add(user.id);
      combinedUsers.push(user);
    }
  }
  
  for (const user of usersFromClinicId) {
    if (!allUserIds.has(user.id)) {
      allUserIds.add(user.id);
      combinedUsers.push(user);
    }
  }
  
  return combinedUsers;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(data).where(eq(users.id, id));
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Primeiro remove relações com clínicas
  await db.delete(userClinics).where(eq(userClinics.userId, id));
  // Depois remove o usuário
  await db.delete(users).where(eq(users.id, id));
}


// ==================== GESTÃO DE USUÁRIOS DA CLÍNICA ====================
export async function inviteUserToClinic(email: string, clinicId: number, role: "owner" | "admin" | "atendente" | "dentista" | "protesista" | "ortodontista" | "implantodontista" | "bucomaxilo" | "odontopediatria") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se usuário já existe
  let user = await getUserByEmail(email);
  
  if (!user) {
    // Criar usuário com email (sem senha, será definida no primeiro acesso)
    const result = await db.insert(users).values({
      email,
      name: email.split('@')[0], // Nome temporário baseado no email
      role: 'user',
      isActive: true,
    });
    user = await getUserById(result[0].insertId);
  }
  
  if (!user) throw new Error("Failed to create user");
  
  // Verificar se já está vinculado à clínica
  const existingLink = await db.select().from(userClinics)
    .where(and(eq(userClinics.userId, user.id), eq(userClinics.clinicId, clinicId)))
    .limit(1);
  
  if (existingLink.length > 0) {
    // Atualizar role se já existe
    await db.update(userClinics)
      .set({ role, isActive: true })
      .where(and(eq(userClinics.userId, user.id), eq(userClinics.clinicId, clinicId)));
    return { userId: user.id, action: 'updated' };
  }
  
  // Criar vínculo
  await db.insert(userClinics).values({
    userId: user.id,
    clinicId,
    role,
    isActive: true,
  });
  
  return { userId: user.id, action: 'created' };
}

export async function getClinicUsersWithDetails(clinicId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: userClinics.id,
    userId: users.id,
    email: users.email,
    name: users.name,
    phone: users.phone,
    role: userClinics.role,
    isActive: userClinics.isActive,
    createdAt: userClinics.createdAt,
    lastSignedIn: users.lastSignedIn,
  })
    .from(userClinics)
    .innerJoin(users, eq(userClinics.userId, users.id))
    .where(eq(userClinics.clinicId, clinicId))
    .orderBy(userClinics.role, users.name);
}

export async function removeUserFromClinicById(userClinicId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userClinics).where(eq(userClinics.id, userClinicId));
}

export async function updateUserClinicById(userClinicId: number, data: { role?: string; isActive?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(userClinics).set(data as any).where(eq(userClinics.id, userClinicId));
}

// ==================== PERMISSÕES POR CARGO ====================

export async function getRolePermissions(role: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(rolePermissions).where(eq(rolePermissions.role, role as any)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllRolePermissions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rolePermissions);
}

export async function upsertRolePermissions(role: string, permissions: Partial<InsertRolePermission>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getRolePermissions(role);
  if (existing) {
    await db.update(rolePermissions).set(permissions).where(eq(rolePermissions.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(rolePermissions).values({ ...permissions, role: role as any });
    return (result as any)[0]?.insertId || 0;
  }
}

export async function initializeDefaultPermissions() {
  const db = await getDb();
  if (!db) return;
  
  // Permissões padrão para cada cargo
  const defaultPermissions: Record<string, Partial<InsertRolePermission>> = {
    owner: {
      canViewPainel: true,
      canViewAtendente: true,
      canViewPacientes: true,
      canViewProntuarios: true,
      canViewAgenda: true,
      canViewOrcamentista: true,
      canViewAreaDentista: true,
      canViewAreaOrtodontista: true,
      canViewAreaImplantodontista: true,
      canViewAreaProtesista: true,
      canViewAreaBucomaxilo: true,
      canViewAreaOdontopediatria: true,
      canViewProcedimentos: true,
      canViewDentistas: true,
      canViewProteses: true,
      canViewFinanceiro: true,
      canViewConvenios: true,
      canViewEstoque: true,
      canViewRelatorios: true,
      canViewAnaliseIA: true,
      canViewQRCheckin: true,
      canViewPainelTV: true,
      canViewNotificacoes: true,
      canViewGestaoUsuarios: true,
      canViewConfiguracoes: true,
      canViewAdmin: true,
    },
    admin: {
      canViewPainel: true,
      canViewAtendente: true,
      canViewPacientes: true,
      canViewProntuarios: true,
      canViewAgenda: true,
      canViewOrcamentista: true,
      canViewAreaDentista: true,
      canViewAreaOrtodontista: true,
      canViewAreaImplantodontista: true,
      canViewAreaProtesista: true,
      canViewAreaBucomaxilo: true,
      canViewAreaOdontopediatria: true,
      canViewProcedimentos: true,
      canViewDentistas: true,
      canViewProteses: true,
      canViewFinanceiro: true,
      canViewConvenios: true,
      canViewEstoque: true,
      canViewRelatorios: true,
      canViewAnaliseIA: true,
      canViewQRCheckin: true,
      canViewPainelTV: true,
      canViewNotificacoes: true,
      canViewGestaoUsuarios: true,
      canViewConfiguracoes: true,
      canViewAdmin: false,
    },
    atendente: {
      canViewPainel: true,
      canViewAtendente: true,
      canViewPacientes: true,
      canViewProntuarios: false,
      canViewAgenda: true,
      canViewOrcamentista: false,
      canViewAreaDentista: false,
      canViewAreaOrtodontista: false,
      canViewAreaImplantodontista: false,
      canViewAreaProtesista: false,
      canViewAreaBucomaxilo: false,
      canViewAreaOdontopediatria: false,
      canViewProcedimentos: false,
      canViewDentistas: false,
      canViewProteses: false,
      canViewFinanceiro: false,
      canViewConvenios: false,
      canViewEstoque: false,
      canViewRelatorios: false,
      canViewAnaliseIA: false,
      canViewQRCheckin: true,
      canViewPainelTV: true,
      canViewNotificacoes: true,
      canViewGestaoUsuarios: false,
      canViewConfiguracoes: false,
      canViewAdmin: false,
    },
    dentista: {
      canViewPainel: true,
      canViewAtendente: false,
      canViewPacientes: true,
      canViewProntuarios: true,
      canViewAgenda: true,
      canViewOrcamentista: true,
      canViewAreaDentista: true,
      canViewAreaOrtodontista: false,
      canViewAreaImplantodontista: false,
      canViewAreaProtesista: false,
      canViewAreaBucomaxilo: false,
      canViewAreaOdontopediatria: false,
      canViewProcedimentos: true,
      canViewDentistas: false,
      canViewProteses: false,
      canViewFinanceiro: false,
      canViewConvenios: false,
      canViewEstoque: false,
      canViewRelatorios: false,
      canViewAnaliseIA: true,
      canViewQRCheckin: false,
      canViewPainelTV: false,
      canViewNotificacoes: true,
      canViewGestaoUsuarios: false,
      canViewConfiguracoes: false,
      canViewAdmin: false,
    },
    ortodontista: {
      canViewPainel: true,
      canViewAtendente: false,
      canViewPacientes: true,
      canViewProntuarios: true,
      canViewAgenda: true,
      canViewOrcamentista: true,
      canViewAreaDentista: false,
      canViewAreaOrtodontista: true,
      canViewAreaImplantodontista: false,
      canViewAreaProtesista: false,
      canViewAreaBucomaxilo: false,
      canViewAreaOdontopediatria: false,
      canViewProcedimentos: true,
      canViewDentistas: false,
      canViewProteses: false,
      canViewFinanceiro: false,
      canViewConvenios: false,
      canViewEstoque: false,
      canViewRelatorios: false,
      canViewAnaliseIA: true,
      canViewQRCheckin: false,
      canViewPainelTV: false,
      canViewNotificacoes: true,
      canViewGestaoUsuarios: false,
      canViewConfiguracoes: false,
      canViewAdmin: false,
    },
    implantodontista: {
      canViewPainel: true,
      canViewAtendente: false,
      canViewPacientes: true,
      canViewProntuarios: true,
      canViewAgenda: true,
      canViewOrcamentista: true,
      canViewAreaDentista: false,
      canViewAreaOrtodontista: false,
      canViewAreaImplantodontista: true,
      canViewAreaProtesista: false,
      canViewAreaBucomaxilo: false,
      canViewAreaOdontopediatria: false,
      canViewProcedimentos: true,
      canViewDentistas: false,
      canViewProteses: false,
      canViewFinanceiro: false,
      canViewConvenios: false,
      canViewEstoque: false,
      canViewRelatorios: false,
      canViewAnaliseIA: true,
      canViewQRCheckin: false,
      canViewPainelTV: false,
      canViewNotificacoes: true,
      canViewGestaoUsuarios: false,
      canViewConfiguracoes: false,
      canViewAdmin: false,
    },
    protesista: {
      canViewPainel: true,
      canViewAtendente: false,
      canViewPacientes: true,
      canViewProntuarios: true,
      canViewAgenda: true,
      canViewOrcamentista: true,
      canViewAreaDentista: false,
      canViewAreaOrtodontista: false,
      canViewAreaImplantodontista: false,
      canViewAreaProtesista: true,
      canViewAreaBucomaxilo: false,
      canViewAreaOdontopediatria: false,
      canViewProcedimentos: true,
      canViewDentistas: false,
      canViewProteses: true,
      canViewFinanceiro: false,
      canViewConvenios: false,
      canViewEstoque: false,
      canViewRelatorios: false,
      canViewAnaliseIA: true,
      canViewQRCheckin: false,
      canViewPainelTV: false,
      canViewNotificacoes: true,
      canViewGestaoUsuarios: false,
      canViewConfiguracoes: false,
      canViewAdmin: false,
    },
    bucomaxilo: {
      canViewPainel: true,
      canViewAtendente: false,
      canViewPacientes: true,
      canViewProntuarios: true,
      canViewAgenda: true,
      canViewOrcamentista: true,
      canViewAreaDentista: false,
      canViewAreaOrtodontista: false,
      canViewAreaImplantodontista: false,
      canViewAreaProtesista: false,
      canViewAreaBucomaxilo: true,
      canViewAreaOdontopediatria: false,
      canViewProcedimentos: true,
      canViewDentistas: false,
      canViewProteses: false,
      canViewFinanceiro: false,
      canViewConvenios: false,
      canViewEstoque: false,
      canViewRelatorios: false,
      canViewAnaliseIA: true,
      canViewQRCheckin: false,
      canViewPainelTV: false,
      canViewNotificacoes: true,
      canViewGestaoUsuarios: false,
      canViewConfiguracoes: false,
      canViewAdmin: false,
    },
    odontopediatria: {
      canViewPainel: true,
      canViewAtendente: false,
      canViewPacientes: true,
      canViewProntuarios: true,
      canViewAgenda: true,
      canViewOrcamentista: true,
      canViewAreaDentista: false,
      canViewAreaOrtodontista: false,
      canViewAreaImplantodontista: false,
      canViewAreaProtesista: false,
      canViewAreaBucomaxilo: false,
      canViewAreaOdontopediatria: true,
      canViewProcedimentos: true,
      canViewDentistas: false,
      canViewProteses: false,
      canViewFinanceiro: false,
      canViewConvenios: false,
      canViewEstoque: false,
      canViewRelatorios: false,
      canViewAnaliseIA: true,
      canViewQRCheckin: false,
      canViewPainelTV: false,
      canViewNotificacoes: true,
      canViewGestaoUsuarios: false,
      canViewConfiguracoes: false,
      canViewAdmin: false,
    },
  };
  
  for (const [role, permissions] of Object.entries(defaultPermissions)) {
    const existing = await getRolePermissions(role);
    if (!existing) {
      await db.insert(rolePermissions).values({ ...permissions, role: role as any });
    }
  }
}


// ============ FUNÇÕES DE PLANOS E ASSINATURAS ============

export async function getPlans(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  
  if (activeOnly) {
    return db.select().from(plans).where(eq(plans.isActive, true)).orderBy(asc(plans.sortOrder));
  }
  return db.select().from(plans).orderBy(asc(plans.sortOrder));
}

export async function getPlanById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
  return result[0];
}

export async function getPlanBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(plans).where(eq(plans.slug, slug)).limit(1);
  return result[0];
}

export async function createPlan(data: InsertPlan) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(plans).values(data);
  return { id: result[0].insertId };
}

export async function updatePlan(id: number, data: Partial<InsertPlan>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(plans).set(data).where(eq(plans.id, id));
}

export async function deletePlan(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(plans).where(eq(plans.id, id));
}

// Funções de assinatura de clínicas
export async function updateClinicSubscription(clinicId: number, data: {
  planId?: number;
  subscriptionStatus?: "trial" | "active" | "past_due" | "canceled" | "suspended";
  trialEndsAt?: Date | null;
  subscriptionStartedAt?: Date | null;
  subscriptionEndsAt?: Date | null;
  lastPaymentAt?: Date | null;
  nextPaymentAt?: Date | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clinics).set(data).where(eq(clinics.id, clinicId));
}

export async function updateClinicStripeCustomer(clinicId: number, stripeCustomerId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clinics).set({ stripeCustomerId }).where(eq(clinics.id, clinicId));
}

export async function getClinicsWithSubscriptionStatus() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    clinic: clinics,
    plan: plans,
  })
  .from(clinics)
  .leftJoin(plans, eq(clinics.planId, plans.id))
  .orderBy(desc(clinics.createdAt));
  
  return result.map(r => ({
    ...r.clinic,
    plan: r.plan,
  }));
}

export async function getClinicSubscriptionStats() {
  const db = await getDb();
  if (!db) return {
    total: 0,
    trial: 0,
    active: 0,
    pastDue: 0,
    canceled: 0,
    suspended: 0,
    monthlyRevenue: 0,
  };
  
  const allClinics = await db.select().from(clinics);
  const allPlans = await db.select().from(plans);
  
  const planMap = new Map(allPlans.map(p => [p.id, p]));
  
  let monthlyRevenue = 0;
  const stats = {
    total: allClinics.length,
    trial: 0,
    active: 0,
    pastDue: 0,
    canceled: 0,
    suspended: 0,
    monthlyRevenue: 0,
  };
  
  for (const clinic of allClinics) {
    switch (clinic.subscriptionStatus) {
      case "trial": stats.trial++; break;
      case "active": 
        stats.active++;
        if (clinic.planId) {
          const plan = planMap.get(clinic.planId);
          if (plan) {
            monthlyRevenue += Number(plan.price);
          }
        }
        break;
      case "past_due": stats.pastDue++; break;
      case "canceled": stats.canceled++; break;
      case "suspended": stats.suspended++; break;
    }
  }
  
  stats.monthlyRevenue = monthlyRevenue;
  return stats;
}

export async function suspendClinic(clinicId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clinics).set({ 
    subscriptionStatus: "suspended",
    isActive: false 
  }).where(eq(clinics.id, clinicId));
}

export async function reactivateClinic(clinicId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clinics).set({ 
    subscriptionStatus: "active",
    isActive: true 
  }).where(eq(clinics.id, clinicId));
}

export async function getOverdueClinics() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clinics).where(eq(clinics.subscriptionStatus, "past_due"));
}

// Verificar se a clínica pode acessar o sistema (não está inadimplente/suspensa)
export async function checkClinicAccess(clinicId: number): Promise<{
  canAccess: boolean;
  reason?: string;
  clinic?: Clinic;
}> {
  const db = await getDb();
  if (!db) return { canAccess: false, reason: "Database not available" };
  
  const result = await db.select().from(clinics).where(eq(clinics.id, clinicId)).limit(1);
  const clinic = result[0];
  
  if (!clinic) {
    return { canAccess: false, reason: "Clínica não encontrada" };
  }
  
  // Verificar status da assinatura
  const blockedStatuses = ["past_due", "canceled", "suspended"];
  if (blockedStatuses.includes(clinic.subscriptionStatus)) {
    const statusMessages: Record<string, string> = {
      past_due: "Sua assinatura está inadimplente. Por favor, regularize o pagamento para continuar usando o sistema.",
      canceled: "Sua assinatura foi cancelada. Entre em contato com o suporte para reativá-la.",
      suspended: "Sua conta foi suspensa. Entre em contato com o suporte para mais informações.",
    };
    return { 
      canAccess: false, 
      reason: statusMessages[clinic.subscriptionStatus] || "Acesso bloqueado",
      clinic 
    };
  }
  
  // Verificar se a clínica está ativa
  if (!clinic.isActive) {
    return { canAccess: false, reason: "Clínica desativada", clinic };
  }
  
  // Verificar se o trial expirou
  if (clinic.subscriptionStatus === "trial" && clinic.trialEndsAt) {
    if (new Date(clinic.trialEndsAt) < new Date()) {
      return { 
        canAccess: false, 
        reason: "Seu período de teste expirou. Por favor, escolha um plano para continuar usando o sistema.",
        clinic 
      };
    }
  }
  
  return { canAccess: true, clinic };
}

// Obter informações de acesso do usuário (clínica e status)
export async function getUserAccessInfo(userId: number): Promise<{
  canAccess: boolean;
  reason?: string;
  clinic?: Clinic;
  userClinic?: UserClinic;
}> {
  const db = await getDb();
  if (!db) return { canAccess: false, reason: "Database not available" };
  
  // Buscar o usuário
  const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = userResult[0];
  
  if (!user) {
    return { canAccess: false, reason: "Usuário não encontrado" };
  }
  
  // Superadmin sempre tem acesso
  if (user.role === "superadmin") {
    return { canAccess: true };
  }
  
  // Se o usuário não tem clínica associada, não pode acessar
  if (!user.clinicId) {
    return { canAccess: false, reason: "Usuário não está associado a nenhuma clínica" };
  }
  
  // Verificar acesso da clínica
  const clinicAccess = await checkClinicAccess(user.clinicId);
  
  if (!clinicAccess.canAccess) {
    return clinicAccess;
  }
  
  // Buscar relação usuário-clínica
  const ucResult = await db.select().from(userClinics)
    .where(and(
      eq(userClinics.userId, userId),
      eq(userClinics.clinicId, user.clinicId)
    ))
    .limit(1);
  
  return { 
    canAccess: true, 
    clinic: clinicAccess.clinic,
    userClinic: ucResult[0]
  };
}


// ==================== Histórico de Conversas da IA ====================

export async function getIaConversations(clinicId: number, userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(iaConversations)
    .where(and(
      eq(iaConversations.clinicId, clinicId),
      eq(iaConversations.userId, userId)
    ))
    .orderBy(asc(iaConversations.createdAt))
    .limit(limit);
  
  return result;
}

export async function addIaConversation(data: InsertIaConversation) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(iaConversations).values(data);
  return result;
}

export async function clearIaConversations(clinicId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(iaConversations)
    .where(and(
      eq(iaConversations.clinicId, clinicId),
      eq(iaConversations.userId, userId)
    ));
}


// ==================== SMILE DESIGN ====================
export async function createSmileDesign(data: InsertSmileDesign) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(smileDesigns).values(data);
  return { id: Number(result[0].insertId) };
}

export async function getSmileDesigns(clinicId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(smileDesigns).where(eq(smileDesigns.clinicId, clinicId)).orderBy(desc(smileDesigns.createdAt));
}

export async function getSmileDesignsByPatient(clinicId: number, patientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(smileDesigns).where(and(
    eq(smileDesigns.clinicId, clinicId),
    eq(smileDesigns.patientId, patientId)
  )).orderBy(desc(smileDesigns.createdAt));
}

export async function getSmileDesignMetrics(clinicId: number, days: number) {
  const db = await getDb();
  if (!db) {
    return {
      totalSimulations: 0,
      totalConversions: 0,
      conversionRate: 0,
      totalRevenue: 0,
      avgRevenuePerConversion: 0,
      sharedViaWhatsApp: 0,
      whatsAppConversionRate: 0,
      byTreatmentType: [],
      weeklyTrend: [],
      recentConversions: [],
    };
  }
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Buscar todas as simulações do período
  const allDesigns = await db.select().from(smileDesigns).where(and(
    eq(smileDesigns.clinicId, clinicId),
    gte(smileDesigns.createdAt, startDate)
  ));
  
  const totalSimulations = allDesigns.length;
  const conversions = allDesigns.filter(d => d.converted);
  const totalConversions = conversions.length;
  const conversionRate = totalSimulations > 0 ? Math.round((totalConversions / totalSimulations) * 100) : 0;
  
  // Simulações compartilhadas via WhatsApp
  const sharedDesigns = allDesigns.filter(d => d.sharedViaWhatsApp);
  const sharedViaWhatsApp = sharedDesigns.length;
  const sharedConversions = sharedDesigns.filter(d => d.converted).length;
  const whatsAppConversionRate = sharedViaWhatsApp > 0 ? Math.round((sharedConversions / sharedViaWhatsApp) * 100) : 0;
  
  // Agrupar por tipo de tratamento
  const treatmentTypesSet = new Set(allDesigns.map(d => d.treatmentType));
  const treatmentTypes: string[] = [];
  treatmentTypesSet.forEach(t => treatmentTypes.push(t));
  const byTreatmentType = treatmentTypes.map(type => {
    const typeDesigns = allDesigns.filter(d => d.treatmentType === type);
    const typeConversions = typeDesigns.filter(d => d.converted).length;
    return {
      name: type.charAt(0).toUpperCase() + type.slice(1),
      simulations: typeDesigns.length,
      conversions: typeConversions,
      rate: typeDesigns.length > 0 ? Math.round((typeConversions / typeDesigns.length) * 100) : 0,
    };
  }).sort((a, b) => b.simulations - a.simulations);
  
  // Tendência semanal (mockado por enquanto)
  const weeklyTrend = [
    { week: "Sem 1", simulations: Math.floor(totalSimulations * 0.2), conversions: Math.floor(totalConversions * 0.2) },
    { week: "Sem 2", simulations: Math.floor(totalSimulations * 0.25), conversions: Math.floor(totalConversions * 0.25) },
    { week: "Sem 3", simulations: Math.floor(totalSimulations * 0.25), conversions: Math.floor(totalConversions * 0.25) },
    { week: "Sem 4", simulations: Math.floor(totalSimulations * 0.3), conversions: Math.floor(totalConversions * 0.3) },
  ];
  
  // Receita estimada (R$ 3000 médio por conversão)
  const avgRevenuePerConversion = 3000;
  const totalRevenue = totalConversions * avgRevenuePerConversion;
  
  // Conversões recentes
  const recentConversions = conversions.slice(0, 5).map(c => ({
    patient: "Paciente",
    treatment: c.treatmentType,
    value: avgRevenuePerConversion,
    date: c.convertedAt?.toISOString().split('T')[0] || c.createdAt.toISOString().split('T')[0],
  }));
  
  return {
    totalSimulations,
    totalConversions,
    conversionRate,
    totalRevenue,
    avgRevenuePerConversion,
    sharedViaWhatsApp,
    whatsAppConversionRate,
    byTreatmentType,
    weeklyTrend,
    recentConversions,
  };
}

export async function markSmileDesignShared(clinicId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(smileDesigns)
    .set({ sharedViaWhatsApp: true, sharedAt: new Date() })
    .where(and(eq(smileDesigns.id, id), eq(smileDesigns.clinicId, clinicId)));
}

export async function markSmileDesignConverted(clinicId: number, id: number, budgetId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(smileDesigns)
    .set({ converted: true, convertedAt: new Date(), budgetId: budgetId || null })
    .where(and(eq(smileDesigns.id, id), eq(smileDesigns.clinicId, clinicId)));
}

// ==================== ALERTAS DE RETORNO ====================
export async function createReturnAlert(data: InsertReturnAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(returnAlerts).values(data);
  return { id: Number(result[0].insertId) };
}

export async function getPendingPayments(clinicId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(serviceQueue).where(and(
    eq(serviceQueue.clinicId, clinicId),
    eq(serviceQueue.status, "pending_payment"),
    ne(serviceQueue.paymentStatus, "paid")
  )).orderBy(serviceQueue.arrivalTime);
}

export async function getReturnAlerts(clinicId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(returnAlerts).where(eq(returnAlerts.clinicId, clinicId)).orderBy(desc(returnAlerts.createdAt));
}

export async function getPendingReturnAlerts(clinicId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(returnAlerts).where(and(
    eq(returnAlerts.clinicId, clinicId),
    eq(returnAlerts.status, "pending")
  )).orderBy(returnAlerts.returnDueDate);
}

export async function updateReturnAlertStatus(id: number, status: "pending" | "contacted" | "scheduled" | "completed" | "cancelled", notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(returnAlerts).set({ 
    status, 
    lastContactNotes: notes || undefined 
  }).where(eq(returnAlerts.id, id));
}

export async function registerReturnAlertContact(id: number, notes: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const alert = await db.select().from(returnAlerts).where(eq(returnAlerts.id, id)).limit(1);
  if (alert.length === 0) return;
  
  await db.update(returnAlerts).set({
    contactAttempts: (alert[0].contactAttempts || 0) + 1,
    lastContactDate: new Date(),
    lastContactNotes: notes,
    status: "contacted"
  }).where(eq(returnAlerts.id, id));
}

// ==================== CONFIGURAÇÕES DE RETORNO ====================
export async function getReturnPeriodSettings(clinicId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(returnPeriodSettings).where(eq(returnPeriodSettings.clinicId, clinicId));
}

export async function saveReturnPeriodSetting(data: InsertReturnPeriodSetting) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se já existe
  const existing = await db.select().from(returnPeriodSettings).where(and(
    eq(returnPeriodSettings.clinicId, data.clinicId),
    eq(returnPeriodSettings.treatmentType, data.treatmentType)
  )).limit(1);
  
  if (existing.length > 0) {
    await db.update(returnPeriodSettings).set({
      returnPeriodDays: data.returnPeriodDays,
      reminderDaysBefore: data.reminderDaysBefore
    }).where(eq(returnPeriodSettings.id, existing[0].id));
  } else {
    await db.insert(returnPeriodSettings).values(data);
  }
}

// ==================== TEMPLATES DE LEMBRETE ====================
export async function getReminderTemplates(clinicId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reminderTemplates).where(and(
    eq(reminderTemplates.clinicId, clinicId),
    eq(reminderTemplates.isActive, true)
  )).orderBy(desc(reminderTemplates.isDefault));
}

export async function createReminderTemplate(data: InsertReminderTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(reminderTemplates).values(data);
  return { id: Number(result[0].insertId) };
}

export async function updateReminderTemplate(id: number, data: Partial<InsertReminderTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reminderTemplates).set(data).where(eq(reminderTemplates.id, id));
}

export async function deleteReminderTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reminderTemplates).set({ isActive: false }).where(eq(reminderTemplates.id, id));
}

// ==================== HISTÓRICO DE LEMBRETES WHATSAPP ====================
export async function createWhatsappReminderHistory(data: InsertWhatsappReminderHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(whatsappReminderHistory).values(data);
  return { id: Number(result[0].insertId) };
}

export async function getWhatsappReminderHistory(clinicId: number, returnAlertId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(whatsappReminderHistory.clinicId, clinicId)];
  if (returnAlertId) conditions.push(eq(whatsappReminderHistory.returnAlertId, returnAlertId));
  return db.select().from(whatsappReminderHistory).where(and(...conditions)).orderBy(desc(whatsappReminderHistory.sentAt));
}

export async function getWhatsappReminderStats(clinicId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return { total: 0, sent: 0, delivered: 0, read: 0, failed: 0 };
  
  const conditions = [eq(whatsappReminderHistory.clinicId, clinicId)];
  if (startDate) conditions.push(gte(whatsappReminderHistory.sentAt, startDate));
  if (endDate) conditions.push(lte(whatsappReminderHistory.sentAt, endDate));
  
  const result = await db.select({
    total: sql<number>`count(*)`,
    sent: sql<number>`sum(case when status = 'sent' then 1 else 0 end)`,
    delivered: sql<number>`sum(case when status = 'delivered' then 1 else 0 end)`,
    read: sql<number>`sum(case when status = 'read' then 1 else 0 end)`,
    failed: sql<number>`sum(case when status = 'failed' then 1 else 0 end)`,
  }).from(whatsappReminderHistory).where(and(...conditions));
  
  return result[0] || { total: 0, sent: 0, delivered: 0, read: 0, failed: 0 };
}


// ==================== MODELOS 3D DO PACIENTE ====================
export async function getPatientModels3D(patientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(patientModels3D)
    .where(eq(patientModels3D.patientId, patientId))
    .orderBy(desc(patientModels3D.createdAt));
}

export async function getPatientModel3DById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(patientModels3D).where(eq(patientModels3D.id, id)).limit(1);
  return result[0];
}

export async function createPatientModel3D(data: InsertPatientModel3D) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(patientModels3D).values(data);
  return { id: result[0].insertId };
}

export async function updatePatientModel3D(id: number, data: Partial<InsertPatientModel3D>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(patientModels3D).set(data).where(eq(patientModels3D.id, id));
  return { success: true };
}

export async function deletePatientModel3D(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(patientModels3D).where(eq(patientModels3D.id, id));
  return { success: true };
}

// ==================== BIBLIOTECA DE MODELOS 3D ====================
export async function getModels3DLibrary(clinicId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(models3DLibrary)
    .where(eq(models3DLibrary.clinicId, clinicId))
    .orderBy(desc(models3DLibrary.createdAt));
}

export async function getModel3DLibraryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(models3DLibrary).where(eq(models3DLibrary.id, id)).limit(1);
  return result[0];
}

export async function createModel3DLibrary(data: InsertModel3DLibrary) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(models3DLibrary).values(data);
  return { id: result[0].insertId };
}

export async function deleteModel3DLibrary(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(models3DLibrary).where(eq(models3DLibrary.id, id));
  return { success: true };
}


// ==================== PROCEDIMENTOS DO TRATAMENTO ====================
// Procedimentos vinculados a um orçamento/fila que podem ser marcados como concluídos

export async function createTreatmentProcedures(data: InsertTreatmentProcedure[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.length === 0) return { count: 0 };
  const result = await db.insert(treatmentProcedures).values(data);
  return { count: data.length, firstId: result[0].insertId };
}

export async function getTreatmentProceduresByQueueEntry(queueEntryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(treatmentProcedures)
    .where(eq(treatmentProcedures.queueEntryId, queueEntryId))
    .orderBy(treatmentProcedures.id);
}

export async function getTreatmentProceduresByPatient(patientId: number, clinicId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(treatmentProcedures)
    .where(and(
      eq(treatmentProcedures.patientId, patientId),
      eq(treatmentProcedures.clinicId, clinicId)
    ))
    .orderBy(desc(treatmentProcedures.createdAt));
}

export async function getTreatmentProceduresByBudget(budgetId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(treatmentProcedures)
    .where(eq(treatmentProcedures.budgetId, budgetId))
    .orderBy(treatmentProcedures.id);
}

export async function updateTreatmentProcedureStatus(
  id: number, 
  status: "pending" | "in_progress" | "completed", 
  completedBy?: number,
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: Partial<InsertTreatmentProcedure> = { status };
  
  if (status === "completed") {
    updateData.completedBy = completedBy;
    updateData.completedAt = new Date();
  }
  
  if (notes !== undefined) {
    updateData.notes = notes;
  }
  
  await db.update(treatmentProcedures).set(updateData).where(eq(treatmentProcedures.id, id));
  return { success: true };
}

export async function markMultipleProceduresCompleted(ids: number[], completedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(treatmentProcedures)
    .set({ 
      status: "completed", 
      completedBy, 
      completedAt: new Date() 
    })
    .where(inArray(treatmentProcedures.id, ids));
  
  return { success: true, count: ids.length };
}

export async function getPendingTreatmentProcedures(patientId: number, clinicId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(treatmentProcedures)
    .where(and(
      eq(treatmentProcedures.patientId, patientId),
      eq(treatmentProcedures.clinicId, clinicId),
      eq(treatmentProcedures.status, "pending")
    ))
    .orderBy(treatmentProcedures.id);
}

// Buscar procedimentos para encaminhamento (sem valores - para especialistas)
// Busca por queueEntryId ou por patientId se queueEntryId não encontrar resultados
export async function getTreatmentProceduresForSpecialist(queueEntryId: number, patientId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Primeiro tenta buscar pelo queueEntryId atual
  let result = await db.select({
    id: treatmentProcedures.id,
    procedureId: treatmentProcedures.procedureId,
    procedureName: treatmentProcedures.procedureName,
    toothNumber: treatmentProcedures.toothNumber,
    faces: treatmentProcedures.faces,
    condition: treatmentProcedures.condition,
    status: treatmentProcedures.status,
    completedBy: treatmentProcedures.completedBy,
    completedAt: treatmentProcedures.completedAt,
    notes: treatmentProcedures.notes,
    patientId: treatmentProcedures.patientId,
    // Não inclui o preço!
  }).from(treatmentProcedures)
    .where(eq(treatmentProcedures.queueEntryId, queueEntryId))
    .orderBy(treatmentProcedures.id);
  
  // Se não encontrou e tem patientId, busca procedimentos pendentes do paciente
  if (result.length === 0 && patientId) {
    result = await db.select({
      id: treatmentProcedures.id,
      procedureId: treatmentProcedures.procedureId,
      procedureName: treatmentProcedures.procedureName,
      toothNumber: treatmentProcedures.toothNumber,
      faces: treatmentProcedures.faces,
      condition: treatmentProcedures.condition,
      status: treatmentProcedures.status,
      completedBy: treatmentProcedures.completedBy,
      completedAt: treatmentProcedures.completedAt,
      notes: treatmentProcedures.notes,
      patientId: treatmentProcedures.patientId,
    }).from(treatmentProcedures)
      .where(and(
        eq(treatmentProcedures.patientId, patientId),
        ne(treatmentProcedures.status, "completed")
      ))
      .orderBy(treatmentProcedures.id);
  }
  
  return result;
}

// Atualizar queueEntryId dos procedimentos quando paciente é encaminhado
export async function linkProceduresToQueueEntry(procedureIds: number[], newQueueEntryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(treatmentProcedures)
    .set({ queueEntryId: newQueueEntryId })
    .where(inArray(treatmentProcedures.id, procedureIds));
  
  return { success: true };
}


// ==================== MEDICAL DOCUMENTS (Prontuário) ====================

// Criar documento médico
export async function createMedicalDocument(data: InsertMedicalDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(medicalDocuments).values(data);
  return { id: Number(result[0].insertId), ...data };
}

// Buscar documentos de um paciente
export async function getMedicalDocumentsByPatient(patientId: number, clinicId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select()
    .from(medicalDocuments)
    .where(and(
      eq(medicalDocuments.patientId, patientId),
      eq(medicalDocuments.clinicId, clinicId)
    ))
    .orderBy(desc(medicalDocuments.createdAt));
}

// Buscar documento por ID
export async function getMedicalDocumentById(id: number, clinicId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select()
    .from(medicalDocuments)
    .where(and(
      eq(medicalDocuments.id, id),
      eq(medicalDocuments.clinicId, clinicId)
    ))
    .limit(1);
  
  return result[0] || null;
}

// Atualizar documento médico
export async function updateMedicalDocument(id: number, clinicId: number, data: Partial<InsertMedicalDocument>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(medicalDocuments)
    .set(data)
    .where(and(
      eq(medicalDocuments.id, id),
      eq(medicalDocuments.clinicId, clinicId)
    ));
  
  return { success: true };
}

// Deletar documento médico
export async function deleteMedicalDocument(id: number, clinicId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(medicalDocuments)
    .where(and(
      eq(medicalDocuments.id, id),
      eq(medicalDocuments.clinicId, clinicId)
    ));
  
  return { success: true };
}

// Buscar documento por token de validação (rota pública)
export async function getMedicalDocumentByToken(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select()
    .from(medicalDocuments)
    .where(eq(medicalDocuments.validationToken, token))
    .limit(1);
  
  return result[0] || null;
}

// Buscar todos os documentos de uma clínica (para relatórios)
export async function getMedicalDocumentsByClinic(clinicId: number, type?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [eq(medicalDocuments.clinicId, clinicId)];
  
  if (type) {
    conditions.push(eq(medicalDocuments.type, type as any));
  }
  
  return db.select()
    .from(medicalDocuments)
    .where(and(...conditions))
    .orderBy(desc(medicalDocuments.createdAt));
}
