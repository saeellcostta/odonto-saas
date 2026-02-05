import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, date, time } from "drizzle-orm/mysql-core";

// Tabela de planos de assinatura
export const plans = mysqlTable("plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  billingCycle: mysqlEnum("billingCycle", ["monthly", "yearly"]).default("monthly").notNull(),
  // Limites do plano
  maxUsers: int("maxUsers").default(5),
  maxPatients: int("maxPatients").default(100),
  maxAppointmentsPerMonth: int("maxAppointmentsPerMonth").default(200),
  // Recursos inclusos
  hasAIAnalysis: boolean("hasAIAnalysis").default(false),
  hasWhatsAppNotifications: boolean("hasWhatsAppNotifications").default(false),
  hasTVPanel: boolean("hasTVPanel").default(true),
  hasAdvancedReports: boolean("hasAdvancedReports").default(false),
  hasMultipleLocations: boolean("hasMultipleLocations").default(false),
  hasAPIAccess: boolean("hasAPIAccess").default(false),
  hasPrioritySupport: boolean("hasPrioritySupport").default(false),
  isActive: boolean("isActive").default(true),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = typeof plans.$inferInsert;

// Tabela de clínicas (multi-tenancy)
export const clinics = mysqlTable("clinics", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  cnpj: varchar("cnpj", { length: 18 }),
  cro: varchar("cro", { length: 50 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  logoUrl: text("logoUrl"),
  // Campos de assinatura
  planId: int("planId"),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["trial", "active", "past_due", "canceled", "suspended"]).default("trial").notNull(),
  trialEndsAt: timestamp("trialEndsAt"),
  subscriptionStartedAt: timestamp("subscriptionStartedAt"),
  subscriptionEndsAt: timestamp("subscriptionEndsAt"),
  lastPaymentAt: timestamp("lastPaymentAt"),
  nextPaymentAt: timestamp("nextPaymentAt"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 100 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 100 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Clinic = typeof clinics.$inferSelect;
export type InsertClinic = typeof clinics.$inferInsert;

// Tabela de usuários com autenticação própria
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(), // Opcional para compatibilidade
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }), // Hash bcrypt da senha
  name: text("name"),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }).default("email"), // email, google, manus
  role: mysqlEnum("role", ["user", "admin", "superadmin"]).default("user").notNull(),
  clinicId: int("clinicId"), // Clínica principal do usuário
  isActive: boolean("isActive").default(true),
  emailVerified: boolean("emailVerified").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Relação usuário-clínica (um usuário pode ter acesso a múltiplas clínicas)
export const userClinics = mysqlTable("user_clinics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clinicId: int("clinicId").notNull(),
  role: mysqlEnum("role", ["owner", "admin", "atendente", "dentista", "protesista", "ortodontista", "implantodontista", "bucomaxilo", "odontopediatria"]).default("atendente").notNull(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserClinic = typeof userClinics.$inferSelect;
export type InsertUserClinic = typeof userClinics.$inferInsert;

// Permissões por cargo
export const rolePermissions = mysqlTable("role_permissions", {
  id: int("id").autoincrement().primaryKey(),
  role: mysqlEnum("role", ["owner", "admin", "atendente", "dentista", "protesista", "ortodontista", "implantodontista", "bucomaxilo", "odontopediatria"]).notNull(),
  // Áreas principais
  canViewPainel: boolean("canViewPainel").default(true),
  canViewAtendente: boolean("canViewAtendente").default(false),
  canViewPacientes: boolean("canViewPacientes").default(false),
  canViewProntuarios: boolean("canViewProntuarios").default(false),
  canViewAgenda: boolean("canViewAgenda").default(false),
  canViewOrcamentista: boolean("canViewOrcamentista").default(false),
  // Áreas especializadas
  canViewAreaDentista: boolean("canViewAreaDentista").default(false),
  canViewAreaOrtodontista: boolean("canViewAreaOrtodontista").default(false),
  canViewAreaImplantodontista: boolean("canViewAreaImplantodontista").default(false),
  canViewAreaProtesista: boolean("canViewAreaProtesista").default(false),
  canViewAreaBucomaxilo: boolean("canViewAreaBucomaxilo").default(false),
  canViewAreaOdontopediatria: boolean("canViewAreaOdontopediatria").default(false),
  // Gestão
  canViewProcedimentos: boolean("canViewProcedimentos").default(false),
  canViewDentistas: boolean("canViewDentistas").default(false),
  canViewProteses: boolean("canViewProteses").default(false),
  canViewFinanceiro: boolean("canViewFinanceiro").default(false),
  canViewConvenios: boolean("canViewConvenios").default(false),
  canViewEstoque: boolean("canViewEstoque").default(false),
  // Análises
  canViewRelatorios: boolean("canViewRelatorios").default(false),
  canViewAnaliseIA: boolean("canViewAnaliseIA").default(false),
  canViewQRCheckin: boolean("canViewQRCheckin").default(false),
  canViewPainelTV: boolean("canViewPainelTV").default(false),
  // Sistema
  canViewNotificacoes: boolean("canViewNotificacoes").default(false),
  canViewGestaoUsuarios: boolean("canViewGestaoUsuarios").default(false),
  canViewConfiguracoes: boolean("canViewConfiguracoes").default(false),
  canViewAdmin: boolean("canViewAdmin").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = typeof rolePermissions.$inferInsert;

// Configurações da clínica
export const clinicSettings = mysqlTable("clinic_settings", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId").notNull(), // Multi-tenancy: ID da clínica
  name: varchar("name", { length: 255 }).notNull().default("Minha Clínica"),
  cnpj: varchar("cnpj", { length: 18 }),
  cro: varchar("cro", { length: 50 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  openTime: time("openTime").default("08:00:00"),
  closeTime: time("closeTime").default("18:00:00"),
  appointmentDuration: int("appointmentDuration").default(30),
  logoUrl: text("logoUrl"),
  logoData: text("logoData"), // Logo como base64 data URL
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClinicSettings = typeof clinicSettings.$inferSelect;
export type InsertClinicSettings = typeof clinicSettings.$inferInsert;

// Pacientes
export const patients = mysqlTable("patients", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId"), // Multi-tenancy: ID da clínica
  name: varchar("name", { length: 255 }).notNull(),
  cpf: varchar("cpf", { length: 14 }),
  rg: varchar("rg", { length: 20 }),
  birthDate: date("birthDate"),
  gender: mysqlEnum("gender", ["male", "female", "other"]),
  phone: varchar("phone", { length: 20 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  profession: varchar("profession", { length: 100 }),
  emergencyContact: varchar("emergencyContact", { length: 255 }),
  emergencyPhone: varchar("emergencyPhone", { length: 20 }),
  notes: text("notes"),
  insuranceId: int("insuranceId"),
  photoUrl: text("photoUrl"),
  isActive: boolean("isActive").default(true),
  isActiveToday: boolean("isActiveToday").default(false),
  activatedAt: timestamp("activatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = typeof patients.$inferInsert;

// Anamnese do paciente
export const anamnesis = mysqlTable("anamnesis", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  heartDisease: boolean("heartDisease").default(false),
  hypertension: boolean("hypertension").default(false),
  diabetes: boolean("diabetes").default(false),
  pregnancy: boolean("pregnancy").default(false),
  allergies: boolean("allergies").default(false),
  allergiesDescription: text("allergiesDescription"),
  medications: boolean("medications").default(false),
  medicationsDescription: text("medicationsDescription"),
  surgeries: boolean("surgeries").default(false),
  surgeriesDescription: text("surgeriesDescription"),
  smoker: boolean("smoker").default(false),
  alcohol: boolean("alcohol").default(false),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Anamnesis = typeof anamnesis.$inferSelect;
export type InsertAnamnesis = typeof anamnesis.$inferInsert;

// Dentistas
export const dentists = mysqlTable("dentists", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId"), // Multi-tenancy: ID da clínica
  name: varchar("name", { length: 255 }).notNull(),
  cro: varchar("cro", { length: 50 }).notNull(),
  specialty: varchar("specialty", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  commission: decimal("commission", { precision: 5, scale: 2 }).default("0"),
  isActive: boolean("isActive").default(true),
  isActiveToday: boolean("isActiveToday").default(false),
  checkedInAt: timestamp("checkedInAt"),
  color: varchar("color", { length: 7 }).default("#3B82F6"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Dentist = typeof dentists.$inferSelect;
export type InsertDentist = typeof dentists.$inferInsert;

// Categorias de procedimentos
export const procedureCategories = mysqlTable("procedure_categories", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId"), // Multi-tenancy: ID da clínica
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 7 }).default("#3B82F6"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProcedureCategory = typeof procedureCategories.$inferSelect;
export type InsertProcedureCategory = typeof procedureCategories.$inferInsert;

// Procedimentos
export const procedures = mysqlTable("procedures", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId"), // Multi-tenancy: ID da clínica
  code: varchar("code", { length: 20 }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  categoryId: int("categoryId"),
  pricePerTooth: decimal("pricePerTooth", { precision: 10, scale: 2 }).notNull(),
  priceUpperArch: decimal("priceUpperArch", { precision: 10, scale: 2 }),
  priceLowerArch: decimal("priceLowerArch", { precision: 10, scale: 2 }),
  duration: int("duration").default(30),
  isActive: boolean("isActive").default(true),
  faces: varchar("faces", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Procedure = typeof procedures.$inferSelect;
export type InsertProcedure = typeof procedures.$inferInsert;

// Convênios
export const insurances = mysqlTable("insurances", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId"), // Multi-tenancy: ID da clínica
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  discount: decimal("discount", { precision: 5, scale: 2 }).default("0"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Insurance = typeof insurances.$inferSelect;
export type InsertInsurance = typeof insurances.$inferInsert;

// Agendamentos
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId"), // Multi-tenancy: ID da clínica
  patientId: int("patientId").notNull(),
  dentistId: int("dentistId"),
  date: date("date").notNull(),
  startTime: time("startTime").notNull(),
  endTime: time("endTime").notNull(),
  type: varchar("type", { length: 100 }),
  status: mysqlEnum("status", ["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"]).default("scheduled"),
  notes: text("notes"),
  chairId: int("chairId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

// Cadeiras/Consultórios
export const chairs = mysqlTable("chairs", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId"), // Multi-tenancy: ID da clínica
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Chair = typeof chairs.$inferSelect;
export type InsertChair = typeof chairs.$inferInsert;

// Orçamentos
export const budgets = mysqlTable("budgets", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId"), // Multi-tenancy: ID da clínica
  patientId: int("patientId").notNull(),
  dentistId: int("dentistId"),
  totalValue: decimal("totalValue", { precision: 10, scale: 2 }).notNull(),
  discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }).default("0"),
  discountValue: decimal("discountValue", { precision: 10, scale: 2 }).default("0"),
  finalValue: decimal("finalValue", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "in_progress", "completed"]).default("pending"),
  notes: text("notes"),
  validUntil: date("validUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;

// Itens do orçamento
export const budgetItems = mysqlTable("budget_items", {
  id: int("id").autoincrement().primaryKey(),
  budgetId: int("budgetId").notNull(),
  procedureId: int("procedureId").notNull(),
  toothNumber: varchar("toothNumber", { length: 10 }),
  faces: varchar("faces", { length: 20 }),
  quantity: int("quantity").default(1),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "in_progress", "completed"]).default("pending"),
  // Campos para orçamento parcial/faseado
  phase: mysqlEnum("phase", ["urgent", "important", "aesthetic", "preventive"]).default("important"),
  priority: int("priority").default(2), // 1=alta, 2=média, 3=baixa
  approvedAt: timestamp("approvedAt"),
  rejectedAt: timestamp("rejectedAt"),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BudgetItem = typeof budgetItems.$inferSelect;
export type InsertBudgetItem = typeof budgetItems.$inferInsert;

// Tratamentos (odontograma)
export const treatments = mysqlTable("treatments", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  toothNumber: varchar("toothNumber", { length: 10 }).notNull(),
  face: varchar("face", { length: 5 }),
  condition: mysqlEnum("condition", ["healthy", "cavity", "restoration", "extraction", "implant", "crown", "bridge", "canal", "fracture", "absent"]).default("healthy"),
  procedureId: int("procedureId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Treatment = typeof treatments.$inferSelect;
export type InsertTreatment = typeof treatments.$inferInsert;

// Transações financeiras
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId"), // Multi-tenancy: ID da clínica
  patientId: int("patientId"),
  budgetId: int("budgetId"),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  category: varchar("category", { length: 100 }),
  description: text("description"),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "credit_card", "debit_card", "pix", "bank_transfer", "check", "insurance"]),
  date: date("date").notNull(),
  status: mysqlEnum("status", ["pending", "paid", "cancelled"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// Estoque - Categorias
export const stockCategories = mysqlTable("stock_categories", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId"), // Multi-tenancy: ID da clínica
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StockCategory = typeof stockCategories.$inferSelect;
export type InsertStockCategory = typeof stockCategories.$inferInsert;

// Estoque - Produtos
export const stockItems = mysqlTable("stock_items", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId"), // Multi-tenancy: ID da clínica
  name: varchar("name", { length: 255 }).notNull(),
  categoryId: int("categoryId"),
  quantity: int("quantity").default(0),
  minQuantity: int("minQuantity").default(10),
  unit: varchar("unit", { length: 20 }).default("un"),
  costPrice: decimal("costPrice", { precision: 10, scale: 2 }),
  supplier: varchar("supplier", { length: 255 }),
  expirationDate: date("expirationDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StockItem = typeof stockItems.$inferSelect;
export type InsertStockItem = typeof stockItems.$inferInsert;

// Movimentações de estoque
export const stockMovements = mysqlTable("stock_movements", {
  id: int("id").autoincrement().primaryKey(),
  stockItemId: int("stockItemId").notNull(),
  type: mysqlEnum("type", ["in", "out"]).notNull(),
  quantity: int("quantity").notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = typeof stockMovements.$inferInsert;

// Fila de atendimento
export const waitingQueue = mysqlTable("waiting_queue", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId"), // Multi-tenancy: ID da clínica
  patientId: int("patientId").notNull(),
  queueType: mysqlEnum("queueType", ["budget", "dentist", "orthodontics", "implant", "prosthetics", "maxillofacial", "pediatric"]).default("dentist"),
  priority: mysqlEnum("priority", ["normal", "high", "urgent"]).default("normal"),
  status: mysqlEnum("status", ["waiting", "in_service", "completed", "cancelled"]).default("waiting"),
  arrivalTime: timestamp("arrivalTime").defaultNow().notNull(),
  startTime: timestamp("startTime"),
  endTime: timestamp("endTime"),
  dentistId: int("dentistId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WaitingQueue = typeof waitingQueue.$inferSelect;
export type InsertWaitingQueue = typeof waitingQueue.$inferInsert;

// Documentos do paciente
export const patientDocuments = mysqlTable("patient_documents", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  type: mysqlEnum("type", ["image", "document", "xray", "receipt"]).default("document"),
  name: varchar("name", { length: 255 }).notNull(),
  url: text("url").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PatientDocument = typeof patientDocuments.$inferSelect;
export type InsertPatientDocument = typeof patientDocuments.$inferInsert;

// Laboratórios de prótese
export const laboratories = mysqlTable("laboratories", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId"), // Multi-tenancy: ID da clínica
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  contactPerson: varchar("contactPerson", { length: 255 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Laboratory = typeof laboratories.$inferSelect;
export type InsertLaboratory = typeof laboratories.$inferInsert;

// Tipos de prótese
export const prosthesisTypes = mysqlTable("prosthesis_types", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId"), // Multi-tenancy: ID da clínica
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  defaultPrice: decimal("defaultPrice", { precision: 10, scale: 2 }),
  estimatedDays: int("estimatedDays").default(7),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProsthesisType = typeof prosthesisTypes.$inferSelect;
export type InsertProsthesisType = typeof prosthesisTypes.$inferInsert;

// Pedidos de prótese
export const prosthesisOrders = mysqlTable("prosthesis_orders", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId"), // Multi-tenancy: ID da clínica
  patientId: int("patientId").notNull(),
  dentistId: int("dentistId"),
  laboratoryId: int("laboratoryId"),
  prosthesisTypeId: int("prosthesisTypeId"),
  toothNumber: varchar("toothNumber", { length: 50 }),
  color: varchar("color", { length: 50 }),
  material: varchar("material", { length: 100 }),
  price: decimal("price", { precision: 10, scale: 2 }),
  labCost: decimal("labCost", { precision: 10, scale: 2 }),
  status: mysqlEnum("status", ["pending", "sent_to_lab", "in_production", "ready", "delivered", "installed"]).default("pending"),
  orderDate: date("orderDate"),
  expectedDate: date("expectedDate"),
  deliveryDate: date("deliveryDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProsthesisOrder = typeof prosthesisOrders.$inferSelect;
export type InsertProsthesisOrder = typeof prosthesisOrders.$inferInsert;

// Análise de IA - Radiografias
export const aiAnalysis = mysqlTable("ai_analysis", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId"), // Multi-tenancy: ID da clínica
  patientId: int("patientId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageType: mysqlEnum("imageType", ["panoramic", "periapical", "bitewing", "cephalometric", "intraoral"]).default("panoramic"),
  analysisResult: text("analysisResult"),
  findings: text("findings"),
  recommendations: text("recommendations"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  analyzedAt: timestamp("analyzedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiAnalysis = typeof aiAnalysis.$inferSelect;
export type InsertAiAnalysis = typeof aiAnalysis.$inferInsert;

// Check-in por QR Code
export const checkins = mysqlTable("checkins", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId"), // Multi-tenancy: ID da clínica
  patientId: int("patientId"),
  patientName: varchar("patientName", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  reason: text("reason"),
  queueType: mysqlEnum("queueType", ["budget", "dentist", "orthodontics", "implant", "prosthetics", "maxillofacial", "pediatric"]).default("budget"),
  status: mysqlEnum("status", ["waiting", "called", "in_service", "completed"]).default("waiting"),
  checkinTime: timestamp("checkinTime").defaultNow().notNull(),
  calledTime: timestamp("calledTime"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Checkin = typeof checkins.$inferSelect;
export type InsertCheckin = typeof checkins.$inferInsert;


// Notificações WhatsApp
export const whatsappNotifications = mysqlTable("whatsapp_notifications", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId"), // Multi-tenancy: ID da clínica
  patientId: int("patientId"),
  appointmentId: int("appointmentId"),
  phone: varchar("phone", { length: 20 }).notNull(),
  type: mysqlEnum("type", ["appointment_reminder", "queue_call", "confirmation", "followup", "custom"]).default("custom"),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "delivered", "read", "failed"]).default("pending"),
  scheduledFor: timestamp("scheduledFor"),
  sentAt: timestamp("sentAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WhatsappNotification = typeof whatsappNotifications.$inferSelect;
export type InsertWhatsappNotification = typeof whatsappNotifications.$inferInsert;

// Configurações de notificações
export const notificationSettings = mysqlTable("notification_settings", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId"), // Multi-tenancy: ID da clínica
  appointmentReminderEnabled: boolean("appointmentReminderEnabled").default(true),
  reminderHoursBefore: int("reminderHoursBefore").default(24),
  queueCallEnabled: boolean("queueCallEnabled").default(true),
  confirmationEnabled: boolean("confirmationEnabled").default(true),
  followupEnabled: boolean("followupEnabled").default(false),
  followupDaysAfter: int("followupDaysAfter").default(7),
  whatsappApiKey: text("whatsappApiKey"),
  whatsappPhoneId: varchar("whatsappPhoneId", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationSettings = typeof notificationSettings.$inferInsert;

// Tratamentos ortodônticos
export const orthodonticTreatments = mysqlTable("orthodontic_treatments", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId"), // Multi-tenancy: ID da clínica
  patientId: int("patientId").notNull(),
  dentistId: int("dentistId"),
  type: mysqlEnum("type", ["fixed_braces", "invisible_aligner", "retainer", "expander", "other"]).default("fixed_braces"),
  startDate: date("startDate"),
  estimatedEndDate: date("estimatedEndDate"),
  actualEndDate: date("actualEndDate"),
  status: mysqlEnum("status", ["planning", "active", "maintenance", "completed", "cancelled"]).default("planning"),
  upperArch: varchar("upperArch", { length: 100 }),
  lowerArch: varchar("lowerArch", { length: 100 }),
  bracketType: varchar("bracketType", { length: 100 }),
  notes: text("notes"),
  totalValue: decimal("totalValue", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrthodonticTreatment = typeof orthodonticTreatments.$inferSelect;
export type InsertOrthodonticTreatment = typeof orthodonticTreatments.$inferInsert;

// Manutenções ortodônticas
export const orthodonticMaintenances = mysqlTable("orthodontic_maintenances", {
  id: int("id").autoincrement().primaryKey(),
  treatmentId: int("treatmentId").notNull(),
  appointmentId: int("appointmentId"),
  date: date("date").notNull(),
  procedure: text("procedure"),
  wireChange: boolean("wireChange").default(false),
  wireType: varchar("wireType", { length: 100 }),
  elasticChange: boolean("elasticChange").default(false),
  elasticType: varchar("elasticType", { length: 100 }),
  notes: text("notes"),
  nextAppointmentDate: date("nextAppointmentDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrthodonticMaintenance = typeof orthodonticMaintenances.$inferSelect;
export type InsertOrthodonticMaintenance = typeof orthodonticMaintenances.$inferInsert;

// Planejamento de implantes
export const implantPlans = mysqlTable("implant_plans", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId"), // Multi-tenancy: ID da clínica
  patientId: int("patientId").notNull(),
  dentistId: int("dentistId"),
  toothNumber: varchar("toothNumber", { length: 50 }).notNull(),
  implantBrand: varchar("implantBrand", { length: 100 }),
  implantModel: varchar("implantModel", { length: 100 }),
  implantDiameter: decimal("implantDiameter", { precision: 4, scale: 2 }),
  implantLength: decimal("implantLength", { precision: 4, scale: 2 }),
  boneGraft: boolean("boneGraft").default(false),
  boneGraftType: varchar("boneGraftType", { length: 100 }),
  sinusLift: boolean("sinusLift").default(false),
  status: mysqlEnum("status", ["planning", "surgery_scheduled", "implant_placed", "healing", "prosthesis_phase", "completed"]).default("planning"),
  surgeryDate: date("surgeryDate"),
  healingTime: int("healingTime").default(90),
  prosthesisDate: date("prosthesisDate"),
  totalValue: decimal("totalValue", { precision: 10, scale: 2 }),
  notes: text("notes"),
  ctScanUrl: text("ctScanUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ImplantPlan = typeof implantPlans.$inferSelect;
export type InsertImplantPlan = typeof implantPlans.$inferInsert;

// Permissões de usuários
export const userPermissions = mysqlTable("user_permissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  module: varchar("module", { length: 50 }).notNull(),
  canView: boolean("canView").default(false),
  canCreate: boolean("canCreate").default(false),
  canEdit: boolean("canEdit").default(false),
  canDelete: boolean("canDelete").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = typeof userPermissions.$inferInsert;

// Perfis de acesso predefinidos
export const accessProfiles = mysqlTable("access_profiles", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId"), // Multi-tenancy: ID da clínica
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  permissions: text("permissions"), // JSON com permissões
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AccessProfile = typeof accessProfiles.$inferSelect;
export type InsertAccessProfile = typeof accessProfiles.$inferInsert;


// Consultórios
export const offices = mysqlTable("offices", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId"), // Multi-tenancy: ID da clínica
  name: varchar("name", { length: 100 }).notNull(),
  number: varchar("number", { length: 20 }),
  floor: varchar("floor", { length: 20 }),
  description: text("description"),
  specialties: text("specialties"), // JSON array de especialidades
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Office = typeof offices.$inferSelect;
export type InsertOffice = typeof offices.$inferInsert;

// Fila de atendimento (fluxo completo)
export const serviceQueue = mysqlTable("service_queue", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId"), // Multi-tenancy: ID da clínica
  patientId: int("patientId").notNull(),
  patientName: varchar("patientName", { length: 255 }).notNull(),
  // Tipo de fila: para qual profissional o paciente está indo
  queueType: mysqlEnum("queueType", ["reception", "budget", "dentist", "orthodontics", "implant", "prosthetics", "maxillofacial", "pediatric"]).default("reception").notNull(),
  // Status do atendimento
  status: mysqlEnum("status", ["waiting", "called", "in_service", "pending_payment", "completed", "forwarded"]).default("waiting").notNull(),
  // Prioridade
  priority: mysqlEnum("priority", ["normal", "high", "urgent"]).default("normal"),
  // Consultório atribuído (quando chamado)
  officeId: int("officeId"),
  officeName: varchar("officeName", { length: 100 }),
  // Profissional que está atendendo
  professionalId: int("professionalId"),
  professionalName: varchar("professionalName", { length: 255 }),
  // Orçamento vinculado (se houver)
  budgetId: int("budgetId"),
  budgetValue: decimal("budgetValue", { precision: 10, scale: 2 }),
  // Valor a cobrar (definido pelo orçamentista)
  amountToPay: decimal("amountToPay", { precision: 10, scale: 2 }),
  amountPaid: decimal("amountPaid", { precision: 10, scale: 2 }),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "partial", "paid"]).default("pending"),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  // Origem (de onde veio o paciente)
  originQueue: varchar("originQueue", { length: 50 }),
  originProfessional: varchar("originProfessional", { length: 255 }),
  // Destino (para onde vai após atendimento)
  nextQueue: varchar("nextQueue", { length: 50 }),
  // Notas do atendimento
  notes: text("notes"),
  evaluationNotes: text("evaluationNotes"), // Notas da avaliação do orçamentista
  // Timestamps
  arrivalTime: timestamp("arrivalTime").defaultNow().notNull(),
  calledTime: timestamp("calledTime"),
  serviceStartTime: timestamp("serviceStartTime"),
  serviceEndTime: timestamp("serviceEndTime"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ServiceQueue = typeof serviceQueue.$inferSelect;
export type InsertServiceQueue = typeof serviceQueue.$inferInsert;

// Histórico de movimentação na fila (para rastreabilidade)
export const queueHistory = mysqlTable("queue_history", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId"), // Multi-tenancy: ID da clínica
  queueEntryId: int("queueEntryId").notNull(),
  patientId: int("patientId").notNull(),
  action: mysqlEnum("action", ["added", "called", "started", "forwarded", "payment_requested", "payment_received", "completed", "cancelled"]).notNull(),
  fromQueue: varchar("fromQueue", { length: 50 }),
  toQueue: varchar("toQueue", { length: 50 }),
  officeId: int("officeId"),
  officeName: varchar("officeName", { length: 100 }),
  professionalId: int("professionalId"),
  professionalName: varchar("professionalName", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QueueHistory = typeof queueHistory.$inferSelect;
export type InsertQueueHistory = typeof queueHistory.$inferInsert;

// Chamadas para o Painel TV
export const tvPanelCalls = mysqlTable("tv_panel_calls", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId"), // Multi-tenancy: ID da clínica
  queueEntryId: int("queueEntryId").notNull(),
  patientName: varchar("patientName", { length: 255 }).notNull(),
  officeName: varchar("officeName", { length: 100 }),
  officeNumber: varchar("officeNumber", { length: 20 }),
  professionalName: varchar("professionalName", { length: 255 }),
  queueType: varchar("queueType", { length: 50 }),
  isActive: boolean("isActive").default(true),
  calledAt: timestamp("calledAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export type TvPanelCall = typeof tvPanelCalls.$inferSelect;
export type InsertTvPanelCall = typeof tvPanelCalls.$inferInsert;


// Imagens do paciente (Fotos clínicas, radiografias, etc)
export const patientImages = mysqlTable("patient_images", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  category: mysqlEnum("category", ["intraoral", "extraoral", "radiografia", "tomografia", "modelo_3d", "antes_depois", "outros"]).notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  imageUrl: text("imageUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  toothNumber: varchar("toothNumber", { length: 10 }), // Se for específico de um dente
  takenAt: timestamp("takenAt"), // Data da foto/exame
  takenBy: varchar("takenBy", { length: 255 }), // Quem tirou a foto
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PatientImage = typeof patientImages.$inferSelect;
export type InsertPatientImage = typeof patientImages.$inferInsert;

// Recibos do paciente
export const patientReceipts = mysqlTable("patient_receipts", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  transactionId: int("transactionId"), // Referência à transação financeira
  receiptNumber: varchar("receiptNumber", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  description: text("description"),
  services: text("services"), // JSON com serviços incluídos
  dentistId: int("dentistId"),
  dentistName: varchar("dentistName", { length: 255 }),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PatientReceipt = typeof patientReceipts.$inferSelect;
export type InsertPatientReceipt = typeof patientReceipts.$inferInsert;


// Histórico de conversas da Dentrics IA
export const iaConversations = mysqlTable("ia_conversations", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  sources: text("sources"), // JSON array de fontes (PubMed, etc.)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type IaConversation = typeof iaConversations.$inferSelect;
export type InsertIaConversation = typeof iaConversations.$inferInsert;


// Simulações de Smile Design
export const smileDesigns = mysqlTable("smile_designs", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId").notNull(),
  patientId: int("patientId"),
  originalImageUrl: text("originalImageUrl").notNull(),
  simulatedImageUrl: text("simulatedImageUrl").notNull(),
  treatmentType: varchar("treatmentType", { length: 50 }).notNull(),
  notes: text("notes"),
  createdBy: int("createdBy").notNull(),
  // Campos de rastreamento de conversão
  budgetId: int("budgetId"), // Orçamento gerado após simulação
  converted: boolean("converted").default(false), // Se o orçamento foi fechado
  convertedAt: timestamp("convertedAt"), // Data da conversão
  sharedViaWhatsApp: boolean("sharedViaWhatsApp").default(false), // Se foi compartilhado
  sharedAt: timestamp("sharedAt"), // Data do compartilhamento
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SmileDesign = typeof smileDesigns.$inferSelect;
export type InsertSmileDesign = typeof smileDesigns.$inferInsert;

// Alertas de Retorno
export const returnAlerts = mysqlTable("return_alerts", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId").notNull(),
  patientId: int("patientId").notNull(),
  treatmentType: varchar("treatmentType", { length: 100 }),
  lastVisitDate: timestamp("lastVisitDate").notNull(),
  returnDueDate: timestamp("returnDueDate").notNull(),
  daysUntilReturn: int("daysUntilReturn").notNull(),
  status: mysqlEnum("status", ["pending", "contacted", "scheduled", "completed", "cancelled"]).default("pending").notNull(),
  contactAttempts: int("contactAttempts").default(0),
  lastContactDate: timestamp("lastContactDate"),
  lastContactNotes: text("lastContactNotes"),
  scheduledAppointmentId: int("scheduledAppointmentId"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ReturnAlert = typeof returnAlerts.$inferSelect;
export type InsertReturnAlert = typeof returnAlerts.$inferInsert;

// Configurações de período de retorno por tipo de tratamento
export const returnPeriodSettings = mysqlTable("return_period_settings", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId").notNull(),
  treatmentType: varchar("treatmentType", { length: 100 }).notNull(),
  returnPeriodDays: int("returnPeriodDays").notNull(),
  reminderDaysBefore: int("reminderDaysBefore").default(7),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ReturnPeriodSetting = typeof returnPeriodSettings.$inferSelect;
export type InsertReturnPeriodSetting = typeof returnPeriodSettings.$inferInsert;

// Histórico de lembretes WhatsApp enviados
export const whatsappReminderHistory = mysqlTable("whatsapp_reminder_history", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId").notNull(),
  returnAlertId: int("returnAlertId").notNull(),
  patientId: int("patientId").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  messageTemplate: varchar("messageTemplate", { length: 100 }).notNull(),
  messageContent: text("messageContent").notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  sentBy: int("sentBy"), // userId que enviou
  status: mysqlEnum("status", ["sent", "delivered", "read", "failed"]).default("sent").notNull(),
});
export type WhatsappReminderHistory = typeof whatsappReminderHistory.$inferSelect;
export type InsertWhatsappReminderHistory = typeof whatsappReminderHistory.$inferInsert;

// Templates de mensagem de lembrete
export const reminderTemplates = mysqlTable("reminder_templates", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  message: text("message").notNull(),
  isDefault: boolean("isDefault").default(false),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ReminderTemplate = typeof reminderTemplates.$inferSelect;
export type InsertReminderTemplate = typeof reminderTemplates.$inferInsert;


// Modelos 3D do paciente
export const patientModels3D = mysqlTable("patient_models_3d", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId").notNull(),
  patientId: int("patientId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  fileUrl: text("fileUrl").notNull(), // URL do arquivo no S3
  fileKey: varchar("fileKey", { length: 500 }).notNull(), // Key do arquivo no S3
  fileType: varchar("fileType", { length: 20 }).notNull().default("stl"), // stl, obj, gltf, glb
  fileSize: int("fileSize"), // Tamanho em bytes
  category: mysqlEnum("category", ["escaneamento", "planejamento", "prótese", "implante", "ortodontia", "outro"]).default("escaneamento").notNull(),
  isInLibrary: boolean("isInLibrary").default(false), // Se está na biblioteca geral
  createdBy: int("createdBy").notNull(), // userId que fez upload
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PatientModel3D = typeof patientModels3D.$inferSelect;
export type InsertPatientModel3D = typeof patientModels3D.$inferInsert;

// Biblioteca geral de modelos 3D
export const models3DLibrary = mysqlTable("models_3d_library", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileType: varchar("fileType", { length: 20 }).notNull().default("stl"),
  fileSize: int("fileSize"),
  category: mysqlEnum("category", ["anatomia", "escaneamento", "planejamento", "prótese", "implante", "ortodontia", "educacional", "outro"]).default("anatomia").notNull(),
  isPublic: boolean("isPublic").default(false), // Se é visível para todas as clínicas
  sourcePatientModelId: int("sourcePatientModelId"), // Se veio de um modelo de paciente
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Model3DLibrary = typeof models3DLibrary.$inferSelect;
export type InsertModel3DLibrary = typeof models3DLibrary.$inferInsert;


// Procedimentos do tratamento (vinculados ao orçamento/fila)
// Cada procedimento pode ser marcado como concluído pelos especialistas
export const treatmentProcedures = mysqlTable("treatment_procedures", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId").notNull(),
  patientId: int("patientId").notNull(),
  dentistId: int("dentistId"), // Dentista responsável pelo procedimento
  budgetId: int("budgetId"), // Orçamento vinculado
  queueEntryId: int("queueEntryId"), // Entrada na fila de atendimento
  procedureId: int("procedureId"), // Procedimento do catálogo
  procedureName: varchar("procedureName", { length: 255 }).notNull(),
  toothNumber: varchar("toothNumber", { length: 20 }), // Número do dente ou "upper_arch", "lower_arch", "full"
  faces: varchar("faces", { length: 50 }), // Faces do dente (V, L, M, D, O)
  condition: varchar("condition", { length: 50 }), // Condição original (caries, restoration, etc)
  price: decimal("price", { precision: 10, scale: 2 }), // Preço (visível apenas para orçamentista/admin)
  status: mysqlEnum("status", ["pending", "in_progress", "completed"]).default("pending").notNull(),
  completedBy: int("completedBy"), // userId que marcou como concluído
  completedAt: timestamp("completedAt"), // Data/hora da conclusão
  notes: text("notes"), // Observações do especialista
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TreatmentProcedure = typeof treatmentProcedures.$inferSelect;
export type InsertTreatmentProcedure = typeof treatmentProcedures.$inferInsert;


// Documentos médicos do prontuário (Atestado, Receituário, Termo de Consentimento, Contrato)
export const medicalDocuments = mysqlTable("medical_documents", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId").notNull(), // Multi-tenancy
  patientId: int("patientId").notNull(),
  dentistId: int("dentistId"), // Profissional responsável
  
  // Tipo de documento
  type: mysqlEnum("type", ["atestado", "receituario", "termo_consentimento", "contrato"]).notNull(),
  
  // Campos do Atestado
  attestationType: mysqlEnum("attestationType", ["dias", "presenca"]), // Tipo: dias de afastamento ou presença
  attestationDays: int("attestationDays"), // Quantidade de dias (se tipo = dias)
  includeCid: boolean("includeCid").default(false), // Incluir CID
  cidCode: varchar("cidCode", { length: 20 }), // Código CID se autorizado
  
  // Campos do Receituário
  prescription: text("prescription"), // Prescrição de medicamentos
  
  // Campos do Termo de Consentimento
  consentProcedure: varchar("consentProcedure", { length: 255 }), // Procedimento autorizado
  customProcedure: varchar("customProcedure", { length: 255 }), // Procedimento personalizado
  
  // Campos do Contrato
  contractProcedures: text("contractProcedures"), // Descrição dos procedimentos
  contractValue: decimal("contractValue", { precision: 10, scale: 2 }), // Valor total
  paymentMethod: varchar("paymentMethod", { length: 100 }), // Forma de pagamento
  contractObservations: text("contractObservations"), // Observações adicionais
  
  // Dados da clínica no momento da emissão (snapshot)
  clinicName: varchar("clinicName", { length: 255 }),
  clinicAddress: text("clinicAddress"),
  clinicPhone: varchar("clinicPhone", { length: 20 }),
  clinicCnpj: varchar("clinicCnpj", { length: 18 }),
  clinicCro: varchar("clinicCro", { length: 50 }),
  
  // Dados do dentista no momento da emissão (snapshot)
  dentistName: varchar("dentistName", { length: 255 }),
  dentistCro: varchar("dentistCro", { length: 50 }),
  
  // Dados do paciente no momento da emissão (snapshot)
  patientName: varchar("patientName", { length: 255 }),
  patientCpf: varchar("patientCpf", { length: 14 }),
  patientAddress: text("patientAddress"),
  
  // Assinaturas Digitais
  patientSignature: text("patientSignature"), // Assinatura do paciente (base64 ou texto)
  patientSignedAt: timestamp("patientSignedAt"), // Data/hora da assinatura do paciente
  professionalSignature: text("professionalSignature"), // Assinatura do profissional (base64 ou texto)
  professionalSignedAt: timestamp("professionalSignedAt"), // Data/hora da assinatura do profissional
  
  // Link de Validação
  validationToken: varchar("validation_token", { length: 64 }), // Token único para validação
  validationExpiresAt: timestamp("validation_expires_at"), // Data de expiração do link (null = sem expiração)
  
  // Metadados
  documentDate: timestamp("documentDate").notNull(), // Data do documento
  pdfUrl: text("pdfUrl"), // URL do PDF gerado
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MedicalDocument = typeof medicalDocuments.$inferSelect;
export type InsertMedicalDocument = typeof medicalDocuments.$inferInsert;
