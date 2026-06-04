var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, date, time } from "drizzle-orm/mysql-core";
var plans, clinics, users, userClinics, rolePermissions, clinicSettings, patients, anamnesis, dentists, procedureCategories, procedures, insurances, appointments, chairs, budgets, budgetItems, treatments, transactions, stockCategories, stockItems, stockMovements, waitingQueue, patientDocuments, laboratories, prosthesisTypes, prosthesisOrders, aiAnalysis, checkins, whatsappNotifications, notificationSettings, orthodonticTreatments, orthodonticMaintenances, implantPlans, userPermissions, accessProfiles, offices, serviceQueue, queueHistory, tvPanelCalls, patientImages, patientReceipts, iaConversations, smileDesigns, returnAlerts, returnPeriodSettings, whatsappReminderHistory, reminderTemplates, patientModels3D, models3DLibrary, treatmentProcedures, medicalDocuments, dentistCommissions, completedAppointments, dailyEarningsSummary;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    plans = mysqlTable("plans", {
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    clinics = mysqlTable("clinics", {
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      openId: varchar("openId", { length: 64 }).unique(),
      // Opcional para compatibilidade
      email: varchar("email", { length: 320 }).notNull().unique(),
      passwordHash: varchar("passwordHash", { length: 255 }),
      // Hash bcrypt da senha
      name: text("name"),
      phone: varchar("phone", { length: 20 }),
      loginMethod: varchar("loginMethod", { length: 64 }).default("email"),
      // email, google, manus
      role: mysqlEnum("role", ["user", "admin", "superadmin"]).default("user").notNull(),
      clinicId: int("clinicId"),
      // Clínica principal do usuário
      isActive: boolean("isActive").default(true),
      emailVerified: boolean("emailVerified").default(false),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    userClinics = mysqlTable("user_clinics", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      clinicId: int("clinicId").notNull(),
      role: mysqlEnum("role", ["owner", "admin", "atendente", "dentista", "protesista", "ortodontista", "implantodontista", "bucomaxilo", "odontopediatria"]).default("atendente").notNull(),
      isActive: boolean("isActive").default(true),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    rolePermissions = mysqlTable("role_permissions", {
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    clinicSettings = mysqlTable("clinic_settings", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId").notNull(),
      // Multi-tenancy: ID da clínica
      name: varchar("name", { length: 255 }).notNull().default("Minha Cl\xEDnica"),
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
      logoData: text("logoData"),
      // Logo como base64 data URL
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    patients = mysqlTable("patients", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId"),
      // Multi-tenancy: ID da clínica
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    anamnesis = mysqlTable("anamnesis", {
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    dentists = mysqlTable("dentists", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId"),
      // Multi-tenancy: ID da clínica
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    procedureCategories = mysqlTable("procedure_categories", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId"),
      // Multi-tenancy: ID da clínica
      name: varchar("name", { length: 100 }).notNull(),
      color: varchar("color", { length: 7 }).default("#3B82F6"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    procedures = mysqlTable("procedures", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId"),
      // Multi-tenancy: ID da clínica
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    insurances = mysqlTable("insurances", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId"),
      // Multi-tenancy: ID da clínica
      name: varchar("name", { length: 255 }).notNull(),
      code: varchar("code", { length: 50 }),
      phone: varchar("phone", { length: 20 }),
      email: varchar("email", { length: 320 }),
      discount: decimal("discount", { precision: 5, scale: 2 }).default("0"),
      isActive: boolean("isActive").default(true),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    appointments = mysqlTable("appointments", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId"),
      // Multi-tenancy: ID da clínica
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    chairs = mysqlTable("chairs", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId"),
      // Multi-tenancy: ID da clínica
      name: varchar("name", { length: 100 }).notNull(),
      description: text("description"),
      isActive: boolean("isActive").default(true),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    budgets = mysqlTable("budgets", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId"),
      // Multi-tenancy: ID da clínica
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    budgetItems = mysqlTable("budget_items", {
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
      priority: int("priority").default(2),
      // 1=alta, 2=média, 3=baixa
      approvedAt: timestamp("approvedAt"),
      rejectedAt: timestamp("rejectedAt"),
      rejectionReason: text("rejectionReason"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    treatments = mysqlTable("treatments", {
      id: int("id").autoincrement().primaryKey(),
      patientId: int("patientId").notNull(),
      toothNumber: varchar("toothNumber", { length: 10 }).notNull(),
      face: varchar("face", { length: 5 }),
      condition: mysqlEnum("condition", ["healthy", "cavity", "restoration", "extraction", "implant", "crown", "bridge", "canal", "fracture", "absent"]).default("healthy"),
      procedureId: int("procedureId"),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    transactions = mysqlTable("transactions", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId"),
      // Multi-tenancy: ID da clínica
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    stockCategories = mysqlTable("stock_categories", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId"),
      // Multi-tenancy: ID da clínica
      name: varchar("name", { length: 100 }).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    stockItems = mysqlTable("stock_items", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId"),
      // Multi-tenancy: ID da clínica
      name: varchar("name", { length: 255 }).notNull(),
      categoryId: int("categoryId"),
      quantity: int("quantity").default(0),
      minQuantity: int("minQuantity").default(10),
      unit: varchar("unit", { length: 20 }).default("un"),
      costPrice: decimal("costPrice", { precision: 10, scale: 2 }),
      supplier: varchar("supplier", { length: 255 }),
      expirationDate: date("expirationDate"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    stockMovements = mysqlTable("stock_movements", {
      id: int("id").autoincrement().primaryKey(),
      stockItemId: int("stockItemId").notNull(),
      type: mysqlEnum("type", ["in", "out"]).notNull(),
      quantity: int("quantity").notNull(),
      reason: text("reason"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    waitingQueue = mysqlTable("waiting_queue", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId"),
      // Multi-tenancy: ID da clínica
      patientId: int("patientId").notNull(),
      queueType: mysqlEnum("queueType", ["budget", "dentist", "orthodontics", "implant", "prosthetics", "maxillofacial", "pediatric"]).default("dentist"),
      priority: mysqlEnum("priority", ["normal", "high", "urgent"]).default("normal"),
      status: mysqlEnum("status", ["waiting", "in_service", "completed", "cancelled"]).default("waiting"),
      arrivalTime: timestamp("arrivalTime").defaultNow().notNull(),
      startTime: timestamp("startTime"),
      endTime: timestamp("endTime"),
      dentistId: int("dentistId"),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    patientDocuments = mysqlTable("patient_documents", {
      id: int("id").autoincrement().primaryKey(),
      patientId: int("patientId").notNull(),
      type: mysqlEnum("type", ["image", "document", "xray", "receipt"]).default("document"),
      name: varchar("name", { length: 255 }).notNull(),
      url: text("url").notNull(),
      description: text("description"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    laboratories = mysqlTable("laboratories", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId"),
      // Multi-tenancy: ID da clínica
      name: varchar("name", { length: 255 }).notNull(),
      phone: varchar("phone", { length: 20 }),
      email: varchar("email", { length: 320 }),
      address: text("address"),
      contactPerson: varchar("contactPerson", { length: 255 }),
      isActive: boolean("isActive").default(true),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    prosthesisTypes = mysqlTable("prosthesis_types", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId"),
      // Multi-tenancy: ID da clínica
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description"),
      defaultPrice: decimal("defaultPrice", { precision: 10, scale: 2 }),
      estimatedDays: int("estimatedDays").default(7),
      isActive: boolean("isActive").default(true),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    prosthesisOrders = mysqlTable("prosthesis_orders", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId"),
      // Multi-tenancy: ID da clínica
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    aiAnalysis = mysqlTable("ai_analysis", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId"),
      // Multi-tenancy: ID da clínica
      patientId: int("patientId").notNull(),
      imageUrl: text("imageUrl").notNull(),
      imageHash: varchar("imageHash", { length: 64 }),
      imageType: mysqlEnum("imageType", ["panoramic", "periapical", "bitewing", "cephalometric", "intraoral"]).default("panoramic"),
      analysisResult: text("analysisResult"),
      findings: text("findings"),
      recommendations: text("recommendations"),
      confidence: decimal("confidence", { precision: 5, scale: 2 }),
      analyzedAt: timestamp("analyzedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    checkins = mysqlTable("checkins", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId"),
      // Multi-tenancy: ID da clínica
      patientId: int("patientId"),
      patientName: varchar("patientName", { length: 255 }),
      phone: varchar("phone", { length: 20 }),
      reason: text("reason"),
      queueType: mysqlEnum("queueType", ["budget", "dentist", "orthodontics", "implant", "prosthetics", "maxillofacial", "pediatric"]).default("budget"),
      status: mysqlEnum("status", ["waiting", "called", "in_service", "completed"]).default("waiting"),
      checkinTime: timestamp("checkinTime").defaultNow().notNull(),
      calledTime: timestamp("calledTime"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    whatsappNotifications = mysqlTable("whatsapp_notifications", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId"),
      // Multi-tenancy: ID da clínica
      patientId: int("patientId"),
      appointmentId: int("appointmentId"),
      phone: varchar("phone", { length: 20 }).notNull(),
      type: mysqlEnum("type", ["appointment_reminder", "queue_call", "confirmation", "followup", "custom"]).default("custom"),
      message: text("message").notNull(),
      status: mysqlEnum("status", ["pending", "sent", "delivered", "read", "failed"]).default("pending"),
      scheduledFor: timestamp("scheduledFor"),
      sentAt: timestamp("sentAt"),
      errorMessage: text("errorMessage"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    notificationSettings = mysqlTable("notification_settings", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId"),
      // Multi-tenancy: ID da clínica
      appointmentReminderEnabled: boolean("appointmentReminderEnabled").default(true),
      reminderHoursBefore: int("reminderHoursBefore").default(24),
      queueCallEnabled: boolean("queueCallEnabled").default(true),
      confirmationEnabled: boolean("confirmationEnabled").default(true),
      followupEnabled: boolean("followupEnabled").default(false),
      followupDaysAfter: int("followupDaysAfter").default(7),
      whatsappApiKey: text("whatsappApiKey"),
      whatsappPhoneId: varchar("whatsappPhoneId", { length: 50 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    orthodonticTreatments = mysqlTable("orthodontic_treatments", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId"),
      // Multi-tenancy: ID da clínica
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    orthodonticMaintenances = mysqlTable("orthodontic_maintenances", {
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
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    implantPlans = mysqlTable("implant_plans", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId"),
      // Multi-tenancy: ID da clínica
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    userPermissions = mysqlTable("user_permissions", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      module: varchar("module", { length: 50 }).notNull(),
      canView: boolean("canView").default(false),
      canCreate: boolean("canCreate").default(false),
      canEdit: boolean("canEdit").default(false),
      canDelete: boolean("canDelete").default(false),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    accessProfiles = mysqlTable("access_profiles", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId"),
      // Multi-tenancy: ID da clínica
      name: varchar("name", { length: 100 }).notNull(),
      description: text("description"),
      permissions: text("permissions"),
      // JSON com permissões
      isDefault: boolean("isDefault").default(false),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    offices = mysqlTable("offices", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId"),
      // Multi-tenancy: ID da clínica
      name: varchar("name", { length: 100 }).notNull(),
      number: varchar("number", { length: 20 }),
      floor: varchar("floor", { length: 20 }),
      description: text("description"),
      specialties: text("specialties"),
      // JSON array de especialidades
      isActive: boolean("isActive").default(true),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    serviceQueue = mysqlTable("service_queue", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId"),
      // Multi-tenancy: ID da clínica
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
      evaluationNotes: text("evaluationNotes"),
      // Notas da avaliação do orçamentista
      // Timestamps
      arrivalTime: timestamp("arrivalTime").defaultNow().notNull(),
      calledTime: timestamp("calledTime"),
      serviceStartTime: timestamp("serviceStartTime"),
      serviceEndTime: timestamp("serviceEndTime"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    queueHistory = mysqlTable("queue_history", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId"),
      // Multi-tenancy: ID da clínica
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
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    tvPanelCalls = mysqlTable("tv_panel_calls", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId"),
      // Multi-tenancy: ID da clínica
      queueEntryId: int("queueEntryId").notNull(),
      patientName: varchar("patientName", { length: 255 }).notNull(),
      officeName: varchar("officeName", { length: 100 }),
      officeNumber: varchar("officeNumber", { length: 20 }),
      professionalName: varchar("professionalName", { length: 255 }),
      queueType: varchar("queueType", { length: 50 }),
      isActive: boolean("isActive").default(true),
      calledAt: timestamp("calledAt").defaultNow().notNull(),
      expiresAt: timestamp("expiresAt")
    });
    patientImages = mysqlTable("patient_images", {
      id: int("id").autoincrement().primaryKey(),
      patientId: int("patientId").notNull(),
      category: mysqlEnum("category", ["intraoral", "extraoral", "radiografia", "tomografia", "modelo_3d", "antes_depois", "outros"]).notNull(),
      title: varchar("title", { length: 255 }),
      description: text("description"),
      imageUrl: text("imageUrl").notNull(),
      thumbnailUrl: text("thumbnailUrl"),
      toothNumber: varchar("toothNumber", { length: 10 }),
      // Se for específico de um dente
      takenAt: timestamp("takenAt"),
      // Data da foto/exame
      takenBy: varchar("takenBy", { length: 255 }),
      // Quem tirou a foto
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    patientReceipts = mysqlTable("patient_receipts", {
      id: int("id").autoincrement().primaryKey(),
      patientId: int("patientId").notNull(),
      transactionId: int("transactionId"),
      // Referência à transação financeira
      receiptNumber: varchar("receiptNumber", { length: 50 }).notNull(),
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      paymentMethod: varchar("paymentMethod", { length: 50 }),
      description: text("description"),
      services: text("services"),
      // JSON com serviços incluídos
      dentistId: int("dentistId"),
      dentistName: varchar("dentistName", { length: 255 }),
      issuedAt: timestamp("issuedAt").defaultNow().notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    iaConversations = mysqlTable("ia_conversations", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId").notNull(),
      userId: int("userId").notNull(),
      role: mysqlEnum("role", ["user", "assistant"]).notNull(),
      content: text("content").notNull(),
      sources: text("sources"),
      // JSON array de fontes (PubMed, etc.)
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    smileDesigns = mysqlTable("smile_designs", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId").notNull(),
      patientId: int("patientId"),
      originalImageUrl: text("originalImageUrl").notNull(),
      simulatedImageUrl: text("simulatedImageUrl").notNull(),
      treatmentType: varchar("treatmentType", { length: 50 }).notNull(),
      notes: text("notes"),
      createdBy: int("createdBy").notNull(),
      // Campos de rastreamento de conversão
      budgetId: int("budgetId"),
      // Orçamento gerado após simulação
      converted: boolean("converted").default(false),
      // Se o orçamento foi fechado
      convertedAt: timestamp("convertedAt"),
      // Data da conversão
      sharedViaWhatsApp: boolean("sharedViaWhatsApp").default(false),
      // Se foi compartilhado
      sharedAt: timestamp("sharedAt"),
      // Data do compartilhamento
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    returnAlerts = mysqlTable("return_alerts", {
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    returnPeriodSettings = mysqlTable("return_period_settings", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId").notNull(),
      treatmentType: varchar("treatmentType", { length: 100 }).notNull(),
      returnPeriodDays: int("returnPeriodDays").notNull(),
      reminderDaysBefore: int("reminderDaysBefore").default(7),
      isActive: boolean("isActive").default(true),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    whatsappReminderHistory = mysqlTable("whatsapp_reminder_history", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId").notNull(),
      returnAlertId: int("returnAlertId").notNull(),
      patientId: int("patientId").notNull(),
      phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
      messageTemplate: varchar("messageTemplate", { length: 100 }).notNull(),
      messageContent: text("messageContent").notNull(),
      sentAt: timestamp("sentAt").defaultNow().notNull(),
      sentBy: int("sentBy"),
      // userId que enviou
      status: mysqlEnum("status", ["sent", "delivered", "read", "failed"]).default("sent").notNull()
    });
    reminderTemplates = mysqlTable("reminder_templates", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId").notNull(),
      name: varchar("name", { length: 100 }).notNull(),
      message: text("message").notNull(),
      isDefault: boolean("isDefault").default(false),
      isActive: boolean("isActive").default(true),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    patientModels3D = mysqlTable("patient_models_3d", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId").notNull(),
      patientId: int("patientId").notNull(),
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description"),
      fileUrl: text("fileUrl").notNull(),
      // URL do arquivo no S3
      fileKey: varchar("fileKey", { length: 500 }).notNull(),
      // Key do arquivo no S3
      fileType: varchar("fileType", { length: 20 }).notNull().default("stl"),
      // stl, obj, gltf, glb
      fileSize: int("fileSize"),
      // Tamanho em bytes
      category: mysqlEnum("category", ["escaneamento", "planejamento", "pr\xF3tese", "implante", "ortodontia", "outro"]).default("escaneamento").notNull(),
      isInLibrary: boolean("isInLibrary").default(false),
      // Se está na biblioteca geral
      createdBy: int("createdBy").notNull(),
      // userId que fez upload
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    models3DLibrary = mysqlTable("models_3d_library", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId").notNull(),
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description"),
      fileUrl: text("fileUrl").notNull(),
      fileKey: varchar("fileKey", { length: 500 }).notNull(),
      fileType: varchar("fileType", { length: 20 }).notNull().default("stl"),
      fileSize: int("fileSize"),
      category: mysqlEnum("category", ["anatomia", "escaneamento", "planejamento", "pr\xF3tese", "implante", "ortodontia", "educacional", "outro"]).default("anatomia").notNull(),
      isPublic: boolean("isPublic").default(false),
      // Se é visível para todas as clínicas
      sourcePatientModelId: int("sourcePatientModelId"),
      // Se veio de um modelo de paciente
      createdBy: int("createdBy").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    treatmentProcedures = mysqlTable("treatment_procedures", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId").notNull(),
      patientId: int("patientId").notNull(),
      budgetId: int("budgetId"),
      // Orçamento vinculado
      queueEntryId: int("queueEntryId"),
      // Entrada na fila de atendimento
      procedureId: int("procedureId"),
      // Procedimento do catálogo
      procedureName: varchar("procedureName", { length: 255 }).notNull(),
      toothNumber: varchar("toothNumber", { length: 20 }),
      // Número do dente ou "upper_arch", "lower_arch", "full"
      faces: varchar("faces", { length: 50 }),
      // Faces do dente (V, L, M, D, O)
      condition: varchar("condition", { length: 50 }),
      // Condição original (caries, restoration, etc)
      price: decimal("price", { precision: 10, scale: 2 }),
      // Preço (visível apenas para orçamentista/admin)
      status: mysqlEnum("status", ["pending", "in_progress", "completed"]).default("pending").notNull(),
      completedBy: int("completedBy"),
      // userId que marcou como concluído
      completedAt: timestamp("completedAt"),
      // Data/hora da conclusão
      notes: text("notes"),
      // Observações do especialista
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    medicalDocuments = mysqlTable("medical_documents", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId").notNull(),
      // Multi-tenancy
      patientId: int("patientId").notNull(),
      dentistId: int("dentistId"),
      // Profissional responsável
      // Tipo de documento
      type: mysqlEnum("type", ["atestado", "receituario", "termo_consentimento", "contrato"]).notNull(),
      // Campos do Atestado
      attestationType: mysqlEnum("attestationType", ["dias", "presenca"]),
      // Tipo: dias de afastamento ou presença
      attestationDays: int("attestationDays"),
      // Quantidade de dias (se tipo = dias)
      includeCid: boolean("includeCid").default(false),
      // Incluir CID
      cidCode: varchar("cidCode", { length: 20 }),
      // Código CID se autorizado
      // Campos do Receituário
      prescription: text("prescription"),
      // Prescrição de medicamentos
      // Campos do Termo de Consentimento
      consentProcedure: varchar("consentProcedure", { length: 255 }),
      // Procedimento autorizado
      customProcedure: varchar("customProcedure", { length: 255 }),
      // Procedimento personalizado
      // Campos do Contrato
      contractProcedures: text("contractProcedures"),
      // Descrição dos procedimentos
      contractValue: decimal("contractValue", { precision: 10, scale: 2 }),
      // Valor total
      paymentMethod: varchar("paymentMethod", { length: 100 }),
      // Forma de pagamento
      contractObservations: text("contractObservations"),
      // Observações adicionais
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
      patientSignature: text("patientSignature"),
      // Assinatura do paciente (base64 ou texto)
      patientSignedAt: timestamp("patientSignedAt"),
      // Data/hora da assinatura do paciente
      professionalSignature: text("professionalSignature"),
      // Assinatura do profissional (base64 ou texto)
      professionalSignedAt: timestamp("professionalSignedAt"),
      // Data/hora da assinatura do profissional
      // Link de Validação
      validationToken: varchar("validation_token", { length: 64 }),
      // Token único para validação
      validationExpiresAt: timestamp("validation_expires_at"),
      // Data de expiração do link (null = sem expiração)
      // Metadados
      documentDate: timestamp("documentDate").notNull(),
      // Data do documento
      pdfUrl: text("pdfUrl"),
      // URL do PDF gerado
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    dentistCommissions = mysqlTable("dentist_commissions", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId").notNull(),
      // Multi-tenancy
      dentistId: int("dentistId").notNull(),
      // Referência ao dentista
      procedureId: int("procedureId"),
      // Referência ao procedimento (NULL = comissão genérica)
      commissionPercentage: decimal("commissionPercentage", { precision: 5, scale: 2 }).notNull(),
      // Porcentagem de comissão (ex: 50.00 para 50%)
      isActive: boolean("isActive").default(true),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    completedAppointments = mysqlTable("completed_appointments", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId").notNull(),
      // Multi-tenancy
      appointmentId: int("appointmentId"),
      // Referência ao agendamento original
      dentistId: int("dentistId").notNull(),
      // Dentista que realizou o atendimento
      patientId: int("patientId").notNull(),
      // Paciente atendido
      procedureId: int("procedureId").notNull(),
      // Procedimento realizado
      procedureName: varchar("procedureName", { length: 255 }).notNull(),
      // Nome do procedimento (snapshot)
      procedurePrice: decimal("procedurePrice", { precision: 10, scale: 2 }).notNull(),
      // Preço do procedimento no momento do atendimento
      commissionPercentage: decimal("commissionPercentage", { precision: 5, scale: 2 }).notNull(),
      // Porcentagem de comissão no momento do atendimento
      commissionAmount: decimal("commissionAmount", { precision: 10, scale: 2 }).notNull(),
      // Valor da comissão calculado (procedurePrice * commissionPercentage / 100)
      completedAt: timestamp("completedAt").notNull(),
      // Data e hora da conclusão do atendimento
      paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "cancelled"]).default("pending"),
      // Status do pagamento
      notes: text("notes"),
      // Observações adicionais
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    dailyEarningsSummary = mysqlTable("daily_earnings_summary", {
      id: int("id").autoincrement().primaryKey(),
      clinicId: int("clinicId").notNull(),
      // Multi-tenancy
      dentistId: int("dentistId").notNull(),
      // Dentista
      date: date("date").notNull(),
      // Data do resumo
      totalProcedures: int("totalProcedures").default(0),
      // Total de procedimentos realizados
      totalRevenue: decimal("totalRevenue", { precision: 10, scale: 2 }).default("0"),
      // Receita total dos procedimentos
      totalCommission: decimal("totalCommission", { precision: 10, scale: 2 }).default("0"),
      // Total de comissão do dentista
      status: mysqlEnum("status", ["draft", "finalized", "paid"]).default("draft"),
      // Status do resumo
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
    };
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  addIaConversation: () => addIaConversation,
  addToQueue: () => addToQueue,
  addToServiceQueue: () => addToServiceQueue,
  addUserToClinic: () => addUserToClinic,
  callPatientFromQueue: () => callPatientFromQueue,
  cancelServiceQueueEntry: () => cancelServiceQueueEntry,
  checkClinicAccess: () => checkClinicAccess,
  clearIaConversations: () => clearIaConversations,
  completeService: () => completeService,
  createAccessProfile: () => createAccessProfile,
  createAiAnalysis: () => createAiAnalysis,
  createAppointment: () => createAppointment,
  createBudget: () => createBudget,
  createBudgetItem: () => createBudgetItem,
  createChair: () => createChair,
  createCheckin: () => createCheckin,
  createClinic: () => createClinic,
  createCompletedAppointment: () => createCompletedAppointment,
  createDentist: () => createDentist,
  createDentistCommission: () => createDentistCommission,
  createImplantPlan: () => createImplantPlan,
  createInsurance: () => createInsurance,
  createLaboratory: () => createLaboratory,
  createMedicalDocument: () => createMedicalDocument,
  createModel3DLibrary: () => createModel3DLibrary,
  createOffice: () => createOffice,
  createOrUpdateDailyEarningsSummary: () => createOrUpdateDailyEarningsSummary,
  createOrthodonticMaintenance: () => createOrthodonticMaintenance,
  createOrthodonticTreatment: () => createOrthodonticTreatment,
  createPatient: () => createPatient,
  createPatientDocument: () => createPatientDocument,
  createPatientModel3D: () => createPatientModel3D,
  createPlan: () => createPlan,
  createProcedure: () => createProcedure,
  createProcedureCategory: () => createProcedureCategory,
  createProsthesisOrder: () => createProsthesisOrder,
  createProsthesisType: () => createProsthesisType,
  createReminderTemplate: () => createReminderTemplate,
  createReturnAlert: () => createReturnAlert,
  createSmileDesign: () => createSmileDesign,
  createStockCategory: () => createStockCategory,
  createStockItem: () => createStockItem,
  createStockMovement: () => createStockMovement,
  createTransaction: () => createTransaction,
  createTreatment: () => createTreatment,
  createTreatmentProcedures: () => createTreatmentProcedures,
  createUserWithPassword: () => createUserWithPassword,
  createWhatsappNotification: () => createWhatsappNotification,
  createWhatsappReminderHistory: () => createWhatsappReminderHistory,
  deleteAccessProfile: () => deleteAccessProfile,
  deleteAppointment: () => deleteAppointment,
  deleteClinic: () => deleteClinic,
  deleteDentist: () => deleteDentist,
  deleteDentistCommission: () => deleteDentistCommission,
  deleteInsurance: () => deleteInsurance,
  deleteLaboratory: () => deleteLaboratory,
  deleteMedicalDocument: () => deleteMedicalDocument,
  deleteModel3DLibrary: () => deleteModel3DLibrary,
  deleteOffice: () => deleteOffice,
  deletePatient: () => deletePatient,
  deletePatientDocument: () => deletePatientDocument,
  deletePatientModel3D: () => deletePatientModel3D,
  deletePlan: () => deletePlan,
  deleteProcedure: () => deleteProcedure,
  deleteProsthesisOrder: () => deleteProsthesisOrder,
  deleteProsthesisType: () => deleteProsthesisType,
  deleteReminderTemplate: () => deleteReminderTemplate,
  deleteStockItem: () => deleteStockItem,
  deleteTransaction: () => deleteTransaction,
  deleteTreatment: () => deleteTreatment,
  deleteUser: () => deleteUser,
  deleteUserPermissions: () => deleteUserPermissions,
  finalizeDailyEarningsSummary: () => finalizeDailyEarningsSummary,
  finishServiceAndForward: () => finishServiceAndForward,
  getAccessProfiles: () => getAccessProfiles,
  getActiveOffices: () => getActiveOffices,
  getActiveOfficesByClinic: () => getActiveOfficesByClinic,
  getActiveTvPanelCalls: () => getActiveTvPanelCalls,
  getAdvancedDashboardStats: () => getAdvancedDashboardStats,
  getAiAnalyses: () => getAiAnalyses,
  getAiAnalysisByImageHash: () => getAiAnalysisByImageHash,
  getAllRolePermissions: () => getAllRolePermissions,
  getAllUsers: () => getAllUsers,
  getAnamnesis: () => getAnamnesis,
  getAppointmentById: () => getAppointmentById,
  getAppointments: () => getAppointments,
  getBudgetById: () => getBudgetById,
  getBudgetItems: () => getBudgetItems,
  getBudgets: () => getBudgets,
  getChairs: () => getChairs,
  getCheckinQueuePosition: () => getCheckinQueuePosition,
  getCheckins: () => getCheckins,
  getClinicById: () => getClinicById,
  getClinicBySlug: () => getClinicBySlug,
  getClinicSettings: () => getClinicSettings,
  getClinicSubscriptionStats: () => getClinicSubscriptionStats,
  getClinicUsers: () => getClinicUsers,
  getClinicUsersWithDetails: () => getClinicUsersWithDetails,
  getClinics: () => getClinics,
  getClinicsCount: () => getClinicsCount,
  getClinicsWithSubscriptionStatus: () => getClinicsWithSubscriptionStatus,
  getCompletedAppointmentsByClinic: () => getCompletedAppointmentsByClinic,
  getCompletedAppointmentsByDate: () => getCompletedAppointmentsByDate,
  getCompletedAppointmentsByDentist: () => getCompletedAppointmentsByDentist,
  getCompletedAppointmentsByDentistAndDate: () => getCompletedAppointmentsByDentistAndDate,
  getCompletedAppointmentsBySpecialty: () => getCompletedAppointmentsBySpecialty,
  getDailyEarningsSummary: () => getDailyEarningsSummary,
  getDailyEarningsSummaryByClinic: () => getDailyEarningsSummaryByClinic,
  getDailyEarningsSummaryByDate: () => getDailyEarningsSummaryByDate,
  getDailyEarningsSummaryBySpecialty: () => getDailyEarningsSummaryBySpecialty,
  getDashboardStats: () => getDashboardStats,
  getDb: () => getDb,
  getDentistAreaStats: () => getDentistAreaStats,
  getDentistById: () => getDentistById,
  getDentistCommissionById: () => getDentistCommissionById,
  getDentistCommissionByProcedure: () => getDentistCommissionByProcedure,
  getDentistCommissions: () => getDentistCommissions,
  getDentistDefaultCommission: () => getDentistDefaultCommission,
  getDentists: () => getDentists,
  getDentistsByClinic: () => getDentistsByClinic,
  getDentistsBySpecialty: () => getDentistsBySpecialty,
  getIaConversations: () => getIaConversations,
  getImplantPlanById: () => getImplantPlanById,
  getImplantPlans: () => getImplantPlans,
  getImplantologistStats: () => getImplantologistStats,
  getInsurances: () => getInsurances,
  getLaboratories: () => getLaboratories,
  getLowStockCount: () => getLowStockCount,
  getMedicalDocumentById: () => getMedicalDocumentById,
  getMedicalDocumentByToken: () => getMedicalDocumentByToken,
  getMedicalDocumentsByClinic: () => getMedicalDocumentsByClinic,
  getMedicalDocumentsByPatient: () => getMedicalDocumentsByPatient,
  getModel3DLibraryById: () => getModel3DLibraryById,
  getModels3DLibrary: () => getModels3DLibrary,
  getMonthlyRevenue: () => getMonthlyRevenue,
  getNotificationSettings: () => getNotificationSettings,
  getOfficeById: () => getOfficeById,
  getOffices: () => getOffices,
  getOfficesByClinic: () => getOfficesByClinic,
  getOrthodonticMaintenances: () => getOrthodonticMaintenances,
  getOrthodonticTreatmentById: () => getOrthodonticTreatmentById,
  getOrthodonticTreatments: () => getOrthodonticTreatments,
  getOrthodontistStats: () => getOrthodontistStats,
  getOverdueClinics: () => getOverdueClinics,
  getPatientById: () => getPatientById,
  getPatientDocuments: () => getPatientDocuments,
  getPatientModel3DById: () => getPatientModel3DById,
  getPatientModels3D: () => getPatientModels3D,
  getPatients: () => getPatients,
  getPatientsActiveToday: () => getPatientsActiveToday,
  getPatientsCount: () => getPatientsCount,
  getPatientsWithAppointmentsToday: () => getPatientsWithAppointmentsToday,
  getPendingBudgetsCount: () => getPendingBudgetsCount,
  getPendingNotifications: () => getPendingNotifications,
  getPendingPayments: () => getPendingPayments,
  getPendingReturnAlerts: () => getPendingReturnAlerts,
  getPendingTreatmentProcedures: () => getPendingTreatmentProcedures,
  getPlanById: () => getPlanById,
  getPlanBySlug: () => getPlanBySlug,
  getPlans: () => getPlans,
  getProcedureById: () => getProcedureById,
  getProcedureCategories: () => getProcedureCategories,
  getProcedures: () => getProcedures,
  getProsthesisOrderById: () => getProsthesisOrderById,
  getProsthesisOrders: () => getProsthesisOrders,
  getProsthesisStats: () => getProsthesisStats,
  getProsthesisTypes: () => getProsthesisTypes,
  getQueueHistoryByEntry: () => getQueueHistoryByEntry,
  getQueueHistoryByPatient: () => getQueueHistoryByPatient,
  getQueueStats: () => getQueueStats,
  getRecentTvPanelCalls: () => getRecentTvPanelCalls,
  getReminderTemplates: () => getReminderTemplates,
  getReturnAlerts: () => getReturnAlerts,
  getReturnPeriodSettings: () => getReturnPeriodSettings,
  getRolePermissions: () => getRolePermissions,
  getServiceQueue: () => getServiceQueue,
  getServiceQueueEntry: () => getServiceQueueEntry,
  getServiceQueueStats: () => getServiceQueueStats,
  getSmileDesignMetrics: () => getSmileDesignMetrics,
  getSmileDesigns: () => getSmileDesigns,
  getSmileDesignsByPatient: () => getSmileDesignsByPatient,
  getSpecialties: () => getSpecialties,
  getStockCategories: () => getStockCategories,
  getStockItems: () => getStockItems,
  getStockMovements: () => getStockMovements,
  getTodayAppointmentsCount: () => getTodayAppointmentsCount,
  getTransactions: () => getTransactions,
  getTreatmentProceduresByBudget: () => getTreatmentProceduresByBudget,
  getTreatmentProceduresByPatient: () => getTreatmentProceduresByPatient,
  getTreatmentProceduresByQueueEntry: () => getTreatmentProceduresByQueueEntry,
  getTreatmentProceduresForSpecialist: () => getTreatmentProceduresForSpecialist,
  getTreatments: () => getTreatments,
  getUserAccessInfo: () => getUserAccessInfo,
  getUserByEmail: () => getUserByEmail,
  getUserById: () => getUserById,
  getUserByOpenId: () => getUserByOpenId,
  getUserClinicRole: () => getUserClinicRole,
  getUserClinics: () => getUserClinics,
  getUserPermissions: () => getUserPermissions,
  getUsersByClinicId: () => getUsersByClinicId,
  getWaitingQueue: () => getWaitingQueue,
  getWhatsappNotifications: () => getWhatsappNotifications,
  getWhatsappReminderHistory: () => getWhatsappReminderHistory,
  getWhatsappReminderStats: () => getWhatsappReminderStats,
  hashPassword: () => hashPassword,
  initializeDefaultPermissions: () => initializeDefaultPermissions,
  inviteUserToClinic: () => inviteUserToClinic,
  linkProceduresToQueueEntry: () => linkProceduresToQueueEntry,
  markDailyEarningsSummaryAsPaid: () => markDailyEarningsSummaryAsPaid,
  markMultipleProceduresCompleted: () => markMultipleProceduresCompleted,
  markSmileDesignConverted: () => markSmileDesignConverted,
  markSmileDesignShared: () => markSmileDesignShared,
  reactivateClinic: () => reactivateClinic,
  receivePayment: () => receivePayment,
  registerReturnAlertContact: () => registerReturnAlertContact,
  removeUserFromClinic: () => removeUserFromClinic,
  removeUserFromClinicById: () => removeUserFromClinicById,
  requestPayment: () => requestPayment,
  saveReturnPeriodSetting: () => saveReturnPeriodSetting,
  setUserPermission: () => setUserPermission,
  startService: () => startService,
  suspendClinic: () => suspendClinic,
  updateAccessProfile: () => updateAccessProfile,
  updateAiAnalysis: () => updateAiAnalysis,
  updateAppointment: () => updateAppointment,
  updateBudget: () => updateBudget,
  updateBudgetItem: () => updateBudgetItem,
  updateCheckin: () => updateCheckin,
  updateClinic: () => updateClinic,
  updateClinicStripeCustomer: () => updateClinicStripeCustomer,
  updateClinicSubscription: () => updateClinicSubscription,
  updateCompletedAppointmentStatus: () => updateCompletedAppointmentStatus,
  updateDentist: () => updateDentist,
  updateDentistCommission: () => updateDentistCommission,
  updateImplantPlan: () => updateImplantPlan,
  updateInsurance: () => updateInsurance,
  updateLaboratory: () => updateLaboratory,
  updateMedicalDocument: () => updateMedicalDocument,
  updateOffice: () => updateOffice,
  updateOrthodonticTreatment: () => updateOrthodonticTreatment,
  updatePatient: () => updatePatient,
  updatePatientModel3D: () => updatePatientModel3D,
  updatePlan: () => updatePlan,
  updateProcedure: () => updateProcedure,
  updateProsthesisOrder: () => updateProsthesisOrder,
  updateProsthesisType: () => updateProsthesisType,
  updateQueueStatus: () => updateQueueStatus,
  updateReminderTemplate: () => updateReminderTemplate,
  updateReturnAlertStatus: () => updateReturnAlertStatus,
  updateServiceQueueEntry: () => updateServiceQueueEntry,
  updateStockItem: () => updateStockItem,
  updateTransaction: () => updateTransaction,
  updateTreatment: () => updateTreatment,
  updateTreatmentProcedureStatus: () => updateTreatmentProcedureStatus,
  updateUser: () => updateUser,
  updateUserClinicById: () => updateUserClinicById,
  updateUserClinicRole: () => updateUserClinicRole,
  updateUserLastSignIn: () => updateUserLastSignIn,
  updateUserPassword: () => updateUserPassword,
  updateWhatsappNotification: () => updateWhatsappNotification,
  upsertAnamnesis: () => upsertAnamnesis,
  upsertClinicSettings: () => upsertClinicSettings,
  upsertNotificationSettings: () => upsertNotificationSettings,
  upsertRolePermissions: () => upsertRolePermissions,
  upsertUser: () => upsertUser,
  verifyPassword: () => verifyPassword
});
import { eq, desc, and, gte, lte, lt, sql, like, or, asc, inArray, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import bcrypt from "bcryptjs";
async function getDb() {
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
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const existingUser = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
  const isNewUser = existingUser.length === 0;
  const values = {
    openId: user.openId,
    email: user.email || `${user.openId}@manus.auth`,
    clinicId: 1
    // Associar automaticamente à clínica padrão
  };
  const updateSet = {};
  const textFields = ["name", "loginMethod"];
  textFields.forEach((field) => {
    const value = user[field];
    if (value !== void 0) {
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    }
  });
  if (user.email) {
    values.email = user.email;
    updateSet.email = user.email;
  }
  if (user.lastSignedIn !== void 0) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== void 0) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "superadmin";
    updateSet.role = "superadmin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = /* @__PURE__ */ new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  if (isNewUser) {
    const newUser = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
    if (newUser.length > 0) {
      const existingRelation = await db.select().from(userClinics).where(and(eq(userClinics.userId, newUser[0].id), eq(userClinics.clinicId, 1))).limit(1);
      if (existingRelation.length === 0) {
        await db.insert(userClinics).values({
          userId: newUser[0].id,
          clinicId: 1,
          role: user.openId === ENV.ownerOpenId ? "owner" : "admin"
        });
      }
    }
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getPatients(search, clinicId) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (clinicId) conditions.push(eq(patients.clinicId, clinicId));
  if (search) {
    conditions.push(or(
      like(patients.name, `%${search}%`),
      like(patients.cpf, `%${search}%`),
      like(patients.phone, `%${search}%`)
    ));
  }
  if (conditions.length > 0) {
    return db.select().from(patients).where(and(...conditions)).orderBy(desc(patients.createdAt));
  }
  return db.select().from(patients).orderBy(desc(patients.createdAt));
}
async function getPatientById(id, clinicId) {
  const db = await getDb();
  if (!db) return void 0;
  const conditions = [eq(patients.id, id)];
  if (clinicId) conditions.push(eq(patients.clinicId, clinicId));
  const result = await db.select().from(patients).where(and(...conditions)).limit(1);
  return result[0];
}
async function createPatient(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(patients).values({
    ...data,
    isActive: true,
    isActiveToday: true,
    activatedAt: /* @__PURE__ */ new Date()
  });
  return { id: result[0].insertId };
}
async function updatePatient(id, data, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(patients.id, id)];
  if (clinicId) conditions.push(eq(patients.clinicId, clinicId));
  await db.update(patients).set(data).where(and(...conditions));
}
async function deletePatient(id, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(patients.id, id)];
  if (clinicId) conditions.push(eq(patients.clinicId, clinicId));
  await db.delete(patients).where(and(...conditions));
}
async function getPatientsCount(clinicId) {
  const db = await getDb();
  if (!db) return 0;
  if (clinicId) {
    const result2 = await db.select({ count: sql`count(*)` }).from(patients).where(eq(patients.clinicId, clinicId));
    return result2[0]?.count ?? 0;
  }
  const result = await db.select({ count: sql`count(*)` }).from(patients);
  return result[0]?.count ?? 0;
}
async function getPatientsActiveToday(clinicId) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(patients.isActiveToday, true)];
  if (clinicId) conditions.push(eq(patients.clinicId, clinicId));
  return db.select().from(patients).where(and(...conditions)).orderBy(desc(patients.activatedAt));
}
async function getDentists(activeOnly = false, clinicId) {
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
async function getDentistById(id, clinicId) {
  const db = await getDb();
  if (!db) return void 0;
  const conditions = [eq(dentists.id, id)];
  if (clinicId) conditions.push(eq(dentists.clinicId, clinicId));
  const result = await db.select().from(dentists).where(and(...conditions)).limit(1);
  return result[0];
}
async function createDentist(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(dentists).values(data);
  return { id: result[0].insertId };
}
async function updateDentist(id, data, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(dentists.id, id)];
  if (clinicId) conditions.push(eq(dentists.clinicId, clinicId));
  await db.update(dentists).set(data).where(and(...conditions));
}
async function deleteDentist(id, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(dentists.id, id)];
  if (clinicId) conditions.push(eq(dentists.clinicId, clinicId));
  await db.delete(dentists).where(and(...conditions));
}
async function getProcedures(search, clinicId) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (clinicId) conditions.push(eq(procedures.clinicId, clinicId));
  if (search) {
    conditions.push(or(
      like(procedures.name, `%${search}%`),
      like(procedures.code, `%${search}%`)
    ));
  }
  if (conditions.length > 0) {
    return db.select().from(procedures).where(and(...conditions)).orderBy(procedures.name);
  }
  return db.select().from(procedures).orderBy(procedures.name);
}
async function getProcedureById(id, clinicId) {
  const db = await getDb();
  if (!db) return void 0;
  const conditions = [eq(procedures.id, id)];
  if (clinicId) conditions.push(eq(procedures.clinicId, clinicId));
  const result = await db.select().from(procedures).where(and(...conditions)).limit(1);
  return result[0];
}
async function createProcedure(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(procedures).values(data);
  return { id: result[0].insertId };
}
async function updateProcedure(id, data, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(procedures.id, id)];
  if (clinicId) conditions.push(eq(procedures.clinicId, clinicId));
  await db.update(procedures).set(data).where(and(...conditions));
}
async function deleteProcedure(id, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(procedures.id, id)];
  if (clinicId) conditions.push(eq(procedures.clinicId, clinicId));
  await db.delete(procedures).where(and(...conditions));
}
async function getProcedureCategories(clinicId) {
  const db = await getDb();
  if (!db) return [];
  if (clinicId) {
    return db.select().from(procedureCategories).where(eq(procedureCategories.clinicId, clinicId)).orderBy(procedureCategories.name);
  }
  return db.select().from(procedureCategories).orderBy(procedureCategories.name);
}
async function createProcedureCategory(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(procedureCategories).values(data);
  return { id: result[0].insertId };
}
async function getAppointments(startDate, endDate, dentistId, clinicId) {
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
async function getAppointmentById(id, clinicId) {
  const db = await getDb();
  if (!db) return void 0;
  const conditions = [eq(appointments.id, id)];
  if (clinicId) conditions.push(eq(appointments.clinicId, clinicId));
  const result = await db.select().from(appointments).where(and(...conditions)).limit(1);
  return result[0];
}
async function createAppointment(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(appointments).values(data);
  return { id: result[0].insertId };
}
async function updateAppointment(id, data, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(appointments.id, id)];
  if (clinicId) conditions.push(eq(appointments.clinicId, clinicId));
  await db.update(appointments).set(data).where(and(...conditions));
}
async function deleteAppointment(id, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(appointments.id, id)];
  if (clinicId) conditions.push(eq(appointments.clinicId, clinicId));
  await db.delete(appointments).where(and(...conditions));
}
async function getTodayAppointmentsCount(clinicId) {
  const db = await getDb();
  if (!db) return 0;
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const conditions = [eq(appointments.date, today)];
  if (clinicId) conditions.push(eq(appointments.clinicId, clinicId));
  const result = await db.select({ count: sql`count(*)` }).from(appointments).where(and(...conditions));
  return result[0]?.count ?? 0;
}
async function getPatientsWithAppointmentsToday(clinicId) {
  const db = await getDb();
  if (!db) return [];
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const conditions = [
    gte(appointments.date, today),
    lt(appointments.date, tomorrow)
  ];
  if (clinicId) conditions.push(eq(appointments.clinicId, clinicId));
  const todayAppointments = await db.select({
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
    dentistName: dentists.name
  }).from(appointments).innerJoin(patients, eq(appointments.patientId, patients.id)).leftJoin(dentists, eq(appointments.dentistId, dentists.id)).where(and(...conditions)).orderBy(appointments.startTime);
  return todayAppointments;
}
async function getBudgets(patientId, clinicId) {
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
async function getBudgetById(id, clinicId) {
  const db = await getDb();
  if (!db) return void 0;
  const conditions = [eq(budgets.id, id)];
  if (clinicId) conditions.push(eq(budgets.clinicId, clinicId));
  const result = await db.select().from(budgets).where(and(...conditions)).limit(1);
  return result[0];
}
async function createBudget(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(budgets).values(data);
  return { id: result[0].insertId };
}
async function updateBudget(id, data, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(budgets.id, id)];
  if (clinicId) conditions.push(eq(budgets.clinicId, clinicId));
  await db.update(budgets).set(data).where(and(...conditions));
}
async function getPendingBudgetsCount(clinicId) {
  const db = await getDb();
  if (!db) return 0;
  const conditions = [eq(budgets.status, "pending")];
  if (clinicId) conditions.push(eq(budgets.clinicId, clinicId));
  const result = await db.select({ count: sql`count(*)` }).from(budgets).where(and(...conditions));
  return result[0]?.count ?? 0;
}
async function getBudgetItems(budgetId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(budgetItems).where(eq(budgetItems.budgetId, budgetId));
}
async function createBudgetItem(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(budgetItems).values(data);
  return { id: result[0].insertId };
}
async function updateBudgetItem(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(budgetItems).set(data).where(eq(budgetItems.id, id));
  return { success: true };
}
async function getTransactions(startDate, endDate, type, clinicId) {
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
async function createTransaction(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(transactions).values(data);
  return { id: result[0].insertId };
}
async function updateTransaction(id, data, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(transactions.id, id)];
  if (clinicId) conditions.push(eq(transactions.clinicId, clinicId));
  await db.update(transactions).set(data).where(and(...conditions));
}
async function deleteTransaction(id, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(transactions.id, id)];
  if (clinicId) conditions.push(eq(transactions.clinicId, clinicId));
  await db.delete(transactions).where(and(...conditions));
}
async function getMonthlyRevenue(clinicId) {
  const db = await getDb();
  if (!db) return 0;
  const now = /* @__PURE__ */ new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const conditions = [
    eq(transactions.type, "income"),
    eq(transactions.status, "paid"),
    gte(transactions.date, firstDay),
    lte(transactions.date, lastDay)
  ];
  if (clinicId) conditions.push(eq(transactions.clinicId, clinicId));
  const result = await db.select({ total: sql`COALESCE(SUM(value), 0)` }).from(transactions).where(and(...conditions));
  return result[0]?.total ?? 0;
}
async function getInsurances(clinicId) {
  const db = await getDb();
  if (!db) return [];
  if (clinicId) {
    return db.select().from(insurances).where(eq(insurances.clinicId, clinicId)).orderBy(insurances.name);
  }
  return db.select().from(insurances).orderBy(insurances.name);
}
async function createInsurance(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(insurances).values(data);
  return { id: result[0].insertId };
}
async function updateInsurance(id, data, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(insurances.id, id)];
  if (clinicId) conditions.push(eq(insurances.clinicId, clinicId));
  await db.update(insurances).set(data).where(and(...conditions));
}
async function deleteInsurance(id, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(insurances.id, id)];
  if (clinicId) conditions.push(eq(insurances.clinicId, clinicId));
  await db.delete(insurances).where(and(...conditions));
}
async function getStockItems(search, clinicId) {
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
async function createStockItem(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(stockItems).values(data);
  return { id: result[0].insertId };
}
async function updateStockItem(id, data, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(stockItems.id, id)];
  if (clinicId) conditions.push(eq(stockItems.clinicId, clinicId));
  await db.update(stockItems).set(data).where(and(...conditions));
}
async function deleteStockItem(id, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(stockItems.id, id)];
  if (clinicId) conditions.push(eq(stockItems.clinicId, clinicId));
  await db.delete(stockItems).where(eq(stockItems.id, id));
}
async function getStockCategories(clinicId) {
  const db = await getDb();
  if (!db) return [];
  if (clinicId) {
    return db.select().from(stockCategories).where(eq(stockCategories.clinicId, clinicId)).orderBy(stockCategories.name);
  }
  return db.select().from(stockCategories).orderBy(stockCategories.name);
}
async function createStockCategory(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(stockCategories).values(data);
  return { id: result[0].insertId };
}
async function getStockMovements(stockItemId, clinicId, limit) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select({
    id: stockMovements.id,
    stockItemId: stockMovements.stockItemId,
    type: stockMovements.type,
    quantity: stockMovements.quantity,
    reason: stockMovements.reason,
    createdAt: stockMovements.createdAt,
    itemName: stockItems.name
  }).from(stockMovements).innerJoin(stockItems, eq(stockMovements.stockItemId, stockItems.id));
  const conditions = [];
  if (stockItemId) conditions.push(eq(stockMovements.stockItemId, stockItemId));
  if (clinicId) conditions.push(eq(stockItems.clinicId, clinicId));
  if (conditions.length > 0) {
    return query.where(and(...conditions)).orderBy(desc(stockMovements.createdAt)).limit(limit || 100);
  }
  return query.orderBy(desc(stockMovements.createdAt)).limit(limit || 100);
}
async function createStockMovement(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const item = await db.select().from(stockItems).where(eq(stockItems.id, data.stockItemId)).limit(1);
  if (item[0]) {
    const newQty = data.type === "in" ? (item[0].quantity ?? 0) + data.quantity : (item[0].quantity ?? 0) - data.quantity;
    await db.update(stockItems).set({ quantity: newQty }).where(eq(stockItems.id, data.stockItemId));
  }
  const result = await db.insert(stockMovements).values(data);
  return { id: result[0].insertId };
}
async function getLowStockCount(clinicId) {
  const db = await getDb();
  if (!db) return 0;
  if (clinicId) {
    const result2 = await db.select({ count: sql`count(*)` }).from(stockItems).where(and(
      eq(stockItems.clinicId, clinicId),
      sql`${stockItems.quantity} <= ${stockItems.minQuantity}`
    ));
    return result2[0]?.count ?? 0;
  }
  const result = await db.select({ count: sql`count(*)` }).from(stockItems).where(sql`${stockItems.quantity} <= ${stockItems.minQuantity}`);
  return result[0]?.count ?? 0;
}
async function getWaitingQueue(queueType, clinicId) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(waitingQueue.status, "waiting")];
  if (clinicId) conditions.push(eq(waitingQueue.clinicId, clinicId));
  if (queueType) conditions.push(eq(waitingQueue.queueType, queueType));
  return db.select().from(waitingQueue).where(and(...conditions)).orderBy(waitingQueue.arrivalTime);
}
async function addToQueue(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(waitingQueue).values(data);
  return { id: result[0].insertId };
}
async function updateQueueStatus(id, status, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = { status };
  if (status === "in_service") updateData.startTime = /* @__PURE__ */ new Date();
  if (status === "completed" || status === "cancelled") updateData.endTime = /* @__PURE__ */ new Date();
  const conditions = [eq(waitingQueue.id, id)];
  if (clinicId) conditions.push(eq(waitingQueue.clinicId, clinicId));
  await db.update(waitingQueue).set(updateData).where(and(...conditions));
}
async function getAnamnesis(patientId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(anamnesis).where(eq(anamnesis.patientId, patientId)).limit(1);
  return result[0];
}
async function upsertAnamnesis(data) {
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
async function getChairs(clinicId) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(chairs.isActive, true)];
  if (clinicId) conditions.push(eq(chairs.clinicId, clinicId));
  return db.select().from(chairs).where(and(...conditions)).orderBy(chairs.name);
}
async function createChair(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chairs).values(data);
  return { id: result[0].insertId };
}
async function getClinicSettings(clinicId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(clinicSettings).where(eq(clinicSettings.clinicId, clinicId)).limit(1);
  return result[0] || null;
}
async function upsertClinicSettings(clinicId, data) {
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
async function getTreatments(patientId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(treatments).where(eq(treatments.patientId, patientId));
}
async function createTreatment(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(treatments).values(data);
  return { id: result[0].insertId };
}
async function updateTreatment(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(treatments).set(data).where(eq(treatments.id, id));
}
async function deleteTreatment(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(treatments).where(eq(treatments.id, id));
}
async function getPatientDocuments(patientId, type) {
  const db = await getDb();
  if (!db) return [];
  if (type) {
    return db.select().from(patientDocuments).where(and(
      eq(patientDocuments.patientId, patientId),
      eq(patientDocuments.type, type)
    )).orderBy(desc(patientDocuments.createdAt));
  }
  return db.select().from(patientDocuments).where(eq(patientDocuments.patientId, patientId)).orderBy(desc(patientDocuments.createdAt));
}
async function createPatientDocument(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(patientDocuments).values(data);
  return { id: result[0].insertId };
}
async function deletePatientDocument(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(patientDocuments).where(eq(patientDocuments.id, id));
}
async function getDashboardStats(clinicId) {
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
    db.select({ count: sql`count(*)` }).from(waitingQueue).where(and(...waitingConditions))
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
async function getLaboratories(clinicId) {
  const db = await getDb();
  if (!db) return [];
  if (clinicId) {
    return db.select().from(laboratories).where(eq(laboratories.clinicId, clinicId)).orderBy(laboratories.name);
  }
  return db.select().from(laboratories).orderBy(laboratories.name);
}
async function createLaboratory(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(laboratories).values(data);
  return { id: result[0].insertId };
}
async function updateLaboratory(id, data, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(laboratories.id, id)];
  if (clinicId) conditions.push(eq(laboratories.clinicId, clinicId));
  await db.update(laboratories).set(data).where(and(...conditions));
}
async function deleteLaboratory(id, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(laboratories.id, id)];
  if (clinicId) conditions.push(eq(laboratories.clinicId, clinicId));
  await db.delete(laboratories).where(and(...conditions));
}
async function getProsthesisTypes(clinicId) {
  const db = await getDb();
  if (!db) return [];
  if (clinicId) {
    return db.select().from(prosthesisTypes).where(eq(prosthesisTypes.clinicId, clinicId)).orderBy(prosthesisTypes.name);
  }
  return db.select().from(prosthesisTypes).orderBy(prosthesisTypes.name);
}
async function createProsthesisType(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(prosthesisTypes).values(data);
  return { id: result[0].insertId };
}
async function updateProsthesisType(id, data, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(prosthesisTypes.id, id)];
  if (clinicId) conditions.push(eq(prosthesisTypes.clinicId, clinicId));
  await db.update(prosthesisTypes).set(data).where(and(...conditions));
}
async function deleteProsthesisType(id, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(prosthesisTypes.id, id)];
  if (clinicId) conditions.push(eq(prosthesisTypes.clinicId, clinicId));
  await db.delete(prosthesisTypes).where(and(...conditions));
}
async function getProsthesisOrders(status, clinicId) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (clinicId) conditions.push(eq(prosthesisOrders.clinicId, clinicId));
  if (status) conditions.push(eq(prosthesisOrders.status, status));
  if (conditions.length > 0) {
    return db.select().from(prosthesisOrders).where(and(...conditions)).orderBy(desc(prosthesisOrders.createdAt));
  }
  return db.select().from(prosthesisOrders).orderBy(desc(prosthesisOrders.createdAt));
}
async function getProsthesisOrderById(id, clinicId) {
  const db = await getDb();
  if (!db) return void 0;
  const conditions = [eq(prosthesisOrders.id, id)];
  if (clinicId) conditions.push(eq(prosthesisOrders.clinicId, clinicId));
  const result = await db.select().from(prosthesisOrders).where(and(...conditions)).limit(1);
  return result[0];
}
async function createProsthesisOrder(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(prosthesisOrders).values(data);
  return { id: result[0].insertId };
}
async function updateProsthesisOrder(id, data, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(prosthesisOrders.id, id)];
  if (clinicId) conditions.push(eq(prosthesisOrders.clinicId, clinicId));
  await db.update(prosthesisOrders).set(data).where(and(...conditions));
}
async function deleteProsthesisOrder(id, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(prosthesisOrders.id, id)];
  if (clinicId) conditions.push(eq(prosthesisOrders.clinicId, clinicId));
  await db.delete(prosthesisOrders).where(and(...conditions));
}
async function getProsthesisStats(clinicId) {
  const db = await getDb();
  if (!db) return { pending: 0, sentToLab: 0, inProduction: 0, ready: 0, delivered: 0, installed: 0, total: 0, labCost: 0, revenue: 0 };
  const clinicCondition = clinicId ? eq(prosthesisOrders.clinicId, clinicId) : void 0;
  const [pending, sentToLab, inProduction, ready, delivered, installed, costs] = await Promise.all([
    db.select({ count: sql`count(*)` }).from(prosthesisOrders).where(clinicCondition ? and(eq(prosthesisOrders.status, "pending"), clinicCondition) : eq(prosthesisOrders.status, "pending")),
    db.select({ count: sql`count(*)` }).from(prosthesisOrders).where(clinicCondition ? and(eq(prosthesisOrders.status, "sent_to_lab"), clinicCondition) : eq(prosthesisOrders.status, "sent_to_lab")),
    db.select({ count: sql`count(*)` }).from(prosthesisOrders).where(clinicCondition ? and(eq(prosthesisOrders.status, "in_production"), clinicCondition) : eq(prosthesisOrders.status, "in_production")),
    db.select({ count: sql`count(*)` }).from(prosthesisOrders).where(clinicCondition ? and(eq(prosthesisOrders.status, "ready"), clinicCondition) : eq(prosthesisOrders.status, "ready")),
    db.select({ count: sql`count(*)` }).from(prosthesisOrders).where(clinicCondition ? and(eq(prosthesisOrders.status, "delivered"), clinicCondition) : eq(prosthesisOrders.status, "delivered")),
    db.select({ count: sql`count(*)` }).from(prosthesisOrders).where(clinicCondition ? and(eq(prosthesisOrders.status, "installed"), clinicCondition) : eq(prosthesisOrders.status, "installed")),
    db.select({
      labCost: sql`COALESCE(SUM(${prosthesisOrders.labCost}), 0)`,
      revenue: sql`COALESCE(SUM(${prosthesisOrders.price}), 0)`,
      total: sql`count(*)`
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
async function getAiAnalyses(patientId, clinicId) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (clinicId) conditions.push(eq(aiAnalysis.clinicId, clinicId));
  if (patientId) conditions.push(eq(aiAnalysis.patientId, patientId));
  if (conditions.length > 0) {
    return db.select().from(aiAnalysis).where(and(...conditions)).orderBy(desc(aiAnalysis.createdAt));
  }
  return db.select().from(aiAnalysis).orderBy(desc(aiAnalysis.createdAt));
}
async function createAiAnalysis(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(aiAnalysis).values(data);
  return { id: result[0].insertId };
}
async function getAiAnalysisByImageHash(imageHash, clinicId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(aiAnalysis).where(and(
    eq(aiAnalysis.imageHash, imageHash),
    eq(aiAnalysis.clinicId, clinicId),
    // Retornar apenas análises completas (com findings)
    sql`${aiAnalysis.findings} IS NOT NULL`
  )).orderBy(desc(aiAnalysis.analyzedAt)).limit(1);
  return result[0] || null;
}
async function updateAiAnalysis(id, data, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(aiAnalysis.id, id)];
  if (clinicId) conditions.push(eq(aiAnalysis.clinicId, clinicId));
  await db.update(aiAnalysis).set(data).where(and(...conditions));
}
async function getCheckins(status, clinicId) {
  const db = await getDb();
  if (!db) return [];
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const conditions = [gte(checkins.checkinTime, today)];
  if (clinicId) conditions.push(eq(checkins.clinicId, clinicId));
  if (status) conditions.push(eq(checkins.status, status));
  return db.select().from(checkins).where(and(...conditions)).orderBy(checkins.checkinTime);
}
async function createCheckin(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!data.patientId && data.patientName && data.phone) {
    const [existingPatient] = await db.select().from(patients).where(and(
      eq(patients.phone, data.phone),
      eq(patients.clinicId, data.clinicId)
    )).limit(1);
    if (existingPatient) {
      data.patientId = existingPatient.id;
    } else {
      const newPatient = await db.insert(patients).values({
        name: data.patientName,
        phone: data.phone,
        clinicId: data.clinicId,
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      });
      data.patientId = newPatient[0].insertId;
    }
  }
  const result = await db.insert(checkins).values(data);
  return { id: result[0].insertId };
}
async function updateCheckin(id, data, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(checkins.id, id)];
  if (clinicId) conditions.push(eq(checkins.clinicId, clinicId));
  await db.update(checkins).set(data).where(and(...conditions));
}
async function getCheckinQueuePosition(id) {
  const db = await getDb();
  if (!db) return { position: 0, status: "waiting" };
  const [checkin] = await db.select().from(checkins).where(eq(checkins.id, id)).limit(1);
  if (!checkin) return { position: 0, status: "waiting" };
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const waitingBefore = await db.select({ count: sql`count(*)` }).from(checkins).where(and(
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
    patientName: checkin.patientName
  };
}
async function getAdvancedDashboardStats(days = 30, clinicId) {
  const db = await getDb();
  if (!db) return {
    budgetEvolution: [],
    paymentMethods: [],
    conversionRate: { approved: 0, rejected: 0, pending: 0 },
    monthlyPerformance: []
  };
  const startDate = /* @__PURE__ */ new Date();
  startDate.setDate(startDate.getDate() - days);
  const clinicFilter = clinicId ? sql` AND clinicId = ${clinicId}` : sql``;
  const budgetEvolutionResult = await db.execute(
    sql`SELECT DATE(createdAt) as date, COUNT(*) as count, COALESCE(SUM(finalValue), 0) as total 
        FROM budgets 
        WHERE createdAt >= ${startDate}${clinicFilter}
        GROUP BY DATE(createdAt) 
        ORDER BY DATE(createdAt)`
  );
  const budgetEvolution = budgetEvolutionResult[0];
  const transactionConditions = [
    eq(transactions.type, "income"),
    gte(transactions.date, startDate)
  ];
  if (clinicId) transactionConditions.push(eq(transactions.clinicId, clinicId));
  const paymentMethods = await db.select({
    method: transactions.paymentMethod,
    count: sql`COUNT(*)`,
    total: sql`COALESCE(SUM(${transactions.value}), 0)`
  }).from(transactions).where(and(...transactionConditions)).groupBy(transactions.paymentMethod);
  const budgetConditions = [gte(budgets.createdAt, startDate)];
  if (clinicId) budgetConditions.push(eq(budgets.clinicId, clinicId));
  const conversionRate = await db.select({
    status: budgets.status,
    count: sql`COUNT(*)`
  }).from(budgets).where(and(...budgetConditions)).groupBy(budgets.status);
  const conversion = {
    approved: 0,
    rejected: 0,
    pending: 0
  };
  conversionRate.forEach((item) => {
    if (item.status === "approved" || item.status === "completed" || item.status === "in_progress") {
      conversion.approved += item.count;
    } else if (item.status === "rejected") {
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
async function getQueueStats(clinicId) {
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
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const budgetCond = clinicId ? and(eq(waitingQueue.queueType, "budget"), eq(waitingQueue.status, "waiting"), eq(waitingQueue.clinicId, clinicId)) : and(eq(waitingQueue.queueType, "budget"), eq(waitingQueue.status, "waiting"));
  const dentistCond = clinicId ? and(eq(waitingQueue.queueType, "dentist"), eq(waitingQueue.status, "waiting"), eq(waitingQueue.clinicId, clinicId)) : and(eq(waitingQueue.queueType, "dentist"), eq(waitingQueue.status, "waiting"));
  const orthoCond = clinicId ? and(eq(waitingQueue.queueType, "orthodontics"), eq(waitingQueue.status, "waiting"), eq(waitingQueue.clinicId, clinicId)) : and(eq(waitingQueue.queueType, "orthodontics"), eq(waitingQueue.status, "waiting"));
  const implantCond = clinicId ? and(eq(waitingQueue.queueType, "implant"), eq(waitingQueue.status, "waiting"), eq(waitingQueue.clinicId, clinicId)) : and(eq(waitingQueue.queueType, "implant"), eq(waitingQueue.status, "waiting"));
  const prosthCond = clinicId ? and(eq(waitingQueue.queueType, "prosthetics"), eq(waitingQueue.status, "waiting"), eq(waitingQueue.clinicId, clinicId)) : and(eq(waitingQueue.queueType, "prosthetics"), eq(waitingQueue.status, "waiting"));
  const inServiceCond = clinicId ? and(eq(waitingQueue.status, "in_service"), eq(waitingQueue.clinicId, clinicId)) : eq(waitingQueue.status, "in_service");
  const completedCond = clinicId ? and(eq(waitingQueue.status, "completed"), gte(waitingQueue.createdAt, today), eq(waitingQueue.clinicId, clinicId)) : and(eq(waitingQueue.status, "completed"), gte(waitingQueue.createdAt, today));
  const [budgetQ, dentistQ, orthoQ, implantQ, prosthQ, inService, completed] = await Promise.all([
    db.select({ count: sql`count(*)` }).from(waitingQueue).where(budgetCond),
    db.select({ count: sql`count(*)` }).from(waitingQueue).where(dentistCond),
    db.select({ count: sql`count(*)` }).from(waitingQueue).where(orthoCond),
    db.select({ count: sql`count(*)` }).from(waitingQueue).where(implantCond),
    db.select({ count: sql`count(*)` }).from(waitingQueue).where(prosthCond),
    db.select({ count: sql`count(*)` }).from(waitingQueue).where(inServiceCond),
    db.select({ count: sql`count(*)` }).from(waitingQueue).where(completedCond)
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
async function createWhatsappNotification(data) {
  const db = await getDb();
  if (!db) return { id: 0 };
  const result = await db.insert(whatsappNotifications).values(data);
  return { id: result[0].insertId };
}
async function getWhatsappNotifications(filters) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(whatsappNotifications);
  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(whatsappNotifications.status, filters.status));
  }
  if (filters?.type) {
    conditions.push(eq(whatsappNotifications.type, filters.type));
  }
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  return query.orderBy(desc(whatsappNotifications.createdAt)).limit(100);
}
async function updateWhatsappNotification(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(whatsappNotifications).set(data).where(eq(whatsappNotifications.id, id));
}
async function getPendingNotifications() {
  const db = await getDb();
  if (!db) return [];
  const now = /* @__PURE__ */ new Date();
  return db.select().from(whatsappNotifications).where(and(
    eq(whatsappNotifications.status, "pending"),
    or(
      sql`${whatsappNotifications.scheduledFor} IS NULL`,
      lte(whatsappNotifications.scheduledFor, now)
    )
  )).orderBy(whatsappNotifications.createdAt);
}
async function getNotificationSettings() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(notificationSettings).limit(1);
  return result[0] || null;
}
async function upsertNotificationSettings(data) {
  const db = await getDb();
  if (!db) return;
  const existing = await getNotificationSettings();
  if (existing) {
    await db.update(notificationSettings).set(data).where(eq(notificationSettings.id, existing.id));
  } else {
    await db.insert(notificationSettings).values(data);
  }
}
async function createOrthodonticTreatment(data) {
  const db = await getDb();
  if (!db) return { id: 0 };
  const result = await db.insert(orthodonticTreatments).values(data);
  return { id: result[0].insertId };
}
async function getOrthodonticTreatments(filters) {
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
    conditions.push(eq(orthodonticTreatments.status, filters.status));
  }
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  return query.orderBy(desc(orthodonticTreatments.createdAt));
}
async function getOrthodonticTreatmentById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(orthodonticTreatments).where(eq(orthodonticTreatments.id, id)).limit(1);
  return result[0] || null;
}
async function updateOrthodonticTreatment(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(orthodonticTreatments).set(data).where(eq(orthodonticTreatments.id, id));
}
async function createOrthodonticMaintenance(data) {
  const db = await getDb();
  if (!db) return { id: 0 };
  const result = await db.insert(orthodonticMaintenances).values(data);
  return { id: result[0].insertId };
}
async function getOrthodonticMaintenances(treatmentId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orthodonticMaintenances).where(eq(orthodonticMaintenances.treatmentId, treatmentId)).orderBy(desc(orthodonticMaintenances.date));
}
async function createImplantPlan(data) {
  const db = await getDb();
  if (!db) return { id: 0 };
  const result = await db.insert(implantPlans).values(data);
  return { id: result[0].insertId };
}
async function getImplantPlans(filters) {
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
    conditions.push(eq(implantPlans.status, filters.status));
  }
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  return query.orderBy(desc(implantPlans.createdAt));
}
async function getImplantPlanById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(implantPlans).where(eq(implantPlans.id, id)).limit(1);
  return result[0] || null;
}
async function updateImplantPlan(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(implantPlans).set(data).where(eq(implantPlans.id, id));
}
async function getUserPermissions(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userPermissions).where(eq(userPermissions.userId, userId));
}
async function setUserPermission(data) {
  const db = await getDb();
  if (!db) return { id: 0 };
  const existing = await db.select().from(userPermissions).where(and(
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
async function deleteUserPermissions(userId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(userPermissions).where(eq(userPermissions.userId, userId));
}
async function getAccessProfiles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(accessProfiles).orderBy(accessProfiles.name);
}
async function createAccessProfile(data) {
  const db = await getDb();
  if (!db) return { id: 0 };
  const result = await db.insert(accessProfiles).values(data);
  return { id: result[0].insertId };
}
async function updateAccessProfile(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(accessProfiles).set(data).where(eq(accessProfiles.id, id));
}
async function deleteAccessProfile(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(accessProfiles).where(eq(accessProfiles.id, id));
}
async function getDentistAreaStats(dentistId) {
  const db = await getDb();
  if (!db) return {
    todayAppointments: [],
    pendingTreatments: 0,
    monthlyPatients: 0,
    pendingBudgets: 0
  };
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const [todayAppts, pendingTreatments, monthlyPatients, pendingBudgets] = await Promise.all([
    db.select().from(appointments).where(and(
      eq(appointments.dentistId, dentistId),
      gte(appointments.date, today),
      lte(appointments.date, tomorrow)
    )).orderBy(appointments.startTime),
    db.select({ count: sql`count(*)` }).from(budgetItems).where(and(
      eq(budgetItems.status, "in_progress")
    )),
    db.select({ count: sql`count(distinct patientId)` }).from(appointments).where(and(
      eq(appointments.dentistId, dentistId),
      gte(appointments.date, monthStart)
    )),
    db.select({ count: sql`count(*)` }).from(budgets).where(and(
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
async function getOrthodontistStats(dentistId) {
  const db = await getDb();
  if (!db) return {
    activeTreatments: 0,
    completedTreatments: 0,
    pendingMaintenances: 0,
    totalPatients: 0
  };
  const conditions = dentistId ? [eq(orthodonticTreatments.dentistId, dentistId)] : [];
  const [active, completed, patients2] = await Promise.all([
    db.select({ count: sql`count(*)` }).from(orthodonticTreatments).where(conditions.length > 0 ? and(eq(orthodonticTreatments.status, "active"), ...conditions) : eq(orthodonticTreatments.status, "active")),
    db.select({ count: sql`count(*)` }).from(orthodonticTreatments).where(conditions.length > 0 ? and(eq(orthodonticTreatments.status, "completed"), ...conditions) : eq(orthodonticTreatments.status, "completed")),
    db.select({ count: sql`count(distinct patientId)` }).from(orthodonticTreatments).where(conditions.length > 0 ? and(...conditions) : void 0)
  ]);
  return {
    activeTreatments: active[0]?.count ?? 0,
    completedTreatments: completed[0]?.count ?? 0,
    pendingMaintenances: 0,
    totalPatients: patients2[0]?.count ?? 0
  };
}
async function getImplantologistStats(dentistId) {
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
    count: sql`count(*)`
  }).from(implantPlans).where(conditions.length > 0 ? and(...conditions) : void 0).groupBy(implantPlans.status);
  const result = {
    planningPhase: 0,
    surgeryScheduled: 0,
    healingPhase: 0,
    prosthesisPhase: 0,
    completed: 0,
    totalImplants: 0
  };
  stats.forEach((s) => {
    if (s.status === "planning") result.planningPhase = s.count;
    if (s.status === "surgery_scheduled") result.surgeryScheduled = s.count;
    if (s.status === "healing") result.healingPhase = s.count;
    if (s.status === "prosthesis_phase") result.prosthesisPhase = s.count;
    if (s.status === "completed") result.completed = s.count;
    result.totalImplants += s.count;
  });
  return result;
}
async function getOffices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(offices).orderBy(offices.name);
}
async function getOfficesByClinic(clinicId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(offices).where(eq(offices.clinicId, clinicId)).orderBy(offices.name);
}
async function getActiveOffices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(offices).where(eq(offices.isActive, true)).orderBy(offices.name);
}
async function getActiveOfficesByClinic(clinicId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(offices).where(and(eq(offices.clinicId, clinicId), eq(offices.isActive, true))).orderBy(offices.name);
}
async function getOfficeById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(offices).where(eq(offices.id, id)).limit(1);
  return result[0];
}
async function createOffice(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(offices).values(data);
  return { id: result[0].insertId };
}
async function updateOffice(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(offices).set(data).where(eq(offices.id, id));
  return { success: true };
}
async function deleteOffice(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(offices).where(eq(offices.id, id));
  return { success: true };
}
async function getServiceQueue(queueType, clinicId) {
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
    conditions.push(eq(serviceQueue.queueType, queueType));
    return db.select().from(serviceQueue).where(and(...conditions)).orderBy(serviceQueue.arrivalTime);
  }
  return db.select().from(serviceQueue).where(and(...conditions)).orderBy(serviceQueue.arrivalTime);
}
async function getServiceQueueEntry(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(serviceQueue).where(eq(serviceQueue.id, id)).limit(1);
  return result[0];
}
async function addToServiceQueue(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(serviceQueue).values(data);
  await db.insert(queueHistory).values({
    queueEntryId: result[0].insertId,
    patientId: data.patientId,
    action: "added",
    toQueue: data.queueType,
    notes: data.notes
  });
  return { id: result[0].insertId };
}
async function updateServiceQueueEntry(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(serviceQueue).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(serviceQueue.id, id));
  return { success: true };
}
async function callPatientFromQueue(id, officeId, officeName, professionalId, professionalName) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const entry = await getServiceQueueEntry(id);
  if (!entry) throw new Error("Queue entry not found");
  await db.update(serviceQueue).set({
    status: "called",
    officeId,
    officeName,
    professionalId,
    professionalName,
    calledTime: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(serviceQueue.id, id));
  await db.insert(queueHistory).values({
    queueEntryId: id,
    patientId: entry.patientId,
    action: "called",
    fromQueue: entry.queueType,
    officeId,
    officeName,
    professionalId,
    professionalName
  });
  await db.insert(tvPanelCalls).values({
    queueEntryId: id,
    patientName: entry.patientName,
    officeName,
    officeNumber: officeName,
    professionalName,
    queueType: entry.queueType,
    isActive: true,
    expiresAt: new Date(Date.now() + 5 * 60 * 1e3)
    // Expira em 5 minutos
  });
  return { success: true };
}
async function startService(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const entry = await getServiceQueueEntry(id);
  if (!entry) throw new Error("Queue entry not found");
  await db.update(serviceQueue).set({
    status: "in_service",
    serviceStartTime: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(serviceQueue.id, id));
  await db.update(tvPanelCalls).set({ isActive: false }).where(eq(tvPanelCalls.queueEntryId, id));
  await db.insert(queueHistory).values({
    queueEntryId: id,
    patientId: entry.patientId,
    action: "started",
    fromQueue: entry.queueType,
    officeId: entry.officeId,
    officeName: entry.officeName,
    professionalId: entry.professionalId,
    professionalName: entry.professionalName
  });
  return { success: true };
}
async function finishServiceAndForward(id, nextQueue, notes, evaluationNotes, amountToPay, professionalId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const entry = await getServiceQueueEntry(id);
  if (!entry) throw new Error("Queue entry not found");
  await db.update(serviceQueue).set({
    status: "forwarded",
    serviceEndTime: /* @__PURE__ */ new Date(),
    nextQueue,
    notes: notes || entry.notes,
    evaluationNotes,
    amountToPay: amountToPay ? amountToPay.toString() : entry.amountToPay,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(serviceQueue.id, id));
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
    notes
  });
  const newEntry = await db.insert(serviceQueue).values({
    clinicId: entry.clinicId,
    patientId: entry.patientId,
    patientName: entry.patientName,
    queueType: nextQueue,
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
    professionalId: professionalId || void 0
  });
  await db.insert(queueHistory).values({
    queueEntryId: newEntry[0].insertId,
    patientId: entry.patientId,
    action: "added",
    fromQueue: entry.queueType,
    toQueue: nextQueue,
    notes: `Encaminhado de ${entry.queueType}`
  });
  return { success: true, newEntryId: newEntry[0].insertId };
}
async function requestPayment(id, amountToPay, evaluationNotes) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const entry = await getServiceQueueEntry(id);
  if (!entry) throw new Error("Queue entry not found");
  await db.update(serviceQueue).set({
    status: "pending_payment",
    amountToPay: amountToPay.toString(),
    evaluationNotes,
    serviceEndTime: /* @__PURE__ */ new Date(),
    nextQueue: "reception",
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(serviceQueue.id, id));
  await db.insert(queueHistory).values({
    queueEntryId: id,
    patientId: entry.patientId,
    action: "payment_requested",
    fromQueue: entry.queueType,
    toQueue: "reception",
    professionalId: entry.professionalId,
    professionalName: entry.professionalName,
    notes: `Valor: R$ ${amountToPay.toFixed(2)}`
  });
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
    notes: entry.notes
  });
  return { success: true, newEntryId: newEntry[0].insertId };
}
async function receivePayment(id, amountPaid, paymentMethod) {
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
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(serviceQueue.id, id));
  await db.insert(queueHistory).values({
    queueEntryId: id,
    patientId: entry.patientId,
    action: "payment_received",
    notes: `Valor: R$ ${amountPaid.toFixed(2)} - ${paymentMethod}`
  });
  return { success: true, paymentStatus };
}
async function completeService(id, notes, contextClinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const entry = await getServiceQueueEntry(id);
  if (!entry) throw new Error("Queue entry not found");
  await db.update(serviceQueue).set({
    status: "completed",
    serviceEndTime: /* @__PURE__ */ new Date(),
    notes: notes || entry.notes,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(serviceQueue.id, id));
  await db.update(tvPanelCalls).set({ isActive: false }).where(eq(tvPanelCalls.queueEntryId, id));
  await db.insert(queueHistory).values({
    queueEntryId: id,
    patientId: entry.patientId,
    action: "completed",
    fromQueue: entry.queueType,
    officeId: entry.officeId,
    officeName: entry.officeName,
    professionalId: entry.professionalId,
    professionalName: entry.professionalName,
    notes
  });
  const amountToPay = Number(entry.amountToPay) || 0;
  const professionalIdNum = Number(entry.professionalId) || 0;
  const clinicIdNum = Number(entry.clinicId) || contextClinicId || 0;
  if (amountToPay && amountToPay > 0 && professionalIdNum > 0 && clinicIdNum > 0) {
    try {
      const commissions = await getDentistCommissions(clinicIdNum, professionalIdNum);
      const commission = commissions[0];
      const commissionPercentage = commission ? Number(commission.commissionPercentage) : 0;
      const commissionAmount = amountToPay * commissionPercentage / 100;
      await createCompletedAppointment({
        clinicId: clinicIdNum,
        dentistId: professionalIdNum,
        patientId: entry.patientId,
        procedureId: 0,
        procedureName: entry.queueType || "Atendimento",
        procedurePrice: amountToPay.toString(),
        commissionPercentage: commissionPercentage.toString(),
        commissionAmount: commissionAmount.toString(),
        completedAt: /* @__PURE__ */ new Date(),
        paymentStatus: "pending"
      });
      const today = /* @__PURE__ */ new Date();
      const dateStr = today.toISOString().split("T")[0];
      await createOrUpdateDailyEarningsSummary(clinicIdNum, professionalIdNum, dateStr);
    } catch (error) {
      console.error("[completeService] Erro ao registrar no Mapa de Ganho:", error);
      if (error instanceof Error) {
        console.error("[completeService] Stack:", error.stack);
        console.error("[completeService] Message:", error.message);
      }
    }
  }
  return { success: true };
}
async function cancelServiceQueueEntry(id, reason) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const entry = await getServiceQueueEntry(id);
  if (!entry) throw new Error("Queue entry not found");
  await db.update(serviceQueue).set({
    status: "completed",
    serviceEndTime: /* @__PURE__ */ new Date(),
    notes: reason ? `CANCELADO: ${reason}` : "CANCELADO pelo or\xE7amentista",
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(serviceQueue.id, id));
  await db.update(tvPanelCalls).set({ isActive: false }).where(eq(tvPanelCalls.queueEntryId, id));
  await db.insert(queueHistory).values({
    queueEntryId: id,
    patientId: entry.patientId,
    action: "cancelled",
    fromQueue: entry.queueType,
    officeId: entry.officeId,
    officeName: entry.officeName,
    professionalId: entry.professionalId,
    professionalName: entry.professionalName,
    notes: reason || "Cancelado pelo or\xE7amentista"
  });
  return { success: true };
}
async function getServiceQueueStats(clinicId) {
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
    total: 0
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
    count: sql`count(*)`
  }).from(serviceQueue).where(and(...conditions)).groupBy(serviceQueue.queueType);
  const stats = {
    reception: 0,
    budget: 0,
    dentist: 0,
    orthodontics: 0,
    implant: 0,
    prosthetics: 0,
    maxillofacial: 0,
    pediatric: 0,
    total: 0
  };
  result.forEach((r) => {
    const key = r.queueType;
    if (key in stats) {
      stats[key] = Number(r.count);
      stats.total += Number(r.count);
    }
  });
  return stats;
}
async function getActiveTvPanelCalls() {
  const db = await getDb();
  if (!db) return [];
  await db.update(tvPanelCalls).set({ isActive: false }).where(and(
    eq(tvPanelCalls.isActive, true),
    lte(tvPanelCalls.expiresAt, /* @__PURE__ */ new Date())
  ));
  return db.select().from(tvPanelCalls).where(eq(tvPanelCalls.isActive, true)).orderBy(desc(tvPanelCalls.calledAt)).limit(10);
}
async function getRecentTvPanelCalls() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tvPanelCalls).orderBy(desc(tvPanelCalls.calledAt)).limit(20);
}
async function getQueueHistoryByPatient(patientId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(queueHistory).where(eq(queueHistory.patientId, patientId)).orderBy(desc(queueHistory.createdAt));
}
async function getQueueHistoryByEntry(queueEntryId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(queueHistory).where(eq(queueHistory.queueEntryId, queueEntryId)).orderBy(queueHistory.createdAt);
}
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
async function getUserByEmail(email) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createUserWithPassword(data) {
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
    lastSignedIn: /* @__PURE__ */ new Date()
  });
  return { id: result[0].insertId };
}
async function updateUserPassword(userId, newPassword) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}
async function updateUserLastSignIn(userId) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: /* @__PURE__ */ new Date() }).where(eq(users.id, userId));
}
async function getClinics() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clinics).orderBy(desc(clinics.createdAt));
}
async function getClinicById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(clinics).where(eq(clinics.id, id)).limit(1);
  return result[0];
}
async function getClinicBySlug(slug) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(clinics).where(eq(clinics.slug, slug)).limit(1);
  return result[0];
}
async function createClinic(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clinics).values(data);
  return { id: result[0].insertId };
}
async function updateClinic(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clinics).set(data).where(eq(clinics.id, id));
}
async function deleteClinic(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clinics).where(eq(clinics.id, id));
}
async function getClinicsCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql`count(*)` }).from(clinics);
  return result[0]?.count ?? 0;
}
async function getUserClinics(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    userClinic: userClinics,
    clinic: clinics
  }).from(userClinics).innerJoin(clinics, eq(userClinics.clinicId, clinics.id)).where(eq(userClinics.userId, userId));
}
async function getClinicUsers(clinicId) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    userClinic: userClinics,
    user: users
  }).from(userClinics).innerJoin(users, eq(userClinics.userId, users.id)).where(eq(userClinics.clinicId, clinicId));
}
async function addUserToClinic(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(userClinics).values(data);
  return { id: result[0].insertId };
}
async function removeUserFromClinic(userId, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userClinics).where(and(eq(userClinics.userId, userId), eq(userClinics.clinicId, clinicId)));
}
async function updateUserClinicRole(userId, clinicId, role) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(userClinics).set({ role }).where(and(eq(userClinics.userId, userId), eq(userClinics.clinicId, clinicId)));
}
async function getUserClinicRole(userId, clinicId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(userClinics).where(and(eq(userClinics.userId, userId), eq(userClinics.clinicId, clinicId))).limit(1);
  return result[0];
}
async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}
async function getUsersByClinicId(clinicId) {
  const db = await getDb();
  if (!db) return [];
  const usersFromUserClinics = await db.select({
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
    clinicRole: userClinics.role
  }).from(users).innerJoin(userClinics, eq(users.id, userClinics.userId)).where(eq(userClinics.clinicId, clinicId)).orderBy(desc(users.createdAt));
  const usersFromClinicId = await db.select().from(users).where(eq(users.clinicId, clinicId)).orderBy(desc(users.createdAt));
  const allUserIds = /* @__PURE__ */ new Set();
  const combinedUsers = [];
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
async function getUserById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}
async function updateUser(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(data).where(eq(users.id, id));
}
async function deleteUser(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userClinics).where(eq(userClinics.userId, id));
  await db.delete(users).where(eq(users.id, id));
}
async function inviteUserToClinic(email, clinicId, role) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let user = await getUserByEmail(email);
  if (!user) {
    const result = await db.insert(users).values({
      email,
      name: email.split("@")[0],
      // Nome temporário baseado no email
      role: "user",
      isActive: true
    });
    user = await getUserById(result[0].insertId);
  }
  if (!user) throw new Error("Failed to create user");
  const existingLink = await db.select().from(userClinics).where(and(eq(userClinics.userId, user.id), eq(userClinics.clinicId, clinicId))).limit(1);
  if (existingLink.length > 0) {
    await db.update(userClinics).set({ role, isActive: true }).where(and(eq(userClinics.userId, user.id), eq(userClinics.clinicId, clinicId)));
    return { userId: user.id, action: "updated" };
  }
  await db.insert(userClinics).values({
    userId: user.id,
    clinicId,
    role,
    isActive: true
  });
  return { userId: user.id, action: "created" };
}
async function getClinicUsersWithDetails(clinicId) {
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
    lastSignedIn: users.lastSignedIn
  }).from(userClinics).innerJoin(users, eq(userClinics.userId, users.id)).where(eq(userClinics.clinicId, clinicId)).orderBy(userClinics.role, users.name);
}
async function removeUserFromClinicById(userClinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userClinics).where(eq(userClinics.id, userClinicId));
}
async function updateUserClinicById(userClinicId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(userClinics).set(data).where(eq(userClinics.id, userClinicId));
}
async function getRolePermissions(role) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(rolePermissions).where(eq(rolePermissions.role, role)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAllRolePermissions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rolePermissions);
}
async function upsertRolePermissions(role, permissions) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getRolePermissions(role);
  if (existing) {
    await db.update(rolePermissions).set(permissions).where(eq(rolePermissions.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(rolePermissions).values({ ...permissions, role });
    return result[0]?.insertId || 0;
  }
}
async function initializeDefaultPermissions() {
  const db = await getDb();
  if (!db) return;
  const defaultPermissions = {
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
      canViewAdmin: true
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
      canViewAdmin: false
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
      canViewAdmin: false
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
      canViewAdmin: false
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
      canViewAdmin: false
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
      canViewAdmin: false
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
      canViewAdmin: false
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
      canViewAdmin: false
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
      canViewAdmin: false
    }
  };
  for (const [role, permissions] of Object.entries(defaultPermissions)) {
    const existing = await getRolePermissions(role);
    if (!existing) {
      await db.insert(rolePermissions).values({ ...permissions, role });
    }
  }
}
async function getPlans(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(plans).where(eq(plans.isActive, true)).orderBy(asc(plans.sortOrder));
  }
  return db.select().from(plans).orderBy(asc(plans.sortOrder));
}
async function getPlanById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
  return result[0];
}
async function getPlanBySlug(slug) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(plans).where(eq(plans.slug, slug)).limit(1);
  return result[0];
}
async function createPlan(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(plans).values(data);
  return { id: result[0].insertId };
}
async function updatePlan(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(plans).set(data).where(eq(plans.id, id));
}
async function deletePlan(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(plans).where(eq(plans.id, id));
}
async function updateClinicSubscription(clinicId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clinics).set(data).where(eq(clinics.id, clinicId));
}
async function updateClinicStripeCustomer(clinicId, stripeCustomerId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clinics).set({ stripeCustomerId }).where(eq(clinics.id, clinicId));
}
async function getClinicsWithSubscriptionStatus() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    clinic: clinics,
    plan: plans
  }).from(clinics).leftJoin(plans, eq(clinics.planId, plans.id)).orderBy(desc(clinics.createdAt));
  return result.map((r) => ({
    ...r.clinic,
    plan: r.plan
  }));
}
async function getClinicSubscriptionStats() {
  const db = await getDb();
  if (!db) return {
    total: 0,
    trial: 0,
    active: 0,
    pastDue: 0,
    canceled: 0,
    suspended: 0,
    monthlyRevenue: 0
  };
  const allClinics = await db.select().from(clinics);
  const allPlans = await db.select().from(plans);
  const planMap = new Map(allPlans.map((p) => [p.id, p]));
  let monthlyRevenue = 0;
  const stats = {
    total: allClinics.length,
    trial: 0,
    active: 0,
    pastDue: 0,
    canceled: 0,
    suspended: 0,
    monthlyRevenue: 0
  };
  for (const clinic of allClinics) {
    switch (clinic.subscriptionStatus) {
      case "trial":
        stats.trial++;
        break;
      case "active":
        stats.active++;
        if (clinic.planId) {
          const plan = planMap.get(clinic.planId);
          if (plan) {
            monthlyRevenue += Number(plan.price);
          }
        }
        break;
      case "past_due":
        stats.pastDue++;
        break;
      case "canceled":
        stats.canceled++;
        break;
      case "suspended":
        stats.suspended++;
        break;
    }
  }
  stats.monthlyRevenue = monthlyRevenue;
  return stats;
}
async function suspendClinic(clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clinics).set({
    subscriptionStatus: "suspended",
    isActive: false
  }).where(eq(clinics.id, clinicId));
}
async function reactivateClinic(clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clinics).set({
    subscriptionStatus: "active",
    isActive: true
  }).where(eq(clinics.id, clinicId));
}
async function getOverdueClinics() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clinics).where(eq(clinics.subscriptionStatus, "past_due"));
}
async function checkClinicAccess(clinicId) {
  const db = await getDb();
  if (!db) return { canAccess: false, reason: "Database not available" };
  const result = await db.select().from(clinics).where(eq(clinics.id, clinicId)).limit(1);
  const clinic = result[0];
  if (!clinic) {
    return { canAccess: false, reason: "Cl\xEDnica n\xE3o encontrada" };
  }
  const blockedStatuses = ["past_due", "canceled", "suspended"];
  if (blockedStatuses.includes(clinic.subscriptionStatus)) {
    const statusMessages = {
      past_due: "Sua assinatura est\xE1 inadimplente. Por favor, regularize o pagamento para continuar usando o sistema.",
      canceled: "Sua assinatura foi cancelada. Entre em contato com o suporte para reativ\xE1-la.",
      suspended: "Sua conta foi suspensa. Entre em contato com o suporte para mais informa\xE7\xF5es."
    };
    return {
      canAccess: false,
      reason: statusMessages[clinic.subscriptionStatus] || "Acesso bloqueado",
      clinic
    };
  }
  if (!clinic.isActive) {
    return { canAccess: false, reason: "Cl\xEDnica desativada", clinic };
  }
  if (clinic.subscriptionStatus === "trial" && clinic.trialEndsAt) {
    if (new Date(clinic.trialEndsAt) < /* @__PURE__ */ new Date()) {
      return {
        canAccess: false,
        reason: "Seu per\xEDodo de teste expirou. Por favor, escolha um plano para continuar usando o sistema.",
        clinic
      };
    }
  }
  return { canAccess: true, clinic };
}
async function getUserAccessInfo(userId) {
  const db = await getDb();
  if (!db) return { canAccess: false, reason: "Database not available" };
  const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = userResult[0];
  if (!user) {
    return { canAccess: false, reason: "Usu\xE1rio n\xE3o encontrado" };
  }
  if (user.role === "superadmin") {
    return { canAccess: true };
  }
  if (!user.clinicId) {
    return { canAccess: false, reason: "Usu\xE1rio n\xE3o est\xE1 associado a nenhuma cl\xEDnica" };
  }
  const clinicAccess = await checkClinicAccess(user.clinicId);
  if (!clinicAccess.canAccess) {
    return clinicAccess;
  }
  const ucResult = await db.select().from(userClinics).where(and(
    eq(userClinics.userId, userId),
    eq(userClinics.clinicId, user.clinicId)
  )).limit(1);
  return {
    canAccess: true,
    clinic: clinicAccess.clinic,
    userClinic: ucResult[0]
  };
}
async function getIaConversations(clinicId, userId, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(iaConversations).where(and(
    eq(iaConversations.clinicId, clinicId),
    eq(iaConversations.userId, userId)
  )).orderBy(asc(iaConversations.createdAt)).limit(limit);
  return result;
}
async function addIaConversation(data) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(iaConversations).values(data);
  return result;
}
async function clearIaConversations(clinicId, userId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(iaConversations).where(and(
    eq(iaConversations.clinicId, clinicId),
    eq(iaConversations.userId, userId)
  ));
}
async function createSmileDesign(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(smileDesigns).values(data);
  return { id: Number(result[0].insertId) };
}
async function getSmileDesigns(clinicId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(smileDesigns).where(eq(smileDesigns.clinicId, clinicId)).orderBy(desc(smileDesigns.createdAt));
}
async function getSmileDesignsByPatient(clinicId, patientId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(smileDesigns).where(and(
    eq(smileDesigns.clinicId, clinicId),
    eq(smileDesigns.patientId, patientId)
  )).orderBy(desc(smileDesigns.createdAt));
}
async function getSmileDesignMetrics(clinicId, days) {
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
      recentConversions: []
    };
  }
  const startDate = /* @__PURE__ */ new Date();
  startDate.setDate(startDate.getDate() - days);
  const allDesigns = await db.select().from(smileDesigns).where(and(
    eq(smileDesigns.clinicId, clinicId),
    gte(smileDesigns.createdAt, startDate)
  ));
  const totalSimulations = allDesigns.length;
  const conversions = allDesigns.filter((d) => d.converted);
  const totalConversions = conversions.length;
  const conversionRate = totalSimulations > 0 ? Math.round(totalConversions / totalSimulations * 100) : 0;
  const sharedDesigns = allDesigns.filter((d) => d.sharedViaWhatsApp);
  const sharedViaWhatsApp = sharedDesigns.length;
  const sharedConversions = sharedDesigns.filter((d) => d.converted).length;
  const whatsAppConversionRate = sharedViaWhatsApp > 0 ? Math.round(sharedConversions / sharedViaWhatsApp * 100) : 0;
  const treatmentTypesSet = new Set(allDesigns.map((d) => d.treatmentType));
  const treatmentTypes = [];
  treatmentTypesSet.forEach((t2) => treatmentTypes.push(t2));
  const byTreatmentType = treatmentTypes.map((type) => {
    const typeDesigns = allDesigns.filter((d) => d.treatmentType === type);
    const typeConversions = typeDesigns.filter((d) => d.converted).length;
    return {
      name: type.charAt(0).toUpperCase() + type.slice(1),
      simulations: typeDesigns.length,
      conversions: typeConversions,
      rate: typeDesigns.length > 0 ? Math.round(typeConversions / typeDesigns.length * 100) : 0
    };
  }).sort((a, b) => b.simulations - a.simulations);
  const weeklyTrend = [
    { week: "Sem 1", simulations: Math.floor(totalSimulations * 0.2), conversions: Math.floor(totalConversions * 0.2) },
    { week: "Sem 2", simulations: Math.floor(totalSimulations * 0.25), conversions: Math.floor(totalConversions * 0.25) },
    { week: "Sem 3", simulations: Math.floor(totalSimulations * 0.25), conversions: Math.floor(totalConversions * 0.25) },
    { week: "Sem 4", simulations: Math.floor(totalSimulations * 0.3), conversions: Math.floor(totalConversions * 0.3) }
  ];
  const avgRevenuePerConversion = 3e3;
  const totalRevenue = totalConversions * avgRevenuePerConversion;
  const recentConversions = conversions.slice(0, 5).map((c) => ({
    patient: "Paciente",
    treatment: c.treatmentType,
    value: avgRevenuePerConversion,
    date: c.convertedAt?.toISOString().split("T")[0] || c.createdAt.toISOString().split("T")[0]
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
    recentConversions
  };
}
async function markSmileDesignShared(clinicId, id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(smileDesigns).set({ sharedViaWhatsApp: true, sharedAt: /* @__PURE__ */ new Date() }).where(and(eq(smileDesigns.id, id), eq(smileDesigns.clinicId, clinicId)));
}
async function markSmileDesignConverted(clinicId, id, budgetId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(smileDesigns).set({ converted: true, convertedAt: /* @__PURE__ */ new Date(), budgetId: budgetId || null }).where(and(eq(smileDesigns.id, id), eq(smileDesigns.clinicId, clinicId)));
}
async function createReturnAlert(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(returnAlerts).values(data);
  return { id: Number(result[0].insertId) };
}
async function getPendingPayments(clinicId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(serviceQueue).where(and(
    eq(serviceQueue.clinicId, clinicId),
    eq(serviceQueue.status, "pending_payment"),
    ne(serviceQueue.paymentStatus, "paid")
  )).orderBy(serviceQueue.arrivalTime);
}
async function getReturnAlerts(clinicId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(returnAlerts).where(eq(returnAlerts.clinicId, clinicId)).orderBy(desc(returnAlerts.createdAt));
}
async function getPendingReturnAlerts(clinicId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(returnAlerts).where(and(
    eq(returnAlerts.clinicId, clinicId),
    eq(returnAlerts.status, "pending")
  )).orderBy(returnAlerts.returnDueDate);
}
async function updateReturnAlertStatus(id, status, notes) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(returnAlerts).set({
    status,
    lastContactNotes: notes || void 0
  }).where(eq(returnAlerts.id, id));
}
async function registerReturnAlertContact(id, notes) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const alert = await db.select().from(returnAlerts).where(eq(returnAlerts.id, id)).limit(1);
  if (alert.length === 0) return;
  await db.update(returnAlerts).set({
    contactAttempts: (alert[0].contactAttempts || 0) + 1,
    lastContactDate: /* @__PURE__ */ new Date(),
    lastContactNotes: notes,
    status: "contacted"
  }).where(eq(returnAlerts.id, id));
}
async function getReturnPeriodSettings(clinicId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(returnPeriodSettings).where(eq(returnPeriodSettings.clinicId, clinicId));
}
async function saveReturnPeriodSetting(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
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
async function getReminderTemplates(clinicId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reminderTemplates).where(and(
    eq(reminderTemplates.clinicId, clinicId),
    eq(reminderTemplates.isActive, true)
  )).orderBy(desc(reminderTemplates.isDefault));
}
async function createReminderTemplate(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(reminderTemplates).values(data);
  return { id: Number(result[0].insertId) };
}
async function updateReminderTemplate(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reminderTemplates).set(data).where(eq(reminderTemplates.id, id));
}
async function deleteReminderTemplate(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reminderTemplates).set({ isActive: false }).where(eq(reminderTemplates.id, id));
}
async function createWhatsappReminderHistory(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(whatsappReminderHistory).values(data);
  return { id: Number(result[0].insertId) };
}
async function getWhatsappReminderHistory(clinicId, returnAlertId) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(whatsappReminderHistory.clinicId, clinicId)];
  if (returnAlertId) conditions.push(eq(whatsappReminderHistory.returnAlertId, returnAlertId));
  return db.select().from(whatsappReminderHistory).where(and(...conditions)).orderBy(desc(whatsappReminderHistory.sentAt));
}
async function getWhatsappReminderStats(clinicId, startDate, endDate) {
  const db = await getDb();
  if (!db) return { total: 0, sent: 0, delivered: 0, read: 0, failed: 0 };
  const conditions = [eq(whatsappReminderHistory.clinicId, clinicId)];
  if (startDate) conditions.push(gte(whatsappReminderHistory.sentAt, startDate));
  if (endDate) conditions.push(lte(whatsappReminderHistory.sentAt, endDate));
  const result = await db.select({
    total: sql`count(*)`,
    sent: sql`sum(case when status = 'sent' then 1 else 0 end)`,
    delivered: sql`sum(case when status = 'delivered' then 1 else 0 end)`,
    read: sql`sum(case when status = 'read' then 1 else 0 end)`,
    failed: sql`sum(case when status = 'failed' then 1 else 0 end)`
  }).from(whatsappReminderHistory).where(and(...conditions));
  return result[0] || { total: 0, sent: 0, delivered: 0, read: 0, failed: 0 };
}
async function getPatientModels3D(patientId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(patientModels3D).where(eq(patientModels3D.patientId, patientId)).orderBy(desc(patientModels3D.createdAt));
}
async function getPatientModel3DById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(patientModels3D).where(eq(patientModels3D.id, id)).limit(1);
  return result[0];
}
async function createPatientModel3D(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(patientModels3D).values(data);
  return { id: result[0].insertId };
}
async function updatePatientModel3D(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(patientModels3D).set(data).where(eq(patientModels3D.id, id));
  return { success: true };
}
async function deletePatientModel3D(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(patientModels3D).where(eq(patientModels3D.id, id));
  return { success: true };
}
async function getModels3DLibrary(clinicId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(models3DLibrary).where(eq(models3DLibrary.clinicId, clinicId)).orderBy(desc(models3DLibrary.createdAt));
}
async function getModel3DLibraryById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(models3DLibrary).where(eq(models3DLibrary.id, id)).limit(1);
  return result[0];
}
async function createModel3DLibrary(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(models3DLibrary).values(data);
  return { id: result[0].insertId };
}
async function deleteModel3DLibrary(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(models3DLibrary).where(eq(models3DLibrary.id, id));
  return { success: true };
}
async function createTreatmentProcedures(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.length === 0) return { count: 0 };
  const result = await db.insert(treatmentProcedures).values(data);
  return { count: data.length, firstId: result[0].insertId };
}
async function getTreatmentProceduresByQueueEntry(queueEntryId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(treatmentProcedures).where(eq(treatmentProcedures.queueEntryId, queueEntryId)).orderBy(treatmentProcedures.id);
}
async function getTreatmentProceduresByPatient(patientId, clinicId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(treatmentProcedures).where(and(
    eq(treatmentProcedures.patientId, patientId),
    eq(treatmentProcedures.clinicId, clinicId)
  )).orderBy(desc(treatmentProcedures.createdAt));
}
async function getTreatmentProceduresByBudget(budgetId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(treatmentProcedures).where(eq(treatmentProcedures.budgetId, budgetId)).orderBy(treatmentProcedures.id);
}
async function updateTreatmentProcedureStatus(id, status, completedBy, notes) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = { status };
  if (status === "completed") {
    updateData.completedBy = completedBy;
    updateData.completedAt = /* @__PURE__ */ new Date();
  }
  if (notes !== void 0) {
    updateData.notes = notes;
  }
  await db.update(treatmentProcedures).set(updateData).where(eq(treatmentProcedures.id, id));
  return { success: true };
}
async function markMultipleProceduresCompleted(ids, completedBy) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(treatmentProcedures).set({
    status: "completed",
    completedBy,
    completedAt: /* @__PURE__ */ new Date()
  }).where(inArray(treatmentProcedures.id, ids));
  return { success: true, count: ids.length };
}
async function getPendingTreatmentProcedures(patientId, clinicId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(treatmentProcedures).where(and(
    eq(treatmentProcedures.patientId, patientId),
    eq(treatmentProcedures.clinicId, clinicId),
    eq(treatmentProcedures.status, "pending")
  )).orderBy(treatmentProcedures.id);
}
async function getTreatmentProceduresForSpecialist(queueEntryId, patientId) {
  const db = await getDb();
  if (!db) return [];
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
    patientId: treatmentProcedures.patientId
    // Não inclui o preço!
  }).from(treatmentProcedures).where(eq(treatmentProcedures.queueEntryId, queueEntryId)).orderBy(treatmentProcedures.id);
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
      patientId: treatmentProcedures.patientId
    }).from(treatmentProcedures).where(and(
      eq(treatmentProcedures.patientId, patientId),
      ne(treatmentProcedures.status, "completed")
    )).orderBy(treatmentProcedures.id);
  }
  return result;
}
async function linkProceduresToQueueEntry(procedureIds, newQueueEntryId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(treatmentProcedures).set({ queueEntryId: newQueueEntryId }).where(inArray(treatmentProcedures.id, procedureIds));
  return { success: true };
}
async function createMedicalDocument(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(medicalDocuments).values(data);
  return { id: Number(result[0].insertId), ...data };
}
async function getMedicalDocumentsByPatient(patientId, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(medicalDocuments).where(and(
    eq(medicalDocuments.patientId, patientId),
    eq(medicalDocuments.clinicId, clinicId)
  )).orderBy(desc(medicalDocuments.createdAt));
}
async function getMedicalDocumentById(id, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(medicalDocuments).where(and(
    eq(medicalDocuments.id, id),
    eq(medicalDocuments.clinicId, clinicId)
  )).limit(1);
  return result[0] || null;
}
async function updateMedicalDocument(id, clinicId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(medicalDocuments).set(data).where(and(
    eq(medicalDocuments.id, id),
    eq(medicalDocuments.clinicId, clinicId)
  ));
  return { success: true };
}
async function deleteMedicalDocument(id, clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(medicalDocuments).where(and(
    eq(medicalDocuments.id, id),
    eq(medicalDocuments.clinicId, clinicId)
  ));
  return { success: true };
}
async function getMedicalDocumentByToken(token) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(medicalDocuments).where(eq(medicalDocuments.validationToken, token)).limit(1);
  return result[0] || null;
}
async function getMedicalDocumentsByClinic(clinicId, type) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(medicalDocuments.clinicId, clinicId)];
  if (type) {
    conditions.push(eq(medicalDocuments.type, type));
  }
  return db.select().from(medicalDocuments).where(and(...conditions)).orderBy(desc(medicalDocuments.createdAt));
}
async function getDentistCommissions(clinicId, dentistId) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [
    eq(dentistCommissions.clinicId, clinicId),
    sql`${dentistCommissions.procedureId} IS NULL`
    // Apenas comissoes genericas (procedureId = NULL)
  ];
  if (dentistId) {
    conditions.push(eq(dentistCommissions.dentistId, dentistId));
  }
  let result = await db.select().from(dentistCommissions).where(and(...conditions));
  if (result.length === 0 && dentistId) {
    const fallbackConditions = [
      eq(dentistCommissions.dentistId, dentistId),
      sql`${dentistCommissions.procedureId} IS NULL`
    ];
    result = await db.select().from(dentistCommissions).where(and(...fallbackConditions));
  }
  return result;
}
async function getDentistCommissionById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(dentistCommissions).where(eq(dentistCommissions.id, id)).limit(1);
  return result[0];
}
async function createDentistCommission(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!data.clinicId || !data.dentistId) {
    throw new Error("clinicId e dentistId s\xE3o obrigat\xF3rios");
  }
  await db.insert(dentistCommissions).values({
    clinicId: data.clinicId,
    dentistId: data.dentistId,
    procedureId: data.procedureId,
    commissionPercentage: data.commissionPercentage.toString(),
    isActive: data.isActive
  });
  const result = await db.select().from(dentistCommissions).where(eq(dentistCommissions.dentistId, data.dentistId)).orderBy(sql`id DESC`).limit(1);
  return result[0] || null;
}
async function updateDentistCommission(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dentistCommissions).set(data).where(eq(dentistCommissions.id, id));
}
async function getDentistCommissionByProcedure(clinicId, dentistId, procedureId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(dentistCommissions).where(
    and(
      eq(dentistCommissions.clinicId, clinicId),
      eq(dentistCommissions.dentistId, dentistId),
      eq(dentistCommissions.procedureId, procedureId)
    )
  ).limit(1);
  return result[0];
}
async function getDentistDefaultCommission(clinicId, dentistId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(dentistCommissions).where(
    and(
      eq(dentistCommissions.clinicId, clinicId),
      eq(dentistCommissions.dentistId, dentistId),
      sql`${dentistCommissions.procedureId} IS NULL`
    )
  ).limit(1);
  return result[0];
}
async function createCompletedAppointment(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(completedAppointments).values(data);
  return { success: true };
}
async function getCompletedAppointmentsByClinic(clinicId, date2) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(completedAppointments.clinicId, clinicId)];
  if (date2) {
    const dateStr = date2.split("T")[0];
    const startOfDay = /* @__PURE__ */ new Date(`${dateStr}T00:00:00Z`);
    const endOfDay = /* @__PURE__ */ new Date(`${dateStr}T23:59:59Z`);
    conditions.push(gte(completedAppointments.completedAt, startOfDay));
    conditions.push(lt(completedAppointments.completedAt, endOfDay));
  }
  return db.select().from(completedAppointments).where(and(...conditions)).orderBy(desc(completedAppointments.completedAt));
}
async function getCompletedAppointmentsByDentist(clinicId, dentistId, date2) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [
    eq(completedAppointments.clinicId, clinicId),
    eq(completedAppointments.dentistId, dentistId)
  ];
  if (date2) {
    const dateStr = date2.split("T")[0];
    const startOfDay = /* @__PURE__ */ new Date(`${dateStr}T00:00:00Z`);
    const endOfDay = /* @__PURE__ */ new Date(`${dateStr}T23:59:59Z`);
    conditions.push(gte(completedAppointments.completedAt, startOfDay));
    conditions.push(lt(completedAppointments.completedAt, endOfDay));
  }
  return db.select().from(completedAppointments).where(and(...conditions)).orderBy(desc(completedAppointments.completedAt));
}
async function updateCompletedAppointmentStatus(id, paymentStatus) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(completedAppointments).set({ paymentStatus }).where(eq(completedAppointments.id, id));
}
async function getDailyEarningsSummary(clinicId, dentistId, date2) {
  const db = await getDb();
  if (!db) return void 0;
  const dateObj = /* @__PURE__ */ new Date(`${date2}T00:00:00Z`);
  const result = await db.select().from(dailyEarningsSummary).where(
    and(
      eq(dailyEarningsSummary.clinicId, clinicId),
      eq(dailyEarningsSummary.dentistId, dentistId),
      eq(dailyEarningsSummary.date, dateObj)
    )
  ).limit(1);
  return result[0];
}
async function getDailyEarningsSummaryByClinic(clinicId, date2) {
  const db = await getDb();
  if (!db) return [];
  const dateObj = /* @__PURE__ */ new Date(`${date2}T00:00:00Z`);
  return db.select().from(dailyEarningsSummary).where(
    and(
      eq(dailyEarningsSummary.clinicId, clinicId),
      eq(dailyEarningsSummary.date, dateObj)
    )
  ).orderBy(asc(dailyEarningsSummary.dentistId));
}
async function createOrUpdateDailyEarningsSummary(clinicId, dentistId, date2) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!dentistId) throw new Error("Dentist ID is required");
  const appointments2 = await getCompletedAppointmentsByDentist(clinicId, dentistId, date2);
  const totalProcedures = appointments2.length;
  const totalRevenue = appointments2.reduce((sum, apt) => sum + parseFloat(apt.procedurePrice.toString()), 0);
  const totalCommission = appointments2.reduce((sum, apt) => sum + parseFloat(apt.commissionAmount.toString()), 0);
  const existing = await getDailyEarningsSummary(clinicId, dentistId, date2);
  if (existing) {
    await db.update(dailyEarningsSummary).set({
      totalProcedures,
      totalRevenue: totalRevenue.toString(),
      totalCommission: totalCommission.toString(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(dailyEarningsSummary.id, existing.id));
  } else {
    const dateObj = /* @__PURE__ */ new Date(`${date2}T00:00:00Z`);
    await db.insert(dailyEarningsSummary).values({
      clinicId,
      dentistId,
      date: dateObj,
      totalProcedures,
      totalRevenue: totalRevenue.toString(),
      totalCommission: totalCommission.toString(),
      status: "draft"
    });
  }
  return getDailyEarningsSummary(clinicId, dentistId, date2);
}
async function finalizeDailyEarningsSummary(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dailyEarningsSummary).set({ status: "finalized" }).where(eq(dailyEarningsSummary.id, id));
}
async function markDailyEarningsSummaryAsPaid(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dailyEarningsSummary).set({ status: "paid" }).where(eq(dailyEarningsSummary.id, id));
}
async function getDentistsByClinic(clinicId) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: dentists.id,
    name: dentists.name,
    email: dentists.email
  }).from(dentists).where(
    and(
      eq(dentists.clinicId, clinicId),
      eq(dentists.isActive, true)
    )
  ).orderBy(dentists.name);
}
async function deleteDentistCommission(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(dentistCommissions).where(eq(dentistCommissions.id, id));
}
async function getDailyEarningsSummaryByDate(clinicId, date2) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dailyEarningsSummary).where(
    and(
      eq(dailyEarningsSummary.clinicId, clinicId),
      eq(sql`DATE(${dailyEarningsSummary.date})`, sql`${date2}`)
    )
  ).orderBy(asc(dailyEarningsSummary.dentistId));
}
async function getCompletedAppointmentsByDate(clinicId, date2) {
  const db = await getDb();
  if (!db) return [];
  const dateObj = new Date(date2);
  return db.select().from(completedAppointments).where(
    and(
      eq(completedAppointments.clinicId, clinicId),
      eq(sql`DATE(${completedAppointments.completedAt})`, dateObj)
    )
  ).orderBy(desc(completedAppointments.completedAt));
}
async function getCompletedAppointmentsByDentistAndDate(clinicId, dentistId, date2) {
  const db = await getDb();
  if (!db) return [];
  const dateObj = new Date(date2);
  return db.select().from(completedAppointments).where(
    and(
      eq(completedAppointments.clinicId, clinicId),
      eq(completedAppointments.dentistId, dentistId),
      eq(sql`DATE(${completedAppointments.completedAt})`, dateObj)
    )
  ).orderBy(desc(completedAppointments.completedAt));
}
async function getSpecialties(clinicId) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.selectDistinct({ specialty: dentists.specialty }).from(dentists).where(eq(dentists.clinicId, clinicId)).orderBy(asc(dentists.specialty));
  return result.map((r) => r.specialty).filter((s) => s !== null && s !== void 0);
}
async function getDentistsBySpecialty(clinicId, specialty) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dentists).where(
    and(
      eq(dentists.clinicId, clinicId),
      eq(dentists.specialty, specialty)
    )
  ).orderBy(asc(dentists.name));
}
async function getDailyEarningsSummaryBySpecialty(clinicId, specialty, date2) {
  const db = await getDb();
  if (!db) return [];
  const specialtyDentists = await db.select({ id: dentists.id }).from(dentists).where(
    and(
      eq(dentists.clinicId, clinicId),
      eq(dentists.specialty, specialty)
    )
  );
  const dentistIds = specialtyDentists.map((d) => d.id);
  if (dentistIds.length === 0) return [];
  return db.select().from(dailyEarningsSummary).where(
    and(
      eq(dailyEarningsSummary.clinicId, clinicId),
      eq(sql`DATE(${dailyEarningsSummary.date})`, sql`${date2}`),
      inArray(dailyEarningsSummary.dentistId, dentistIds)
    )
  ).orderBy(asc(dailyEarningsSummary.dentistId));
}
async function getCompletedAppointmentsBySpecialty(clinicId, specialty, date2) {
  const db = await getDb();
  if (!db) return [];
  const specialtyDentists = await db.select({ id: dentists.id }).from(dentists).where(
    and(
      eq(dentists.clinicId, clinicId),
      eq(dentists.specialty, specialty)
    )
  );
  const dentistIds = specialtyDentists.map((d) => d.id);
  if (dentistIds.length === 0) return [];
  const conditions = [
    eq(completedAppointments.clinicId, clinicId),
    inArray(completedAppointments.dentistId, dentistIds)
  ];
  if (date2) {
    const dateStr = date2.split("T")[0];
    const startOfDay = /* @__PURE__ */ new Date(`${dateStr}T00:00:00Z`);
    const endOfDay = /* @__PURE__ */ new Date(`${dateStr}T23:59:59Z`);
    conditions.push(gte(completedAppointments.completedAt, startOfDay));
    conditions.push(lt(completedAppointments.completedAt, endOfDay));
  }
  return db.select().from(completedAppointments).where(and(...conditions)).orderBy(desc(completedAppointments.completedAt));
}
var _db, SALT_ROUNDS;
var init_db = __esm({
  "server/db.ts"() {
    init_schema();
    init_env();
    init_schema();
    _db = null;
    SALT_ROUNDS = 10;
  }
});

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var PROJECT_ROOT, LOG_DIR, MAX_LOG_SIZE_BYTES, TRIM_TARGET_BYTES, plugins, vite_config_default;
var init_vite_config = __esm({
  "vite.config.ts"() {
    PROJECT_ROOT = import.meta.dirname;
    LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
    MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
    TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
    plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
    vite_config_default = defineConfig({
      plugins,
      resolve: {
        alias: {
          "@": path.resolve(import.meta.dirname, "client", "src"),
          "@shared": path.resolve(import.meta.dirname, "shared"),
          "@assets": path.resolve(import.meta.dirname, "attached_assets")
        }
      },
      envDir: path.resolve(import.meta.dirname),
      root: path.resolve(import.meta.dirname, "client"),
      publicDir: path.resolve(import.meta.dirname, "client", "public"),
      build: {
        outDir: path.resolve(import.meta.dirname, "dist/public"),
        emptyOutDir: true
      },
      server: {
        host: true,
        allowedHosts: [
          ".manuspre.computer",
          ".manus.computer",
          ".manus-asia.computer",
          ".manuscomputer.ai",
          ".manusvm.computer",
          "localhost",
          "127.0.0.1"
        ],
        fs: {
          strict: true,
          deny: ["**/.*"]
        }
      }
    });
  }
});

// server/_core/vite.ts
var vite_exports = {};
__export(vite_exports, {
  serveStatic: () => serveStatic,
  setupVite: () => setupVite
});
import express from "express";
import fs2 from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}
var init_vite = __esm({
  "server/_core/vite.ts"() {
    init_vite_config();
  }
});

// server/_core/app.ts
import "dotenv/config";
import express2 from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/oauth.ts
init_db();

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/",
    sameSite: secure ? "none" : "lax",
    secure
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
init_env();
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email || `${userInfo.openId}@manus.auth`,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId || "",
      email: user.email,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email || `${userInfo.openId}@manus.auth`,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);
var clinicProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user) {
      throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    if (!ctx.user.clinicId) {
      throw new TRPCError2({ code: "FORBIDDEN", message: "Usu\xE1rio n\xE3o est\xE1 associado a nenhuma cl\xEDnica" });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
        clinicId: ctx.user.clinicId
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { TRPCError as TRPCError4 } from "@trpc/server";
init_db();
import { z as z3 } from "zod";

// server/stripe/stripe.ts
import Stripe from "stripe";
var ALTERNATIVE_STRIPE_SECRET_KEY = "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";
var stripeSecretKey = ALTERNATIVE_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn("[Stripe] STRIPE_SECRET_KEY n\xE3o configurada. Funcionalidades de pagamento estar\xE3o desabilitadas.");
} else {
  console.log("[Stripe] Usando conta:", stripeSecretKey.substring(0, 25) + "...");
}
var stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: "2026-01-28.clover"
}) : null;
function isStripeConfigured() {
  return stripe !== null;
}

// server/storage.ts
init_env();
function getStorageConfig() {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}
function buildUploadUrl(baseUrl, relKey) {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}
async function buildDownloadUrl(baseUrl, relKey, apiKey) {
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey)
  });
  return (await response.json()).url;
}
function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function toFormData(data, contentType, fileName) {
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}
function buildAuthHeaders(apiKey) {
  return { Authorization: `Bearer ${apiKey}` };
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}
async function storageGet(relKey) {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  return {
    key,
    url: await buildDownloadUrl(baseUrl, key, apiKey)
  };
}

// server/_core/llm.ts
init_env();
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
    maxTokens,
    max_tokens
  } = params;
  const payload = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = max_tokens || maxTokens || 2e3;
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/_core/imageGeneration.ts
init_env();
async function generateImage(options) {
  if (!ENV.forgeApiUrl) {
    throw new Error("BUILT_IN_FORGE_API_URL is not configured");
  }
  if (!ENV.forgeApiKey) {
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  }
  const baseUrl = ENV.forgeApiUrl.endsWith("/") ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`;
  const fullUrl = new URL(
    "images.v1.ImageService/GenerateImage",
    baseUrl
  ).toString();
  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "connect-protocol-version": "1",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify({
      prompt: options.prompt,
      original_images: options.originalImages || []
    })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Image generation request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }
  const result = await response.json();
  const base64Data = result.image.b64Json;
  const buffer = Buffer.from(base64Data, "base64");
  const { url } = await storagePut(
    `generated/${Date.now()}.png`,
    buffer,
    result.image.mimeType
  );
  return {
    url
  };
}

// server/routers/earningsRouter.ts
import { z as z2 } from "zod";
import { TRPCError as TRPCError3 } from "@trpc/server";

// server/commissionService.ts
init_db();
init_schema();
import { eq as eq2 } from "drizzle-orm";
async function upsertDentistCommission(clinicId, dentistId, commissionPercentage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!clinicId || !dentistId || commissionPercentage === void 0) {
    throw new Error("clinicId, dentistId e commissionPercentage s\xE3o obrigat\xF3rios");
  }
  if (commissionPercentage < 0 || commissionPercentage > 100) {
    throw new Error("commissionPercentage deve estar entre 0 e 100");
  }
  try {
    const existing = await db.select().from(dentistCommissions).where(eq2(dentistCommissions.dentistId, dentistId)).limit(1);
    if (existing.length > 0) {
      await db.update(dentistCommissions).set({
        commissionPercentage: commissionPercentage.toString(),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq2(dentistCommissions.dentistId, dentistId));
      const updated = await db.select().from(dentistCommissions).where(eq2(dentistCommissions.dentistId, dentistId)).limit(1);
      return {
        ...updated[0],
        commissionPercentage: parseFloat(updated[0]?.commissionPercentage || "0")
      };
    } else {
      await db.insert(dentistCommissions).values({
        clinicId,
        dentistId,
        procedureId: null,
        commissionPercentage: commissionPercentage.toString(),
        isActive: true
      });
      const created = await db.select().from(dentistCommissions).where(eq2(dentistCommissions.dentistId, dentistId)).limit(1);
      return {
        ...created[0],
        commissionPercentage: parseFloat(created[0]?.commissionPercentage || "0")
      };
    }
  } catch (error) {
    console.error("Erro ao criar/atualizar comiss\xE3o:", error);
    throw new Error(`Erro ao salvar comiss\xE3o: ${error.message}`);
  }
}
async function getClinicCommissions(clinicId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const commissions = await db.select().from(dentistCommissions).where(eq2(dentistCommissions.clinicId, clinicId));
    return commissions;
  } catch (error) {
    console.error("Erro ao buscar comiss\xF5es:", error);
    throw new Error(`Erro ao buscar comiss\xF5es: ${error.message}`);
  }
}
async function deleteDentistCommission2(dentistId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(dentistCommissions).where(eq2(dentistCommissions.dentistId, dentistId));
    return { success: true, message: "Comiss\xE3o removida com sucesso" };
  } catch (error) {
    console.error("Erro ao deletar comiss\xE3o:", error);
    throw new Error(`Erro ao remover comiss\xE3o: ${error.message}`);
  }
}

// server/routers/earningsRouter.ts
init_db();
var earningsRouter = router({
  // Especialidades
  specialties: router({
    // Listar especialidades da clínica
    list: clinicProcedure.query(async ({ ctx }) => {
      try {
        return await getSpecialties(ctx.clinicId);
      } catch (error) {
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message
        });
      }
    })
  }),
  // Comissões
  commissions: router({
    // Listar comissões da clínica
    list: clinicProcedure.query(async ({ ctx }) => {
      try {
        const commissions = await getClinicCommissions(ctx.clinicId);
        return commissions;
      } catch (error) {
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message
        });
      }
    }),
    // Criar ou atualizar comissão
    upsert: clinicProcedure.input(
      z2.object({
        dentistId: z2.number(),
        commissionPercentage: z2.number().min(0).max(100)
      })
    ).mutation(async ({ input, ctx }) => {
      try {
        const result = await upsertDentistCommission(
          ctx.clinicId,
          input.dentistId,
          input.commissionPercentage
        );
        return result;
      } catch (error) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: error.message
        });
      }
    }),
    // Deletar comissão
    delete: clinicProcedure.input(z2.object({ dentistId: z2.number() })).mutation(async ({ input, ctx }) => {
      try {
        const result = await deleteDentistCommission2(input.dentistId);
        return result;
      } catch (error) {
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message
        });
      }
    })
  }),
  // Dentistas para comissão
  dentists: router({
    // Listar dentistas da clínica
    list: clinicProcedure.query(async ({ ctx }) => {
      try {
        return await getDentistsByClinic(ctx.clinicId);
      } catch (error) {
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message
        });
      }
    }),
    // Listar dentistas por especialidade
    listBySpecialty: clinicProcedure.input(z2.object({ specialty: z2.string() })).query(async ({ input, ctx }) => {
      try {
        return await getDentistsBySpecialty(ctx.clinicId, input.specialty);
      } catch (error) {
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message
        });
      }
    })
  }),
  // Mapa de Ganho - Resumo de ganhos
  map: router({
    // Ganhos do dia por data
    byDate: clinicProcedure.input(z2.object({ date: z2.string() })).query(async ({ input, ctx }) => {
      try {
        return await getDailyEarningsSummaryByDate(ctx.clinicId, input.date);
      } catch (error) {
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message
        });
      }
    }),
    // Ganhos por especialidade
    bySpecialty: clinicProcedure.input(z2.object({ specialty: z2.string(), date: z2.string() })).query(async ({ input, ctx }) => {
      try {
        return await getDailyEarningsSummaryBySpecialty(
          ctx.clinicId,
          input.specialty,
          input.date
        );
      } catch (error) {
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message
        });
      }
    })
  }),
  // Atendimentos realizados
  appointments: router({
    // Listar todos os atendimentos completados
    list: clinicProcedure.input(z2.object({
      startDate: z2.string().optional(),
      endDate: z2.string().optional()
    }).optional()).query(async ({ input, ctx }) => {
      try {
        const appointments2 = await getCompletedAppointmentsByClinic(ctx.clinicId);
        if (!input?.startDate || !input?.endDate) return appointments2;
        const start = new Date(input.startDate);
        const end = new Date(input.endDate);
        end.setHours(23, 59, 59, 999);
        return appointments2.filter((apt) => {
          const aptDate = new Date(apt.completedAt);
          return aptDate >= start && aptDate <= end;
        });
      } catch (error) {
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message
        });
      }
    }),
    // Listar atendimentos do dia
    listByDate: clinicProcedure.input(z2.object({ date: z2.string() })).query(async ({ input, ctx }) => {
      try {
        return await getCompletedAppointmentsByDate(ctx.clinicId, input.date);
      } catch (error) {
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message
        });
      }
    }),
    // Listar atendimentos por dentista
    listByDentist: clinicProcedure.input(z2.object({ dentistId: z2.number(), date: z2.string() })).query(async ({ input, ctx }) => {
      try {
        return await getCompletedAppointmentsByDentistAndDate(
          ctx.clinicId,
          input.dentistId,
          input.date
        );
      } catch (error) {
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message
        });
      }
    }),
    // Listar atendimentos por especialidade
    listBySpecialty: clinicProcedure.input(z2.object({ specialty: z2.string(), date: z2.string().optional() })).query(async ({ input, ctx }) => {
      try {
        return await getCompletedAppointmentsBySpecialty(
          ctx.clinicId,
          input.specialty,
          input.date
        );
      } catch (error) {
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message
        });
      }
    })
  })
});

// server/routers.ts
function getOriginFromRequest(req) {
  if (req.headers.origin) {
    return req.headers.origin;
  }
  const host = req.headers.host || req.headers["x-forwarded-host"];
  if (host) {
    const protocol = req.headers["x-forwarded-proto"] || (req.connection?.encrypted ? "https" : "http");
    return `${protocol}://${host}`;
  }
  return "https://3000-ihhklxrqs8f7ubsym9j7i-ec292523.us2.manus.computer";
}
var DATABASE_SETUP_MESSAGE = "Banco de dados n\xE3o configurado. Configure DATABASE_URL no Vercel, rode pnpm db:push e tente o cadastro novamente.";
var DATABASE_DIALECT_MESSAGE = "DATABASE_URL est\xE1 usando PostgreSQL/Supabase, mas este projeto usa MySQL/TiDB. Configure uma URL mysql:// ou mysql2:// e rode pnpm db:push.";
function throwDatabaseSetupError(cause) {
  throw new TRPCError4({
    code: "PRECONDITION_FAILED",
    message: DATABASE_SETUP_MESSAGE,
    cause
  });
}
function throwDatabaseDialectError() {
  throw new TRPCError4({
    code: "PRECONDITION_FAILED",
    message: DATABASE_DIALECT_MESSAGE
  });
}
function assertDatabaseUrlConfigured() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throwDatabaseSetupError();
  }
  if (/^postgres(ql)?:\/\//i.test(databaseUrl)) {
    throwDatabaseDialectError();
  }
}
function isDatabaseSetupError(error) {
  if (!(error instanceof Error)) return false;
  return /Database not available|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|Access denied|Unknown database|getaddrinfo/i.test(
    error.message
  );
}
function rethrowWithDatabaseSetupMessage(error) {
  if (isDatabaseSetupError(error)) {
    throwDatabaseSetupError(error);
  }
  throw error;
}
var appRouter = router({
  system: systemRouter,
  earnings: earningsRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
    // Registro com email e senha
    register: publicProcedure.input(z3.object({
      email: z3.string().email(),
      password: z3.string().min(6),
      name: z3.string().min(2),
      phone: z3.string().optional(),
      clinicName: z3.string().optional()
      // Se informado, cria uma clínica
    })).mutation(async ({ input }) => {
      assertDatabaseUrlConfigured();
      try {
        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          throw new Error("Email j\xE1 cadastrado");
        }
        let clinicId;
        if (input.clinicName) {
          const slug = input.clinicName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          const clinic = await createClinic({
            name: input.clinicName,
            slug: slug + "-" + Date.now(),
            isActive: true
          });
          clinicId = clinic.id;
        }
        const user = await createUserWithPassword({
          email: input.email,
          password: input.password,
          name: input.name,
          phone: input.phone,
          clinicId,
          role: clinicId ? "admin" : "user"
          // Se criou clínica, é admin
        });
        if (clinicId) {
          await addUserToClinic({
            userId: user.id,
            clinicId,
            role: "owner",
            isActive: true
          });
          await initializeDefaultPermissions();
        }
        return { success: true, userId: user.id, clinicId };
      } catch (error) {
        rethrowWithDatabaseSetupMessage(error);
      }
    }),
    // Login com email e senha
    login: publicProcedure.input(z3.object({
      email: z3.string().email(),
      password: z3.string()
    })).mutation(async ({ input, ctx }) => {
      assertDatabaseUrlConfigured();
      try {
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new Error("Email ou senha inv\xE1lidos");
        }
        if (!user.isActive) {
          throw new Error("Usu\xE1rio desativado");
        }
        if (user.role !== "superadmin" && user.clinicId) {
          const accessInfo = await checkClinicAccess(user.clinicId);
          if (!accessInfo.canAccess) {
            throw new Error(accessInfo.reason || "Acesso bloqueado");
          }
        }
        const validPassword = await verifyPassword(input.password, user.passwordHash);
        if (!validPassword) {
          throw new Error("Email ou senha inv\xE1lidos");
        }
        await updateUserLastSignIn(user.id);
        const { SignJWT: SignJWT2 } = await import("jose");
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");
        const token = await new SignJWT2({
          userId: user.id,
          email: user.email,
          role: user.role,
          clinicId: user.clinicId
        }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1e3
          // 7 dias
        });
        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            clinicId: user.clinicId
          }
        };
      } catch (error) {
        rethrowWithDatabaseSetupMessage(error);
      }
    }),
    // Alterar senha
    changePassword: publicProcedure.input(z3.object({
      currentPassword: z3.string(),
      newPassword: z3.string().min(6)
    })).mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error("N\xE3o autenticado");
      }
      const user = await getUserById(ctx.user.id);
      if (!user || !user.passwordHash) {
        throw new Error("Usu\xE1rio n\xE3o encontrado");
      }
      const validPassword = await verifyPassword(input.currentPassword, user.passwordHash);
      if (!validPassword) {
        throw new Error("Senha atual incorreta");
      }
      await updateUserPassword(user.id, input.newPassword);
      return { success: true };
    }),
    // Verificar acesso da clínica
    checkClinicAccess: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        return { canAccess: false, reason: "N\xE3o autenticado" };
      }
      if (ctx.user.role === "superadmin") {
        return { canAccess: true, isSuperAdmin: true };
      }
      if (!ctx.user.clinicId) {
        return { canAccess: false, reason: "Usu\xE1rio n\xE3o est\xE1 associado a nenhuma cl\xEDnica" };
      }
      const accessInfo = await checkClinicAccess(ctx.user.clinicId);
      return {
        ...accessInfo,
        isSuperAdmin: false
      };
    })
  }),
  // Dashboard - Multi-tenancy: filtra por clinicId
  dashboard: router({
    stats: clinicProcedure.query(async ({ ctx }) => {
      return getDashboardStats(ctx.clinicId);
    }),
    paymentStats: clinicProcedure.query(async ({ ctx }) => {
      const pendingPayments = await getPendingPayments(ctx.clinicId);
      const returnAlerts2 = await getReturnAlerts(ctx.clinicId);
      return {
        pendingPayments: pendingPayments.length,
        returnAlerts: returnAlerts2.length
      };
    }),
    advanced: clinicProcedure.input(z3.object({ days: z3.number().optional() }).optional()).query(async ({ input, ctx }) => {
      return getAdvancedDashboardStats(input?.days ?? 30, ctx.clinicId);
    })
  }),
  // Patients - Multi-tenancy: filtra por clinicId
  patients: router({
    list: clinicProcedure.input(z3.object({ search: z3.string().optional() }).optional()).query(async ({ input, ctx }) => {
      return getPatients(input?.search, ctx.clinicId);
    }),
    getById: clinicProcedure.input(z3.object({ id: z3.number() })).query(async ({ input, ctx }) => {
      return getPatientById(input.id, ctx.clinicId);
    }),
    create: clinicProcedure.input(z3.object({
      name: z3.string().min(1),
      cpf: z3.string().optional(),
      rg: z3.string().optional(),
      birthDate: z3.string().optional(),
      gender: z3.enum(["male", "female", "other"]).optional(),
      phone: z3.string().optional(),
      whatsapp: z3.string().optional(),
      email: z3.string().email().optional().or(z3.literal("")),
      address: z3.string().optional(),
      city: z3.string().optional(),
      state: z3.string().optional(),
      zipCode: z3.string().optional(),
      profession: z3.string().optional(),
      emergencyContact: z3.string().optional(),
      emergencyPhone: z3.string().optional(),
      notes: z3.string().optional(),
      insuranceId: z3.number().optional()
    })).mutation(async ({ input, ctx }) => {
      return createPatient({
        ...input,
        clinicId: ctx.clinicId,
        birthDate: input.birthDate ? new Date(input.birthDate) : void 0,
        email: input.email || void 0
      });
    }),
    createManualWithQueue: clinicProcedure.input(z3.object({
      name: z3.string().min(1),
      phone: z3.string().optional(),
      officeId: z3.number(),
      officeName: z3.string(),
      professionalName: z3.string()
    })).mutation(async ({ input, ctx }) => {
      const patient = await createPatient({
        name: input.name,
        phone: input.phone,
        clinicId: ctx.clinicId
      });
      const queueEntry = await addToServiceQueue({
        clinicId: ctx.clinicId,
        patientId: patient.id,
        patientName: input.name,
        queueType: "budget",
        status: "in_service",
        priority: "normal",
        officeId: input.officeId,
        officeName: input.officeName,
        professionalName: input.professionalName,
        notes: "Atendimento manual cadastrado no Orcamentista"
      });
      return {
        patientId: patient.id,
        queueEntryId: queueEntry.id
      };
    }),
    update: clinicProcedure.input(z3.object({
      id: z3.number(),
      data: z3.object({
        name: z3.string().optional(),
        cpf: z3.string().optional(),
        rg: z3.string().optional(),
        birthDate: z3.string().optional(),
        gender: z3.enum(["male", "female", "other"]).optional(),
        phone: z3.string().optional(),
        whatsapp: z3.string().optional(),
        email: z3.string().email().optional().or(z3.literal("")),
        address: z3.string().optional(),
        city: z3.string().optional(),
        state: z3.string().optional(),
        zipCode: z3.string().optional(),
        profession: z3.string().optional(),
        emergencyContact: z3.string().optional(),
        emergencyPhone: z3.string().optional(),
        notes: z3.string().optional(),
        insuranceId: z3.number().optional(),
        photoUrl: z3.string().optional(),
        isActive: z3.boolean().optional()
      })
    })).mutation(async ({ input, ctx }) => {
      return updatePatient(input.id, {
        ...input.data,
        birthDate: input.data.birthDate ? new Date(input.data.birthDate) : void 0
      }, ctx.clinicId);
    }),
    delete: clinicProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input, ctx }) => {
      return deletePatient(input.id, ctx.clinicId);
    }),
    toggleActiveToday: clinicProcedure.input(z3.object({ id: z3.number(), isActiveToday: z3.boolean() })).mutation(async ({ input, ctx }) => {
      const activatedAt = input.isActiveToday ? /* @__PURE__ */ new Date() : null;
      return updatePatient(input.id, {
        isActiveToday: input.isActiveToday,
        activatedAt
      }, ctx.clinicId);
    }),
    listActiveToday: clinicProcedure.query(async ({ ctx }) => {
      return getPatientsActiveToday(ctx.clinicId);
    })
  }),
  // Dentists - Multi-tenancy: filtra por clinicId
  dentists: router({
    list: clinicProcedure.input(z3.object({ activeOnly: z3.boolean().optional() }).optional()).query(async ({ input, ctx }) => {
      return getDentists(input?.activeOnly, ctx.clinicId);
    }),
    getById: clinicProcedure.input(z3.object({ id: z3.number() })).query(async ({ input, ctx }) => {
      return getDentistById(input.id, ctx.clinicId);
    }),
    create: clinicProcedure.input(z3.object({
      name: z3.string().min(1),
      cro: z3.string().min(1),
      specialty: z3.string().optional(),
      phone: z3.string().optional(),
      email: z3.string().email().optional().or(z3.literal("")),
      commission: z3.string().optional(),
      color: z3.string().optional()
    })).mutation(async ({ input, ctx }) => {
      return createDentist({
        ...input,
        clinicId: ctx.clinicId,
        email: input.email || void 0
      });
    }),
    update: clinicProcedure.input(z3.object({
      id: z3.number(),
      data: z3.object({
        name: z3.string().optional(),
        cro: z3.string().optional(),
        specialty: z3.string().optional(),
        phone: z3.string().optional(),
        email: z3.string().email().optional().or(z3.literal("")),
        commission: z3.string().optional(),
        color: z3.string().optional(),
        isActive: z3.boolean().optional()
      })
    })).mutation(async ({ input, ctx }) => {
      return updateDentist(input.id, input.data, ctx.clinicId);
    }),
    delete: clinicProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input, ctx }) => {
      return deleteDentist(input.id, ctx.clinicId);
    }),
    toggleActiveToday: clinicProcedure.input(z3.object({ id: z3.number(), isActiveToday: z3.boolean() })).mutation(async ({ input, ctx }) => {
      const checkedInAt = input.isActiveToday ? /* @__PURE__ */ new Date() : null;
      return updateDentist(input.id, {
        isActiveToday: input.isActiveToday,
        checkedInAt
      }, ctx.clinicId);
    })
  }),
  // Procedures - Multi-tenancy: filtra por clinicId
  procedures: router({
    list: clinicProcedure.input(z3.object({ search: z3.string().optional() }).optional()).query(async ({ input, ctx }) => {
      return getProcedures(input?.search, ctx.clinicId);
    }),
    getById: clinicProcedure.input(z3.object({ id: z3.number() })).query(async ({ input, ctx }) => {
      return getProcedureById(input.id, ctx.clinicId);
    }),
    create: clinicProcedure.input(z3.object({
      code: z3.string().optional(),
      name: z3.string().min(1),
      description: z3.string().optional(),
      categoryId: z3.number().optional(),
      pricePerTooth: z3.string(),
      priceUpperArch: z3.string().optional(),
      priceLowerArch: z3.string().optional(),
      duration: z3.number().optional(),
      faces: z3.string().optional()
    })).mutation(async ({ input, ctx }) => {
      return createProcedure({ ...input, clinicId: ctx.clinicId });
    }),
    update: clinicProcedure.input(z3.object({
      id: z3.number(),
      data: z3.object({
        code: z3.string().optional(),
        name: z3.string().optional(),
        description: z3.string().optional(),
        categoryId: z3.number().optional(),
        pricePerTooth: z3.string().optional(),
        priceUpperArch: z3.string().optional(),
        priceLowerArch: z3.string().optional(),
        duration: z3.number().optional(),
        faces: z3.string().optional(),
        isActive: z3.boolean().optional()
      })
    })).mutation(async ({ input, ctx }) => {
      return updateProcedure(input.id, input.data, ctx.clinicId);
    }),
    delete: clinicProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input, ctx }) => {
      return deleteProcedure(input.id, ctx.clinicId);
    }),
    categories: clinicProcedure.query(async ({ ctx }) => {
      return getProcedureCategories(ctx.clinicId);
    }),
    createCategory: clinicProcedure.input(z3.object({ name: z3.string().min(1), color: z3.string().optional() })).mutation(async ({ input, ctx }) => {
      return createProcedureCategory({ ...input, clinicId: ctx.clinicId });
    })
  }),
  // Patients of the day (with appointments today) - Multi-tenancy
  patientsToday: router({
    list: clinicProcedure.query(async ({ ctx }) => {
      return getPatientsWithAppointmentsToday(ctx.clinicId);
    })
  }),
  // Appointments - Multi-tenancy: filtra por clinicId
  appointments: router({
    list: clinicProcedure.input(z3.object({
      startDate: z3.string().optional(),
      endDate: z3.string().optional(),
      dentistId: z3.number().optional()
    }).optional()).query(async ({ input, ctx }) => {
      return getAppointments(input?.startDate, input?.endDate, input?.dentistId, ctx.clinicId);
    }),
    getById: clinicProcedure.input(z3.object({ id: z3.number() })).query(async ({ input, ctx }) => {
      return getAppointmentById(input.id, ctx.clinicId);
    }),
    create: clinicProcedure.input(z3.object({
      patientId: z3.number(),
      dentistId: z3.number().optional(),
      date: z3.string(),
      startTime: z3.string(),
      endTime: z3.string(),
      type: z3.string().optional(),
      notes: z3.string().optional(),
      chairId: z3.number().optional()
    })).mutation(async ({ input, ctx }) => {
      return createAppointment({
        ...input,
        clinicId: ctx.clinicId,
        date: new Date(input.date)
      });
    }),
    update: clinicProcedure.input(z3.object({
      id: z3.number(),
      data: z3.object({
        patientId: z3.number().optional(),
        dentistId: z3.number().optional(),
        date: z3.string().optional(),
        startTime: z3.string().optional(),
        endTime: z3.string().optional(),
        type: z3.string().optional(),
        status: z3.enum(["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"]).optional(),
        notes: z3.string().optional(),
        chairId: z3.number().optional()
      })
    })).mutation(async ({ input, ctx }) => {
      return updateAppointment(input.id, {
        ...input.data,
        date: input.data.date ? new Date(input.data.date) : void 0
      }, ctx.clinicId);
    }),
    delete: clinicProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input, ctx }) => {
      return deleteAppointment(input.id, ctx.clinicId);
    })
  }),
  // Budgets - Multi-tenancy: filtra por clinicId
  budgets: router({
    list: clinicProcedure.input(z3.object({ patientId: z3.number().optional() }).optional()).query(async ({ input, ctx }) => {
      return getBudgets(input?.patientId, ctx.clinicId);
    }),
    getById: clinicProcedure.input(z3.object({ id: z3.number() })).query(async ({ input, ctx }) => {
      return getBudgetById(input.id, ctx.clinicId);
    }),
    create: clinicProcedure.input(z3.object({
      patientId: z3.number(),
      dentistId: z3.number().optional(),
      totalValue: z3.string(),
      discountPercent: z3.string().optional(),
      discountValue: z3.string().optional(),
      finalValue: z3.string(),
      notes: z3.string().optional(),
      validUntil: z3.string().optional()
    })).mutation(async ({ input, ctx }) => {
      return createBudget({
        ...input,
        clinicId: ctx.clinicId,
        validUntil: input.validUntil ? new Date(input.validUntil) : void 0
      });
    }),
    update: clinicProcedure.input(z3.object({
      id: z3.number(),
      data: z3.object({
        status: z3.enum(["pending", "approved", "rejected", "in_progress", "completed"]).optional(),
        notes: z3.string().optional()
      })
    })).mutation(async ({ input, ctx }) => {
      return updateBudget(input.id, input.data, ctx.clinicId);
    }),
    getItems: clinicProcedure.input(z3.object({ budgetId: z3.number() })).query(async ({ input }) => {
      return getBudgetItems(input.budgetId);
    }),
    createItem: clinicProcedure.input(z3.object({
      budgetId: z3.number(),
      procedureId: z3.number(),
      toothNumber: z3.string().optional(),
      faces: z3.string().optional(),
      quantity: z3.number().optional(),
      unitPrice: z3.string(),
      totalPrice: z3.string(),
      phase: z3.enum(["urgent", "important", "aesthetic", "preventive"]).optional(),
      priority: z3.number().optional()
    })).mutation(async ({ input }) => {
      return createBudgetItem(input);
    }),
    // Aprovar item individual do orçamento
    approveItem: clinicProcedure.input(z3.object({ itemId: z3.number() })).mutation(async ({ input }) => {
      return updateBudgetItem(input.itemId, {
        status: "approved",
        approvedAt: /* @__PURE__ */ new Date()
      });
    }),
    // Rejeitar item individual do orçamento
    rejectItem: clinicProcedure.input(z3.object({
      itemId: z3.number(),
      reason: z3.string().optional()
    })).mutation(async ({ input }) => {
      return updateBudgetItem(input.itemId, {
        status: "rejected",
        rejectedAt: /* @__PURE__ */ new Date(),
        rejectionReason: input.reason
      });
    }),
    // Atualizar fase/prioridade do item
    updateItemPhase: clinicProcedure.input(z3.object({
      itemId: z3.number(),
      phase: z3.enum(["urgent", "important", "aesthetic", "preventive"]).optional(),
      priority: z3.number().optional()
    })).mutation(async ({ input }) => {
      const { itemId, ...data } = input;
      return updateBudgetItem(itemId, data);
    })
  }),
  // Transactions - Multi-tenancy: filtra por clinicId
  transactions: router({
    list: clinicProcedure.input(z3.object({
      startDate: z3.string().optional(),
      endDate: z3.string().optional(),
      type: z3.enum(["income", "expense"]).optional()
    }).optional()).query(async ({ input, ctx }) => {
      return getTransactions(input?.startDate, input?.endDate, input?.type, ctx.clinicId);
    }),
    create: clinicProcedure.input(z3.object({
      patientId: z3.number().optional(),
      budgetId: z3.number().optional(),
      type: z3.enum(["income", "expense"]),
      category: z3.string().optional(),
      description: z3.string().optional(),
      value: z3.string(),
      paymentMethod: z3.enum(["cash", "credit_card", "debit_card", "pix", "bank_transfer", "check", "insurance"]).optional(),
      date: z3.string(),
      status: z3.enum(["pending", "paid", "cancelled"]).optional()
    })).mutation(async ({ input, ctx }) => {
      return createTransaction({
        ...input,
        clinicId: ctx.clinicId,
        date: new Date(input.date)
      });
    }),
    update: clinicProcedure.input(z3.object({
      id: z3.number(),
      data: z3.object({
        status: z3.enum(["pending", "paid", "cancelled"]).optional(),
        paymentMethod: z3.enum(["cash", "credit_card", "debit_card", "pix", "bank_transfer", "check", "insurance"]).optional()
      })
    })).mutation(async ({ input, ctx }) => {
      return updateTransaction(input.id, input.data, ctx.clinicId);
    }),
    delete: clinicProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input, ctx }) => {
      return deleteTransaction(input.id, ctx.clinicId);
    })
  }),
  // Insurances - Multi-tenancy: filtra por clinicId
  insurances: router({
    list: clinicProcedure.query(async ({ ctx }) => {
      return getInsurances(ctx.clinicId);
    }),
    create: clinicProcedure.input(z3.object({
      name: z3.string().min(1),
      code: z3.string().optional(),
      phone: z3.string().optional(),
      email: z3.string().email().optional().or(z3.literal("")),
      discount: z3.string().optional()
    })).mutation(async ({ input, ctx }) => {
      return createInsurance({
        ...input,
        clinicId: ctx.clinicId,
        email: input.email || void 0
      });
    }),
    update: clinicProcedure.input(z3.object({
      id: z3.number(),
      data: z3.object({
        name: z3.string().optional(),
        code: z3.string().optional(),
        phone: z3.string().optional(),
        email: z3.string().email().optional().or(z3.literal("")),
        discount: z3.string().optional(),
        isActive: z3.boolean().optional()
      })
    })).mutation(async ({ input, ctx }) => {
      return updateInsurance(input.id, input.data, ctx.clinicId);
    }),
    delete: clinicProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input, ctx }) => {
      return deleteInsurance(input.id, ctx.clinicId);
    })
  }),
  // Stock - Multi-tenancy: filtra por clinicId
  stock: router({
    items: clinicProcedure.input(z3.object({ search: z3.string().optional() }).optional()).query(async ({ input, ctx }) => {
      return getStockItems(input?.search, ctx.clinicId);
    }),
    createItem: clinicProcedure.input(z3.object({
      name: z3.string().min(1),
      categoryId: z3.number().optional(),
      quantity: z3.number().optional(),
      minQuantity: z3.number().optional(),
      unit: z3.string().optional(),
      costPrice: z3.string().optional(),
      supplier: z3.string().optional(),
      expirationDate: z3.string().optional()
    })).mutation(async ({ input, ctx }) => {
      return createStockItem({
        ...input,
        clinicId: ctx.clinicId,
        expirationDate: input.expirationDate ? new Date(input.expirationDate) : void 0
      });
    }),
    updateItem: clinicProcedure.input(z3.object({
      id: z3.number(),
      data: z3.object({
        name: z3.string().optional(),
        categoryId: z3.number().optional(),
        quantity: z3.number().optional(),
        minQuantity: z3.number().optional(),
        unit: z3.string().optional(),
        costPrice: z3.string().optional(),
        supplier: z3.string().optional(),
        expirationDate: z3.string().optional()
      })
    })).mutation(async ({ input, ctx }) => {
      return updateStockItem(input.id, {
        ...input.data,
        expirationDate: input.data.expirationDate ? new Date(input.data.expirationDate) : void 0
      }, ctx.clinicId);
    }),
    deleteItem: clinicProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input, ctx }) => {
      return deleteStockItem(input.id, ctx.clinicId);
    }),
    categories: clinicProcedure.query(async ({ ctx }) => {
      return getStockCategories(ctx.clinicId);
    }),
    createCategory: clinicProcedure.input(z3.object({ name: z3.string().min(1) })).mutation(async ({ input, ctx }) => {
      return createStockCategory({ ...input, clinicId: ctx.clinicId });
    }),
    addMovement: clinicProcedure.input(z3.object({
      stockItemId: z3.number(),
      type: z3.enum(["in", "out"]),
      quantity: z3.number(),
      reason: z3.string().optional()
    })).mutation(async ({ input }) => {
      return createStockMovement(input);
    }),
    movements: clinicProcedure.input(z3.object({
      stockItemId: z3.number().optional(),
      limit: z3.number().optional()
    }).optional()).query(async ({ input, ctx }) => {
      return getStockMovements(input?.stockItemId, ctx.clinicId, input?.limit);
    }),
    summary: clinicProcedure.query(async ({ ctx }) => {
      const items = await getStockItems(void 0, ctx.clinicId);
      const movements = await getStockMovements(void 0, ctx.clinicId, 50);
      const totalItems = items.length;
      const totalQuantity = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
      const totalValue = items.reduce((sum, item) => {
        const qty = item.quantity ?? 0;
        const cost = parseFloat(item.costPrice ?? "0");
        return sum + qty * cost;
      }, 0);
      const lowStockItems = items.filter((item) => (item.quantity ?? 0) <= (item.minQuantity ?? 10));
      return {
        totalItems,
        totalQuantity,
        totalValue,
        lowStockCount: lowStockItems.length,
        lowStockItems: lowStockItems.slice(0, 5),
        recentMovements: movements.slice(0, 10)
      };
    })
  }),
  // Waiting Queue - Multi-tenancy: filtra por clinicId
  queue: router({
    list: clinicProcedure.input(z3.object({ queueType: z3.string().optional() }).optional()).query(async ({ input, ctx }) => {
      return getWaitingQueue(input?.queueType, ctx.clinicId);
    }),
    add: clinicProcedure.input(z3.object({
      patientId: z3.number(),
      queueType: z3.enum(["budget", "dentist", "orthodontics", "implant", "prosthetics", "maxillofacial", "pediatric"]).optional(),
      priority: z3.enum(["normal", "high", "urgent"]).optional(),
      dentistId: z3.number().optional(),
      notes: z3.string().optional()
    })).mutation(async ({ input, ctx }) => {
      return addToQueue({ ...input, clinicId: ctx.clinicId });
    }),
    updateStatus: clinicProcedure.input(z3.object({
      id: z3.number(),
      status: z3.enum(["waiting", "in_service", "completed", "cancelled"])
    })).mutation(async ({ input, ctx }) => {
      return updateQueueStatus(input.id, input.status, ctx.clinicId);
    })
  }),
  // Anamnesis
  anamnesis: router({
    get: publicProcedure.input(z3.object({ patientId: z3.number() })).query(async ({ input }) => {
      return getAnamnesis(input.patientId);
    }),
    save: publicProcedure.input(z3.object({
      patientId: z3.number(),
      heartDisease: z3.boolean().optional(),
      hypertension: z3.boolean().optional(),
      diabetes: z3.boolean().optional(),
      pregnancy: z3.boolean().optional(),
      allergies: z3.boolean().optional(),
      allergiesDescription: z3.string().optional(),
      medications: z3.boolean().optional(),
      medicationsDescription: z3.string().optional(),
      surgeries: z3.boolean().optional(),
      surgeriesDescription: z3.string().optional(),
      smoker: z3.boolean().optional(),
      alcohol: z3.boolean().optional(),
      notes: z3.string().optional()
    })).mutation(async ({ input }) => {
      return upsertAnamnesis(input);
    })
  }),
  // Treatments (Odontogram)
  treatments: router({
    list: publicProcedure.input(z3.object({ patientId: z3.number() })).query(async ({ input }) => {
      return getTreatments(input.patientId);
    }),
    create: publicProcedure.input(z3.object({
      patientId: z3.number(),
      toothNumber: z3.string(),
      face: z3.string().optional(),
      condition: z3.enum(["healthy", "cavity", "restoration", "extraction", "implant", "crown", "bridge", "canal", "fracture", "absent"]).optional(),
      procedureId: z3.number().optional(),
      notes: z3.string().optional()
    })).mutation(async ({ input }) => {
      return createTreatment(input);
    }),
    update: publicProcedure.input(z3.object({
      id: z3.number(),
      data: z3.object({
        condition: z3.enum(["healthy", "cavity", "restoration", "extraction", "implant", "crown", "bridge", "canal", "fracture", "absent"]).optional(),
        procedureId: z3.number().optional(),
        notes: z3.string().optional()
      })
    })).mutation(async ({ input }) => {
      return updateTreatment(input.id, input.data);
    }),
    delete: publicProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
      return deleteTreatment(input.id);
    })
  }),
  // Chairs - Multi-tenancy: filtra por clinicId
  chairs: router({
    list: clinicProcedure.query(async ({ ctx }) => {
      return getChairs(ctx.clinicId);
    }),
    create: clinicProcedure.input(z3.object({
      name: z3.string().min(1),
      description: z3.string().optional()
    })).mutation(async ({ input, ctx }) => {
      return createChair({ ...input, clinicId: ctx.clinicId });
    })
  }),
  // Clinic Settings - Multi-tenancy: filtra por clinicId
  settings: router({
    get: clinicProcedure.query(async ({ ctx }) => {
      return getClinicSettings(ctx.clinicId);
    }),
    save: clinicProcedure.input(z3.object({
      name: z3.string().optional(),
      cnpj: z3.string().optional(),
      cro: z3.string().optional(),
      phone: z3.string().optional(),
      email: z3.string().email().optional().or(z3.literal("")),
      address: z3.string().optional(),
      city: z3.string().optional(),
      state: z3.string().optional(),
      zipCode: z3.string().optional(),
      openTime: z3.string().optional(),
      closeTime: z3.string().optional(),
      appointmentDuration: z3.number().optional(),
      logoUrl: z3.string().optional(),
      logoData: z3.string().optional()
      // Logo como base64 data URL
    })).mutation(async ({ input, ctx }) => {
      return upsertClinicSettings(ctx.clinicId, {
        ...input,
        email: input.email || void 0
      });
    })
  }),
  // Laboratories - Multi-tenancy: filtra por clinicId
  laboratories: router({
    list: clinicProcedure.query(async ({ ctx }) => {
      return getLaboratories(ctx.clinicId);
    }),
    create: clinicProcedure.input(z3.object({
      name: z3.string().min(1),
      phone: z3.string().optional(),
      email: z3.string().email().optional().or(z3.literal("")),
      address: z3.string().optional(),
      contactPerson: z3.string().optional()
    })).mutation(async ({ input, ctx }) => {
      return createLaboratory({ ...input, clinicId: ctx.clinicId, email: input.email || void 0 });
    }),
    update: clinicProcedure.input(z3.object({
      id: z3.number(),
      data: z3.object({
        name: z3.string().optional(),
        phone: z3.string().optional(),
        email: z3.string().email().optional().or(z3.literal("")),
        address: z3.string().optional(),
        contactPerson: z3.string().optional(),
        isActive: z3.boolean().optional()
      })
    })).mutation(async ({ input, ctx }) => {
      return updateLaboratory(input.id, input.data, ctx.clinicId);
    }),
    delete: clinicProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input, ctx }) => {
      return deleteLaboratory(input.id, ctx.clinicId);
    })
  }),
  // Prosthesis Types - Multi-tenancy: filtra por clinicId
  prosthesisTypes: router({
    list: clinicProcedure.query(async ({ ctx }) => {
      return getProsthesisTypes(ctx.clinicId);
    }),
    create: clinicProcedure.input(z3.object({
      name: z3.string().min(1),
      description: z3.string().optional(),
      defaultPrice: z3.string().optional(),
      estimatedDays: z3.number().optional()
    })).mutation(async ({ input, ctx }) => {
      return createProsthesisType({ ...input, clinicId: ctx.clinicId });
    }),
    update: clinicProcedure.input(z3.object({
      id: z3.number(),
      data: z3.object({
        name: z3.string().optional(),
        description: z3.string().optional(),
        defaultPrice: z3.string().optional(),
        estimatedDays: z3.number().optional(),
        isActive: z3.boolean().optional()
      })
    })).mutation(async ({ input, ctx }) => {
      return updateProsthesisType(input.id, input.data, ctx.clinicId);
    }),
    delete: clinicProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input, ctx }) => {
      return deleteProsthesisType(input.id, ctx.clinicId);
    })
  }),
  // Prosthesis Orders - Multi-tenancy: filtra por clinicId
  prosthesisOrders: router({
    list: clinicProcedure.input(z3.object({ status: z3.string().optional() }).optional()).query(async ({ input, ctx }) => {
      return getProsthesisOrders(input?.status, ctx.clinicId);
    }),
    getById: clinicProcedure.input(z3.object({ id: z3.number() })).query(async ({ input, ctx }) => {
      return getProsthesisOrderById(input.id, ctx.clinicId);
    }),
    create: clinicProcedure.input(z3.object({
      patientId: z3.number(),
      dentistId: z3.number().optional(),
      laboratoryId: z3.number().optional(),
      prosthesisTypeId: z3.number().optional(),
      toothNumber: z3.string().optional(),
      color: z3.string().optional(),
      material: z3.string().optional(),
      price: z3.string().optional(),
      labCost: z3.string().optional(),
      orderDate: z3.string().optional(),
      expectedDate: z3.string().optional(),
      notes: z3.string().optional()
    })).mutation(async ({ input, ctx }) => {
      return createProsthesisOrder({
        ...input,
        clinicId: ctx.clinicId,
        orderDate: input.orderDate ? new Date(input.orderDate) : void 0,
        expectedDate: input.expectedDate ? new Date(input.expectedDate) : void 0
      });
    }),
    update: clinicProcedure.input(z3.object({
      id: z3.number(),
      data: z3.object({
        laboratoryId: z3.number().optional(),
        prosthesisTypeId: z3.number().optional(),
        toothNumber: z3.string().optional(),
        color: z3.string().optional(),
        material: z3.string().optional(),
        price: z3.string().optional(),
        labCost: z3.string().optional(),
        status: z3.enum(["pending", "sent_to_lab", "in_production", "ready", "delivered", "installed"]).optional(),
        expectedDate: z3.string().optional(),
        deliveryDate: z3.string().optional(),
        notes: z3.string().optional()
      })
    })).mutation(async ({ input, ctx }) => {
      return updateProsthesisOrder(input.id, {
        ...input.data,
        expectedDate: input.data.expectedDate ? new Date(input.data.expectedDate) : void 0,
        deliveryDate: input.data.deliveryDate ? new Date(input.data.deliveryDate) : void 0
      }, ctx.clinicId);
    }),
    delete: clinicProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input, ctx }) => {
      return deleteProsthesisOrder(input.id, ctx.clinicId);
    }),
    stats: clinicProcedure.query(async ({ ctx }) => {
      return getProsthesisStats(ctx.clinicId);
    })
  }),
  // AI Analysis - Multi-tenancy: filtra por clinicId
  aiAnalysis: router({
    list: clinicProcedure.input(z3.object({ patientId: z3.number().optional() }).optional()).query(async ({ input, ctx }) => {
      return getAiAnalyses(input?.patientId, ctx.clinicId);
    }),
    create: clinicProcedure.input(z3.object({
      patientId: z3.number(),
      imageUrl: z3.string().min(1),
      imageType: z3.enum(["panoramic", "periapical", "bitewing", "cephalometric", "intraoral"]).optional()
    })).mutation(async ({ input, ctx }) => {
      const patient = await getPatientById(input.patientId);
      if (!patient || patient.clinicId !== ctx.clinicId) {
        throw new TRPCError4({ code: "FORBIDDEN", message: "Acesso negado a este paciente" });
      }
      const crypto2 = await import("crypto");
      const imageHash = crypto2.createHash("sha256").update(input.imageUrl).digest("hex");
      const cachedAnalysis = await getAiAnalysisByImageHash(imageHash, ctx.clinicId);
      if (cachedAnalysis) {
        console.log(`[AI Analysis] Retornando an\xE1lise em cache para imagem ${imageHash}`);
        return {
          id: cachedAnalysis.id,
          isCached: true,
          findings: cachedAnalysis.findings,
          recommendations: cachedAnalysis.recommendations,
          confidence: cachedAnalysis.confidence,
          analyzedAt: cachedAnalysis.analyzedAt
        };
      }
      const result = await createAiAnalysis({ ...input, clinicId: ctx.clinicId, imageHash });
      const analysisPromise = (async () => {
        try {
          const imageTypeLabels = {
            panoramic: "Radiografia Panor\xE2mica",
            periapical: "Radiografia Periapical",
            bitewing: "Radiografia Interproximal (Bitewing)",
            cephalometric: "Radiografia Cefalm\xE9trica",
            intraoral: "Foto Intraoral"
          };
          const imageTypeLabel = imageTypeLabels[input.imageType || "panoramic"] || "Imagem Odontol\xF3gica";
          let pubmedContext = "";
          try {
            const searchTerms = {
              panoramic: "panoramic radiography dental diagnosis",
              periapical: "periapical radiography endodontic treatment",
              bitewing: "bitewing radiography caries detection",
              cephalometric: "cephalometric radiography orthodontics",
              intraoral: "intraoral photography dental examination"
            }[input.imageType || "panoramic"] || "dental radiography diagnosis";
            const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchTerms)}&retmax=3&retmode=json&sort=relevance`;
            const searchResponse = await fetch(searchUrl);
            const searchData = await searchResponse.json();
            if (searchData.esearchresult?.idlist?.length > 0) {
              const ids = searchData.esearchresult.idlist.join(",");
              const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids}&retmode=json`;
              const summaryResponse = await fetch(summaryUrl);
              const summaryData = await summaryResponse.json();
              pubmedContext = "\n\n## Refer\xEAncias Cient\xEDficas Relevantes (PubMed)\n";
              for (const id of searchData.esearchresult.idlist) {
                const article = summaryData.result?.[id];
                if (article) {
                  pubmedContext += `
- **${article.title}**
`;
                  pubmedContext += `  Autores: ${article.authors?.slice(0, 3).map((a) => a.name).join(", ") || "N/A"}${article.authors?.length > 3 ? " et al." : ""}
`;
                  pubmedContext += `  Publica\xE7\xE3o: ${article.source} (${article.pubdate})
`;
                  pubmedContext += `  PMID: ${id} - https://pubmed.ncbi.nlm.nih.gov/${id}/
`;
                }
              }
            }
          } catch (error) {
            console.error(`[AI Analysis] Erro ao buscar PubMed para an\xE1lise ${result.id}:`, error);
          }
          const systemPrompt = `Voc\xEA \xE9 um especialista em radiologia odontol\xF3gica e diagn\xF3stico por imagem dental com vasta experi\xEAncia cl\xEDnica.
Sua fun\xE7\xE3o \xE9 analisar imagens odontol\xF3gicas e fornecer uma avalia\xE7\xE3o detalhada baseada em evid\xEAncias cient\xEDficas.

Ao analisar a imagem, voc\xEA deve:
1. Identificar estruturas anat\xF4micas vis\xEDveis
2. Detectar poss\xEDveis altera\xE7\xF5es patol\xF3gicas (c\xE1ries, les\xF5es periapicais, doen\xE7a periodontal, etc.)
3. Avaliar a qualidade \xF3ssea e estruturas de suporte
4. Identificar tratamentos pr\xE9vios (restaura\xE7\xF5es, pr\xF3teses, implantes, tratamentos endod\xF4nticos)
5. Fornecer recomenda\xE7\xF5es cl\xEDnicas baseadas nos achados

Sempre baseie suas observa\xE7\xF5es em literatura cient\xEDfica reconhecida.
Quando relevante, cite refer\xEAncias de estudos publicados em peri\xF3dicos como:
- Journal of Dental Research
- Journal of Endodontics
- Journal of Periodontology
- Oral Surgery, Oral Medicine, Oral Pathology
- Dentomaxillofacial Radiology

IMPORTANTE: Esta \xE9 uma ferramenta de aux\xEDlio ao diagn\xF3stico. O diagn\xF3stico final deve ser realizado por um profissional qualificado.`;
          const userPrompt = `Analise esta ${imageTypeLabel} e forne\xE7a:

1. **ACHADOS**: Descreva detalhadamente o que voc\xEA observa na imagem, incluindo:
   - Estruturas anat\xF4micas identificadas
   - Altera\xE7\xF5es ou patologias detectadas
   - Tratamentos pr\xE9vios vis\xEDveis

2. **RECOMENDA\xC7\xD5ES**: Com base nos achados, sugira:
   - Exames complementares se necess\xE1rio
   - Poss\xEDveis tratamentos indicados
   - Acompanhamento recomendado

3. **REFER\xCANCIAS CIENT\xCDFICAS**: Cite estudos ou literatura relevante que suportam sua an\xE1lise.

Formate sua resposta de forma clara e organizada.${pubmedContext ? `

Refer\xEAncias cient\xEDficas dispon\xEDveis para consulta:${pubmedContext}` : ""}`;
          console.log(`[AI Analysis] Iniciando an\xE1lise ${result.id} com URL: ${input.imageUrl}`);
          let response;
          try {
            response = await invokeLLM({
              messages: [
                { role: "system", content: systemPrompt },
                {
                  role: "user",
                  content: [
                    { type: "text", text: userPrompt },
                    { type: "image_url", image_url: { url: input.imageUrl, detail: "high" } }
                  ]
                }
              ],
              max_tokens: 2e3
            });
            console.log(`[AI Analysis] Resposta recebida:`, JSON.stringify(response).substring(0, 500));
          } catch (llmError) {
            console.error(`[AI Analysis] Erro ao chamar LLM para an\xE1lise ${result.id}:`, llmError?.message);
            console.error(`[AI Analysis] Detalhes do erro LLM:`, llmError);
            throw llmError;
          }
          const analysisText = response.choices?.[0]?.message?.content;
          if (!analysisText) {
            console.error(`[AI Analysis] Resposta vazia. Resposta completa:`, JSON.stringify(response, null, 2));
            throw new Error("LLM retornou resposta vazia");
          }
          const analysisString = typeof analysisText === "string" ? analysisText : Array.isArray(analysisText) ? analysisText.map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n") : JSON.stringify(analysisText);
          if (!analysisString || analysisString.trim().length === 0) {
            throw new Error("An\xE1lise processada est\xE1 vazia");
          }
          let findings = "";
          let recommendations = "";
          const findingsMatch = analysisString.match(/\*\*ACHADOS\*\*[:\s]*([\s\S]*?)(?=\*\*RECOMENDAÇÕES\*\*|\*\*REFERÈNCIAS|$)/i);
          if (findingsMatch) {
            findings = findingsMatch[1].trim();
          }
          const recsMatch = analysisString.match(/\*\*RECOMENDAÇÕES\*\*[:\s]*([\s\S]*?)(?=\*\*REFERÈNCIAS|$)/i);
          if (recsMatch) {
            recommendations = recsMatch[1].trim();
          }
          if (!findings) {
            findings = analysisString;
          }
          if (pubmedContext && !recommendations.includes("pubmed")) {
            recommendations += pubmedContext;
          }
          await updateAiAnalysis(result.id, {
            analysisResult: analysisString,
            findings: findings || "An\xE1lise conclu\xEDda. Verifique o resultado completo.",
            recommendations: recommendations || "Consulte um profissional para avalia\xE7\xE3o cl\xEDnica.",
            confidence: "85",
            analyzedAt: /* @__PURE__ */ new Date()
          });
          console.log(`[AI Analysis] An\xE1lise ${result.id} conclu\xEDda com sucesso. Findings: ${findings?.substring(0, 100)}...`);
        } catch (error) {
          console.error(`[AI Analysis] Erro na an\xE1lise ${result.id}:`, error?.message || error);
          console.error(`[AI Analysis] Stack trace:`, error?.stack);
          const errorMessage = error?.message || "Erro desconhecido";
          await updateAiAnalysis(result.id, {
            findings: `Erro ao processar a an\xE1lise: ${errorMessage}`,
            recommendations: "Recomendamos enviar a imagem novamente ou consultar um profissional.",
            confidence: "0",
            analyzedAt: /* @__PURE__ */ new Date()
          });
        }
      })();
      analysisPromise.catch((error) => {
        console.error(`[AI Analysis] Erro n\xE3o capturado na an\xE1lise ${result.id}:`, error);
      });
      return result;
    }),
    update: publicProcedure.input(z3.object({
      id: z3.number(),
      data: z3.object({
        analysisResult: z3.string().optional(),
        findings: z3.string().optional(),
        recommendations: z3.string().optional(),
        confidence: z3.string().optional(),
        analyzedAt: z3.string().optional()
      })
    })).mutation(async ({ input }) => {
      return updateAiAnalysis(input.id, {
        ...input.data,
        analyzedAt: input.data.analyzedAt ? new Date(input.data.analyzedAt) : void 0
      });
    }),
    // Rota para verificar status de uma análise
    getById: publicProcedure.input(z3.object({ id: z3.number() })).query(async ({ input }) => {
      const analyses = await getAiAnalyses();
      return analyses.find((a) => a.id === input.id) || null;
    })
  }),
  // Check-ins - Multi-tenancy: filtra por clinicId
  checkins: router({
    list: clinicProcedure.input(z3.object({ status: z3.string().optional() }).optional()).query(async ({ input, ctx }) => {
      return getCheckins(input?.status, ctx.clinicId);
    }),
    // Criação pública de check-in (para pacientes via QR Code)
    create: publicProcedure.input(z3.object({
      patientId: z3.number().optional(),
      patientName: z3.string(),
      phone: z3.string(),
      reason: z3.string().optional(),
      queueType: z3.enum(["budget", "dentist", "orthodontics", "implant", "prosthetics", "maxillofacial", "pediatric"]).optional(),
      clinicId: z3.number()
    })).mutation(async ({ input }) => {
      if (!input.clinicId || input.clinicId === 0) {
        throw new TRPCError4({
          code: "BAD_REQUEST",
          message: "ID da cl\xEDnica \xE9 obrigat\xF3rio. Acesse o check-in atrav\xE9s do QR Code da cl\xEDnica."
        });
      }
      const clinic = await getClinicById(input.clinicId);
      if (!clinic) {
        throw new TRPCError4({
          code: "NOT_FOUND",
          message: "Cl\xEDnica n\xE3o encontrada."
        });
      }
      return createCheckin(input);
    }),
    // Obter posição na fila (público para pacientes acompanharem)
    getQueuePosition: publicProcedure.input(z3.object({ id: z3.number() })).query(async ({ input }) => {
      return getCheckinQueuePosition(input.id);
    }),
    update: clinicProcedure.input(z3.object({
      id: z3.number(),
      data: z3.object({
        status: z3.enum(["waiting", "called", "in_service", "completed"]).optional(),
        calledTime: z3.string().optional()
      })
    })).mutation(async ({ input, ctx }) => {
      return updateCheckin(input.id, {
        ...input.data,
        calledTime: input.data.calledTime ? new Date(input.data.calledTime) : void 0
      }, ctx.clinicId);
    })
  }),
  // Patient Documents
  documents: router({
    list: publicProcedure.input(z3.object({
      patientId: z3.number(),
      type: z3.string().optional()
    })).query(async ({ input }) => {
      return getPatientDocuments(input.patientId, input.type);
    }),
    create: publicProcedure.input(z3.object({
      patientId: z3.number(),
      type: z3.enum(["image", "document", "xray", "receipt"]).optional(),
      name: z3.string().min(1),
      url: z3.string().min(1),
      description: z3.string().optional()
    })).mutation(async ({ input }) => {
      return createPatientDocument(input);
    }),
    delete: publicProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
      return deletePatientDocument(input.id);
    })
  }),
  // WhatsApp Notifications
  whatsapp: router({
    list: publicProcedure.input(z3.object({ status: z3.string().optional(), type: z3.string().optional() }).optional()).query(async ({ input }) => {
      return getWhatsappNotifications(input);
    }),
    create: publicProcedure.input(z3.object({
      patientId: z3.number().optional(),
      appointmentId: z3.number().optional(),
      phone: z3.string().min(1),
      type: z3.enum(["appointment_reminder", "queue_call", "confirmation", "followup", "custom"]).optional(),
      message: z3.string().min(1),
      scheduledFor: z3.string().optional()
    })).mutation(async ({ input }) => {
      return createWhatsappNotification({
        ...input,
        scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : void 0
      });
    }),
    updateStatus: publicProcedure.input(z3.object({
      id: z3.number(),
      status: z3.enum(["pending", "sent", "delivered", "read", "failed"]),
      errorMessage: z3.string().optional()
    })).mutation(async ({ input }) => {
      return updateWhatsappNotification(input.id, {
        status: input.status,
        errorMessage: input.errorMessage,
        sentAt: input.status === "sent" ? /* @__PURE__ */ new Date() : void 0
      });
    }),
    getPending: publicProcedure.query(async () => {
      return getPendingNotifications();
    })
  }),
  // Notification Settings
  notificationSettings: router({
    get: publicProcedure.query(async () => {
      return getNotificationSettings();
    }),
    save: publicProcedure.input(z3.object({
      appointmentReminderEnabled: z3.boolean().optional(),
      reminderHoursBefore: z3.number().optional(),
      queueCallEnabled: z3.boolean().optional(),
      confirmationEnabled: z3.boolean().optional(),
      followupEnabled: z3.boolean().optional(),
      followupDaysAfter: z3.number().optional(),
      whatsappApiKey: z3.string().optional(),
      whatsappPhoneId: z3.string().optional()
    })).mutation(async ({ input }) => {
      return upsertNotificationSettings(input);
    })
  }),
  // Orthodontic Treatments
  orthodontics: router({
    list: publicProcedure.input(z3.object({ patientId: z3.number().optional(), dentistId: z3.number().optional(), status: z3.string().optional() }).optional()).query(async ({ input }) => {
      return getOrthodonticTreatments(input);
    }),
    getById: publicProcedure.input(z3.object({ id: z3.number() })).query(async ({ input }) => {
      return getOrthodonticTreatmentById(input.id);
    }),
    create: publicProcedure.input(z3.object({
      patientId: z3.number(),
      dentistId: z3.number().optional(),
      type: z3.enum(["fixed_braces", "invisible_aligner", "retainer", "expander", "other"]).optional(),
      startDate: z3.string().optional(),
      estimatedEndDate: z3.string().optional(),
      upperArch: z3.string().optional(),
      lowerArch: z3.string().optional(),
      bracketType: z3.string().optional(),
      notes: z3.string().optional(),
      totalValue: z3.string().optional()
    })).mutation(async ({ input }) => {
      return createOrthodonticTreatment({
        ...input,
        startDate: input.startDate ? new Date(input.startDate) : void 0,
        estimatedEndDate: input.estimatedEndDate ? new Date(input.estimatedEndDate) : void 0
      });
    }),
    update: publicProcedure.input(z3.object({
      id: z3.number(),
      data: z3.object({
        status: z3.enum(["planning", "active", "maintenance", "completed", "cancelled"]).optional(),
        actualEndDate: z3.string().optional(),
        notes: z3.string().optional()
      })
    })).mutation(async ({ input }) => {
      return updateOrthodonticTreatment(input.id, {
        ...input.data,
        actualEndDate: input.data.actualEndDate ? new Date(input.data.actualEndDate) : void 0
      });
    }),
    stats: publicProcedure.input(z3.object({ dentistId: z3.number().optional() }).optional()).query(async ({ input }) => {
      return getOrthodontistStats(input?.dentistId);
    })
  }),
  // Orthodontic Maintenances
  orthodonticMaintenances: router({
    list: publicProcedure.input(z3.object({ treatmentId: z3.number() })).query(async ({ input }) => {
      return getOrthodonticMaintenances(input.treatmentId);
    }),
    create: publicProcedure.input(z3.object({
      treatmentId: z3.number(),
      appointmentId: z3.number().optional(),
      date: z3.string(),
      procedure: z3.string().optional(),
      wireChange: z3.boolean().optional(),
      wireType: z3.string().optional(),
      elasticChange: z3.boolean().optional(),
      elasticType: z3.string().optional(),
      notes: z3.string().optional(),
      nextAppointmentDate: z3.string().optional()
    })).mutation(async ({ input }) => {
      return createOrthodonticMaintenance({
        ...input,
        date: new Date(input.date),
        nextAppointmentDate: input.nextAppointmentDate ? new Date(input.nextAppointmentDate) : void 0
      });
    })
  }),
  // Implant Plans
  implants: router({
    list: publicProcedure.input(z3.object({ patientId: z3.number().optional(), dentistId: z3.number().optional(), status: z3.string().optional() }).optional()).query(async ({ input }) => {
      return getImplantPlans(input);
    }),
    getById: publicProcedure.input(z3.object({ id: z3.number() })).query(async ({ input }) => {
      return getImplantPlanById(input.id);
    }),
    create: publicProcedure.input(z3.object({
      patientId: z3.number(),
      dentistId: z3.number().optional(),
      toothNumber: z3.string(),
      implantBrand: z3.string().optional(),
      implantModel: z3.string().optional(),
      implantDiameter: z3.string().optional(),
      implantLength: z3.string().optional(),
      boneGraft: z3.boolean().optional(),
      boneGraftType: z3.string().optional(),
      sinusLift: z3.boolean().optional(),
      surgeryDate: z3.string().optional(),
      healingTime: z3.number().optional(),
      totalValue: z3.string().optional(),
      notes: z3.string().optional(),
      ctScanUrl: z3.string().optional()
    })).mutation(async ({ input }) => {
      return createImplantPlan({
        ...input,
        surgeryDate: input.surgeryDate ? new Date(input.surgeryDate) : void 0
      });
    }),
    update: publicProcedure.input(z3.object({
      id: z3.number(),
      data: z3.object({
        status: z3.enum(["planning", "surgery_scheduled", "implant_placed", "healing", "prosthesis_phase", "completed"]).optional(),
        surgeryDate: z3.string().optional(),
        prosthesisDate: z3.string().optional(),
        notes: z3.string().optional()
      })
    })).mutation(async ({ input }) => {
      return updateImplantPlan(input.id, {
        ...input.data,
        surgeryDate: input.data.surgeryDate ? new Date(input.data.surgeryDate) : void 0,
        prosthesisDate: input.data.prosthesisDate ? new Date(input.data.prosthesisDate) : void 0
      });
    }),
    stats: publicProcedure.input(z3.object({ dentistId: z3.number().optional() }).optional()).query(async ({ input }) => {
      return getImplantologistStats(input?.dentistId);
    })
  }),
  // User Permissions
  permissions: router({
    get: publicProcedure.input(z3.object({ userId: z3.number() })).query(async ({ input }) => {
      return getUserPermissions(input.userId);
    }),
    set: publicProcedure.input(z3.object({
      userId: z3.number(),
      module: z3.string(),
      canView: z3.boolean().optional(),
      canCreate: z3.boolean().optional(),
      canEdit: z3.boolean().optional(),
      canDelete: z3.boolean().optional()
    })).mutation(async ({ input }) => {
      return setUserPermission(input);
    }),
    delete: publicProcedure.input(z3.object({ userId: z3.number() })).mutation(async ({ input }) => {
      return deleteUserPermissions(input.userId);
    })
  }),
  // Access Profiles
  accessProfiles: router({
    list: publicProcedure.query(async () => {
      return getAccessProfiles();
    }),
    create: publicProcedure.input(z3.object({
      name: z3.string().min(1),
      description: z3.string().optional(),
      permissions: z3.string().optional(),
      isDefault: z3.boolean().optional()
    })).mutation(async ({ input }) => {
      return createAccessProfile(input);
    }),
    update: publicProcedure.input(z3.object({
      id: z3.number(),
      data: z3.object({
        name: z3.string().optional(),
        description: z3.string().optional(),
        permissions: z3.string().optional(),
        isDefault: z3.boolean().optional()
      })
    })).mutation(async ({ input }) => {
      return updateAccessProfile(input.id, input.data);
    }),
    delete: publicProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
      return deleteAccessProfile(input.id);
    })
  }),
  // Dentist Area
  dentistArea: router({
    stats: publicProcedure.input(z3.object({ dentistId: z3.number() })).query(async ({ input }) => {
      return getDentistAreaStats(input.dentistId);
    })
  }),
  // Consultórios
  offices: router({
    list: clinicProcedure.query(async ({ ctx }) => {
      return getOfficesByClinic(ctx.clinicId);
    }),
    active: clinicProcedure.query(async ({ ctx }) => {
      return getActiveOfficesByClinic(ctx.clinicId);
    }),
    getById: clinicProcedure.input(z3.object({ id: z3.number() })).query(async ({ input, ctx }) => {
      const office = await getOfficeById(input.id);
      if (office && office.clinicId !== ctx.clinicId) {
        throw new TRPCError4({ code: "FORBIDDEN", message: "Acesso negado a este consult\xF3rio" });
      }
      return office;
    }),
    create: clinicProcedure.input(z3.object({
      name: z3.string(),
      number: z3.string().optional(),
      floor: z3.string().optional(),
      description: z3.string().optional(),
      specialties: z3.string().optional(),
      isActive: z3.boolean().optional()
    })).mutation(async ({ input, ctx }) => {
      return createOffice({ ...input, clinicId: ctx.clinicId });
    }),
    update: clinicProcedure.input(z3.object({
      id: z3.number(),
      data: z3.object({
        name: z3.string().optional(),
        number: z3.string().optional(),
        floor: z3.string().optional(),
        description: z3.string().optional(),
        specialties: z3.string().optional(),
        isActive: z3.boolean().optional()
      })
    })).mutation(async ({ input, ctx }) => {
      const office = await getOfficeById(input.id);
      if (!office || office.clinicId !== ctx.clinicId) {
        throw new TRPCError4({ code: "FORBIDDEN", message: "Acesso negado a este consult\xF3rio" });
      }
      return updateOffice(input.id, input.data);
    }),
    delete: clinicProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input, ctx }) => {
      const office = await getOfficeById(input.id);
      if (!office || office.clinicId !== ctx.clinicId) {
        throw new TRPCError4({ code: "FORBIDDEN", message: "Acesso negado a este consult\xF3rio" });
      }
      return deleteOffice(input.id);
    })
  }),
  // Fila de Atendimento
  serviceQueue: router({
    list: clinicProcedure.input(z3.object({ queueType: z3.string().optional() }).optional()).query(async ({ input, ctx }) => {
      const clinicId = ctx.user.clinicId ?? 1;
      return getServiceQueue(input?.queueType, clinicId);
    }),
    stats: clinicProcedure.query(async ({ ctx }) => {
      const clinicId = ctx.user.clinicId ?? 1;
      return getServiceQueueStats(clinicId);
    }),
    getById: clinicProcedure.input(z3.object({ id: z3.number() })).query(async ({ input }) => {
      return getServiceQueueEntry(input.id);
    }),
    add: clinicProcedure.input(z3.object({
      patientId: z3.number(),
      patientName: z3.string(),
      queueType: z3.enum(["reception", "budget", "dentist", "orthodontics", "implant", "prosthetics", "maxillofacial", "pediatric"]),
      priority: z3.enum(["normal", "high", "urgent"]).optional(),
      notes: z3.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const clinicId = ctx.user.clinicId ?? 1;
      return addToServiceQueue({ ...input, clinicId });
    }),
    update: clinicProcedure.input(z3.object({
      id: z3.number(),
      data: z3.object({
        queueType: z3.enum(["reception", "budget", "dentist", "orthodontics", "implant", "prosthetics"]).optional(),
        status: z3.enum(["waiting", "called", "in_service", "pending_payment", "completed", "forwarded"]).optional(),
        priority: z3.enum(["normal", "high", "urgent"]).optional(),
        notes: z3.string().optional()
      })
    })).mutation(async ({ input }) => {
      return updateServiceQueueEntry(input.id, input.data);
    }),
    callPatient: clinicProcedure.input(z3.object({
      id: z3.number(),
      officeId: z3.number(),
      officeName: z3.string(),
      professionalId: z3.number().optional(),
      professionalName: z3.string().optional()
    })).mutation(async ({ input }) => {
      return callPatientFromQueue(input.id, input.officeId, input.officeName, input.professionalId, input.professionalName);
    }),
    startService: clinicProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
      return startService(input.id);
    }),
    forward: clinicProcedure.input(z3.object({
      id: z3.number(),
      nextQueue: z3.string(),
      notes: z3.string().optional(),
      evaluationNotes: z3.string().optional(),
      amountToPay: z3.number().optional(),
      professionalId: z3.number().optional()
    })).mutation(async ({ input }) => {
      return finishServiceAndForward(input.id, input.nextQueue, input.notes, input.evaluationNotes, input.amountToPay, input.professionalId);
    }),
    requestPayment: clinicProcedure.input(z3.object({
      id: z3.number(),
      amountToPay: z3.number(),
      evaluationNotes: z3.string().optional()
    })).mutation(async ({ input }) => {
      return requestPayment(input.id, input.amountToPay, input.evaluationNotes);
    }),
    receivePayment: clinicProcedure.input(z3.object({
      id: z3.number(),
      amountPaid: z3.number(),
      paymentMethod: z3.string()
    })).mutation(async ({ input }) => {
      return receivePayment(input.id, input.amountPaid, input.paymentMethod);
    }),
    complete: clinicProcedure.input(z3.object({
      id: z3.number(),
      notes: z3.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const clinicId = ctx.user.clinicId ?? 1;
      return completeService(input.id, input.notes, clinicId);
    }),
    cancel: clinicProcedure.input(z3.object({
      id: z3.number(),
      reason: z3.string().optional()
    })).mutation(async ({ input }) => {
      return cancelServiceQueueEntry(input.id, input.reason);
    }),
    history: clinicProcedure.input(z3.object({ patientId: z3.number() })).query(async ({ input }) => {
      return getQueueHistoryByPatient(input.patientId);
    })
  }),
  // Painel TV
  tvPanel: router({
    activeCalls: publicProcedure.query(async () => {
      return getActiveTvPanelCalls();
    }),
    recentCalls: publicProcedure.query(async () => {
      return getRecentTvPanelCalls();
    })
  }),
  // Stripe - Pagamentos
  stripe: router({
    isConfigured: publicProcedure.query(() => {
      return { configured: isStripeConfigured() };
    }),
    createCheckoutSession: publicProcedure.input(z3.object({
      patientId: z3.number(),
      patientName: z3.string(),
      patientEmail: z3.string().email().optional(),
      budgetId: z3.number().optional(),
      amount: z3.number(),
      // em centavos
      description: z3.string()
    })).mutation(async ({ input, ctx }) => {
      if (!stripe) {
        throw new Error("Stripe n\xE3o configurado");
      }
      const origin = getOriginFromRequest(ctx.req);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: input.description,
                description: `Paciente: ${input.patientName}`
              },
              unit_amount: input.amount
            },
            quantity: 1
          }
        ],
        mode: "payment",
        success_url: `${origin}/financeiro?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/financeiro?payment=cancelled`,
        customer_email: input.patientEmail,
        client_reference_id: input.patientId.toString(),
        metadata: {
          patient_id: input.patientId.toString(),
          patient_name: input.patientName,
          budget_id: input.budgetId?.toString() || ""
        },
        allow_promotion_codes: true
      });
      return { url: session.url, sessionId: session.id };
    }),
    getPaymentStatus: publicProcedure.input(z3.object({ sessionId: z3.string() })).query(async ({ input }) => {
      if (!stripe) {
        throw new Error("Stripe n\xE3o configurado");
      }
      const session = await stripe.checkout.sessions.retrieve(input.sessionId);
      return {
        status: session.payment_status,
        amountTotal: session.amount_total,
        customerEmail: session.customer_email
      };
    }),
    // Criar link de pagamento para orçamento
    createPaymentLink: clinicProcedure.input(z3.object({
      budgetId: z3.number(),
      patientId: z3.number(),
      patientName: z3.string(),
      patientEmail: z3.string().email().optional(),
      patientPhone: z3.string().optional(),
      amount: z3.number(),
      // em centavos
      description: z3.string(),
      expiresInDays: z3.number().optional().default(7)
    })).mutation(async ({ input, ctx }) => {
      if (!stripe) {
        throw new Error("Stripe n\xE3o configurado");
      }
      const origin = getOriginFromRequest(ctx.req);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card", "boleto"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: `Or\xE7amento #${input.budgetId}`,
                description: input.description
              },
              unit_amount: input.amount
            },
            quantity: 1
          }
        ],
        mode: "payment",
        success_url: `${origin}/pagamento-sucesso?budget_id=${input.budgetId}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/orcamentos?payment=cancelled&budget_id=${input.budgetId}`,
        customer_email: input.patientEmail,
        client_reference_id: input.patientId.toString(),
        metadata: {
          patient_id: input.patientId.toString(),
          patient_name: input.patientName,
          budget_id: input.budgetId.toString(),
          clinic_id: ctx.clinicId.toString()
        },
        expires_at: Math.floor(Date.now() / 1e3) + input.expiresInDays * 24 * 60 * 60,
        allow_promotion_codes: true,
        phone_number_collection: { enabled: true }
      });
      return {
        url: session.url,
        sessionId: session.id,
        expiresAt: new Date(session.expires_at * 1e3).toISOString()
      };
    })
  }),
  // File Upload
  upload: router({
    file: publicProcedure.input(z3.object({
      fileName: z3.string(),
      fileData: z3.string(),
      // base64
      contentType: z3.string(),
      folder: z3.string().optional()
    })).mutation(async ({ input }) => {
      const buffer = Buffer.from(input.fileData, "base64");
      const folder = input.folder || "uploads";
      const timestamp2 = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const key = `${folder}/${timestamp2}-${randomSuffix}-${input.fileName}`;
      await storagePut(key, buffer, input.contentType);
      const proxyUrl = `/api/storage/image?key=${encodeURIComponent(key)}`;
      return { url: proxyUrl, key };
    }),
    // Proxy para servir imagens do storage (contorna problema de CORS/acesso)
    getImageUrl: publicProcedure.input(z3.object({
      key: z3.string()
    })).query(async ({ input }) => {
      try {
        const { url } = await storageGet(input.key);
        return { url };
      } catch (error) {
        return { url: null };
      }
    })
  }),
  // Admin - Gerenciamento de Clínicas e Usuários (apenas superadmin)
  admin: router({
    // Estatísticas gerais
    stats: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user || ctx.user.role !== "superadmin") {
        throw new Error("Acesso negado");
      }
      const clinicsCount = await getClinicsCount();
      const clinics2 = await getClinics();
      const users2 = await getAllUsers();
      return {
        totalClinics: clinicsCount,
        totalUsers: users2.length,
        activeClinics: clinics2.filter((c) => c.isActive).length,
        activeUsers: users2.filter((u) => u.isActive).length
      };
    }),
    // Clínicas
    clinics: router({
      // Procedure pública para buscar dados da clínica (para check-in e painel TV)
      getPublicInfo: publicProcedure.input(z3.object({ id: z3.number() })).query(async ({ input }) => {
        const clinic = await getClinicById(input.id);
        if (!clinic) {
          return null;
        }
        return {
          id: clinic.id,
          name: clinic.name,
          logoUrl: clinic.logoUrl
        };
      }),
      list: publicProcedure.query(async ({ ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin") {
          throw new Error("Acesso negado");
        }
        return getClinics();
      }),
      getById: publicProcedure.input(z3.object({ id: z3.number() })).query(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin") {
          throw new Error("Acesso negado");
        }
        return getClinicById(input.id);
      }),
      create: publicProcedure.input(z3.object({
        name: z3.string().min(2),
        slug: z3.string().min(2),
        cnpj: z3.string().optional(),
        cro: z3.string().optional(),
        phone: z3.string().optional(),
        email: z3.string().email().optional(),
        address: z3.string().optional(),
        city: z3.string().optional(),
        state: z3.string().optional(),
        zipCode: z3.string().optional(),
        logoUrl: z3.string().optional()
      })).mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin") {
          throw new Error("Acesso negado");
        }
        return createClinic({
          ...input,
          isActive: true
        });
      }),
      update: publicProcedure.input(z3.object({
        id: z3.number(),
        name: z3.string().optional(),
        slug: z3.string().optional(),
        cnpj: z3.string().optional(),
        cro: z3.string().optional(),
        phone: z3.string().optional(),
        email: z3.string().optional(),
        address: z3.string().optional(),
        city: z3.string().optional(),
        state: z3.string().optional(),
        zipCode: z3.string().optional(),
        logoUrl: z3.string().optional(),
        isActive: z3.boolean().optional()
      })).mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin") {
          throw new Error("Acesso negado");
        }
        const { id, ...data } = input;
        await updateClinic(id, data);
        return { success: true };
      }),
      delete: publicProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin") {
          throw new Error("Acesso negado");
        }
        await deleteClinic(input.id);
        return { success: true };
      }),
      getUsers: publicProcedure.input(z3.object({ clinicId: z3.number() })).query(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin") {
          throw new Error("Acesso negado");
        }
        return getClinicUsers(input.clinicId);
      }),
      // Gestão de usuários da clínica (para admins da clínica)
      getUsersWithDetails: publicProcedure.input(z3.object({ clinicId: z3.number() })).query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("N\xE3o autenticado");
        return getClinicUsersWithDetails(input.clinicId);
      }),
      inviteUser: publicProcedure.input(z3.object({
        email: z3.string().email(),
        clinicId: z3.number(),
        role: z3.enum(["owner", "admin", "atendente", "dentista", "protesista", "ortodontista", "implantodontista", "bucomaxilo", "odontopediatria"])
      })).mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("N\xE3o autenticado");
        return inviteUserToClinic(input.email, input.clinicId, input.role);
      }),
      updateUserRole: publicProcedure.input(z3.object({
        userClinicId: z3.number(),
        role: z3.enum(["owner", "admin", "atendente", "dentista", "protesista", "ortodontista", "implantodontista", "bucomaxilo", "odontopediatria"])
      })).mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("N\xE3o autenticado");
        await updateUserClinicById(input.userClinicId, { role: input.role });
        return { success: true };
      }),
      toggleUserActive: publicProcedure.input(z3.object({
        userClinicId: z3.number(),
        isActive: z3.boolean()
      })).mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("N\xE3o autenticado");
        await updateUserClinicById(input.userClinicId, { isActive: input.isActive });
        return { success: true };
      }),
      removeUser: publicProcedure.input(z3.object({ userClinicId: z3.number() })).mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("N\xE3o autenticado");
        await removeUserFromClinicById(input.userClinicId);
        return { success: true };
      })
    }),
    // Usuários
    users: router({
      list: publicProcedure.query(async ({ ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin" && ctx.user.role !== "admin") {
          throw new Error("Acesso negado");
        }
        if (ctx.user.role === "superadmin") {
          return getAllUsers();
        }
        const clinicId = ctx.user.clinicId;
        if (!clinicId) {
          return [];
        }
        return getUsersByClinicId(clinicId);
      }),
      getById: publicProcedure.input(z3.object({ id: z3.number() })).query(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin" && ctx.user.role !== "admin") {
          throw new Error("Acesso negado");
        }
        return getUserById(input.id);
      }),
      create: publicProcedure.input(z3.object({
        email: z3.string().email(),
        password: z3.string().min(6),
        name: z3.string().min(2),
        phone: z3.string().optional(),
        role: z3.enum(["user", "admin", "superadmin"]),
        clinicId: z3.number().optional(),
        clinicRole: z3.enum(["owner", "admin", "atendente", "dentista", "protesista", "ortodontista", "implantodontista", "bucomaxilo", "odontopediatria"]).optional()
      })).mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin" && ctx.user.role !== "admin") {
          throw new Error("Acesso negado");
        }
        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          throw new Error("Email j\xE1 cadastrado");
        }
        const adminClinicId = input.clinicId || ctx.user.clinicId;
        const newUser = await createUserWithPassword({
          ...input,
          clinicId: adminClinicId ?? void 0
        });
        if (adminClinicId && newUser.id) {
          await addUserToClinic({
            userId: newUser.id,
            clinicId: adminClinicId,
            role: input.clinicRole || "atendente",
            isActive: true
          });
        }
        return newUser;
      }),
      update: publicProcedure.input(z3.object({
        id: z3.number(),
        name: z3.string().optional(),
        phone: z3.string().optional(),
        role: z3.enum(["user", "admin", "superadmin"]).optional(),
        clinicId: z3.number().nullable().optional(),
        isActive: z3.boolean().optional()
      })).mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin" && ctx.user.role !== "admin") {
          throw new Error("Acesso negado");
        }
        const { id, ...data } = input;
        await updateUser(id, data);
        return { success: true };
      }),
      delete: publicProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin" && ctx.user.role !== "admin") {
          throw new Error("Acesso negado");
        }
        await deleteUser(input.id);
        return { success: true };
      }),
      resetPassword: publicProcedure.input(z3.object({
        id: z3.number(),
        newPassword: z3.string().min(6)
      })).mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin" && ctx.user.role !== "admin") {
          throw new Error("Acesso negado");
        }
        await updateUserPassword(input.id, input.newPassword);
        return { success: true };
      }),
      getClinics: publicProcedure.input(z3.object({ userId: z3.number() })).query(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin" && ctx.user.role !== "admin") {
          throw new Error("Acesso negado");
        }
        return getUserClinics(input.userId);
      }),
      addToClinic: publicProcedure.input(z3.object({
        userId: z3.number(),
        clinicId: z3.number(),
        role: z3.enum(["owner", "admin", "atendente", "dentista", "protesista", "ortodontista", "implantodontista", "bucomaxilo", "odontopediatria"])
      })).mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin" && ctx.user.role !== "admin") {
          throw new Error("Acesso negado");
        }
        return addUserToClinic(input);
      }),
      removeFromClinic: publicProcedure.input(z3.object({
        userId: z3.number(),
        clinicId: z3.number()
      })).mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin" && ctx.user.role !== "admin") {
          throw new Error("Acesso negado");
        }
        await removeUserFromClinic(input.userId, input.clinicId);
        return { success: true };
      }),
      // Obter o cargo do usuário atual na clínica
      getCurrentUserClinicRole: publicProcedure.query(async ({ ctx }) => {
        if (!ctx.user) throw new Error("N\xE3o autenticado");
        if (ctx.user.role === "superadmin") {
          return { role: "admin" };
        }
        if (ctx.user.clinicId) {
          const userClinic = await getUserClinicRole(ctx.user.id, ctx.user.clinicId);
          if (userClinic) {
            return { role: userClinic.role };
          }
        }
        if (ctx.user.role === "admin") {
          return { role: "admin" };
        }
        return { role: "atendente" };
      })
    }),
    // Permissões por cargo
    permissions: router({
      list: publicProcedure.query(async ({ ctx }) => {
        if (!ctx.user) throw new Error("N\xE3o autenticado");
        return getAllRolePermissions();
      }),
      getByRole: publicProcedure.input(z3.object({ role: z3.string() })).query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("N\xE3o autenticado");
        return getRolePermissions(input.role);
      }),
      update: publicProcedure.input(z3.object({
        role: z3.string(),
        permissions: z3.object({
          canViewPainel: z3.boolean().optional(),
          canViewAtendente: z3.boolean().optional(),
          canViewPacientes: z3.boolean().optional(),
          canViewProntuarios: z3.boolean().optional(),
          canViewAgenda: z3.boolean().optional(),
          canViewOrcamentista: z3.boolean().optional(),
          canViewAreaDentista: z3.boolean().optional(),
          canViewAreaOrtodontista: z3.boolean().optional(),
          canViewAreaImplantodontista: z3.boolean().optional(),
          canViewAreaProtesista: z3.boolean().optional(),
          canViewAreaBucomaxilo: z3.boolean().optional(),
          canViewAreaOdontopediatria: z3.boolean().optional(),
          canViewProcedimentos: z3.boolean().optional(),
          canViewDentistas: z3.boolean().optional(),
          canViewProteses: z3.boolean().optional(),
          canViewFinanceiro: z3.boolean().optional(),
          canViewConvenios: z3.boolean().optional(),
          canViewEstoque: z3.boolean().optional(),
          canViewRelatorios: z3.boolean().optional(),
          canViewAnaliseIA: z3.boolean().optional(),
          canViewQRCheckin: z3.boolean().optional(),
          canViewPainelTV: z3.boolean().optional(),
          canViewNotificacoes: z3.boolean().optional(),
          canViewGestaoUsuarios: z3.boolean().optional(),
          canViewConfiguracoes: z3.boolean().optional(),
          canViewAdmin: z3.boolean().optional()
        })
      })).mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("N\xE3o autenticado");
        const permissionsToSave = {
          ...input.permissions,
          canViewPainel: true
          // Sempre forçar como true
        };
        await upsertRolePermissions(input.role, permissionsToSave);
        return { success: true };
      }),
      initializeDefaults: publicProcedure.mutation(async ({ ctx }) => {
        if (!ctx.user) throw new Error("N\xE3o autenticado");
        await initializeDefaultPermissions();
        return { success: true };
      })
    }),
    // Planos de assinatura
    plans: router({
      list: publicProcedure.query(async ({ ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin") {
          throw new Error("Acesso negado");
        }
        return getPlans(false);
      }),
      listActive: publicProcedure.query(async () => {
        return getPlans(true);
      }),
      getById: publicProcedure.input(z3.object({ id: z3.number() })).query(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin") {
          throw new Error("Acesso negado");
        }
        return getPlanById(input.id);
      }),
      create: publicProcedure.input(z3.object({
        name: z3.string().min(2),
        slug: z3.string().min(2),
        description: z3.string().optional(),
        price: z3.string(),
        billingCycle: z3.enum(["monthly", "yearly"]),
        maxUsers: z3.number().optional(),
        maxPatients: z3.number().optional(),
        maxAppointmentsPerMonth: z3.number().optional(),
        hasAIAnalysis: z3.boolean().optional(),
        hasWhatsAppNotifications: z3.boolean().optional(),
        hasTVPanel: z3.boolean().optional(),
        hasAdvancedReports: z3.boolean().optional(),
        hasMultipleLocations: z3.boolean().optional(),
        hasAPIAccess: z3.boolean().optional(),
        hasPrioritySupport: z3.boolean().optional(),
        sortOrder: z3.number().optional()
      })).mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin") {
          throw new Error("Acesso negado");
        }
        return createPlan(input);
      }),
      update: publicProcedure.input(z3.object({
        id: z3.number(),
        name: z3.string().optional(),
        slug: z3.string().optional(),
        description: z3.string().optional(),
        price: z3.string().optional(),
        billingCycle: z3.enum(["monthly", "yearly"]).optional(),
        maxUsers: z3.number().optional(),
        maxPatients: z3.number().optional(),
        maxAppointmentsPerMonth: z3.number().optional(),
        hasAIAnalysis: z3.boolean().optional(),
        hasWhatsAppNotifications: z3.boolean().optional(),
        hasTVPanel: z3.boolean().optional(),
        hasAdvancedReports: z3.boolean().optional(),
        hasMultipleLocations: z3.boolean().optional(),
        hasAPIAccess: z3.boolean().optional(),
        hasPrioritySupport: z3.boolean().optional(),
        isActive: z3.boolean().optional(),
        sortOrder: z3.number().optional()
      })).mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin") {
          throw new Error("Acesso negado");
        }
        const { id, ...data } = input;
        await updatePlan(id, data);
        return { success: true };
      }),
      delete: publicProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin") {
          throw new Error("Acesso negado");
        }
        await deletePlan(input.id);
        return { success: true };
      })
    }),
    // Assinaturas das clínicas
    subscriptions: router({
      stats: publicProcedure.query(async ({ ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin") {
          throw new Error("Acesso negado");
        }
        return getClinicSubscriptionStats();
      }),
      listClinicsWithStatus: publicProcedure.query(async ({ ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin") {
          throw new Error("Acesso negado");
        }
        return getClinicsWithSubscriptionStatus();
      }),
      getOverdue: publicProcedure.query(async ({ ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin") {
          throw new Error("Acesso negado");
        }
        return getOverdueClinics();
      }),
      updateClinicPlan: publicProcedure.input(z3.object({
        clinicId: z3.number(),
        planId: z3.number()
      })).mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin") {
          throw new Error("Acesso negado");
        }
        await updateClinicSubscription(input.clinicId, {
          planId: input.planId,
          subscriptionStatus: "active",
          subscriptionStartedAt: /* @__PURE__ */ new Date()
        });
        return { success: true };
      }),
      updateStatus: publicProcedure.input(z3.object({
        clinicId: z3.number(),
        status: z3.enum(["trial", "active", "past_due", "canceled", "suspended"])
      })).mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin") {
          throw new Error("Acesso negado");
        }
        await updateClinicSubscription(input.clinicId, {
          subscriptionStatus: input.status
        });
        if (input.status === "suspended") {
          await suspendClinic(input.clinicId);
        } else if (input.status === "active") {
          await reactivateClinic(input.clinicId);
        }
        return { success: true };
      }),
      suspendClinic: publicProcedure.input(z3.object({ clinicId: z3.number() })).mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin") {
          throw new Error("Acesso negado");
        }
        await suspendClinic(input.clinicId);
        return { success: true };
      }),
      reactivateClinic: publicProcedure.input(z3.object({ clinicId: z3.number() })).mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin") {
          throw new Error("Acesso negado");
        }
        await reactivateClinic(input.clinicId);
        return { success: true };
      }),
      registerPayment: publicProcedure.input(z3.object({
        clinicId: z3.number(),
        amount: z3.number()
      })).mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin") {
          throw new Error("Acesso negado");
        }
        const clinic = await getClinicById(input.clinicId);
        if (!clinic) throw new Error("Cl\xEDnica n\xE3o encontrada");
        const nextPayment = /* @__PURE__ */ new Date();
        nextPayment.setDate(nextPayment.getDate() + 30);
        await updateClinicSubscription(input.clinicId, {
          subscriptionStatus: "active",
          lastPaymentAt: /* @__PURE__ */ new Date(),
          nextPaymentAt: nextPayment
        });
        if (clinic.subscriptionStatus === "suspended" || clinic.subscriptionStatus === "past_due") {
          await reactivateClinic(input.clinicId);
        }
        return { success: true };
      }),
      // Obter informações do trial/assinatura da clínica atual
      getSubscriptionInfo: publicProcedure.query(async ({ ctx }) => {
        if (!ctx.user) {
          throw new Error("N\xE3o autenticado");
        }
        if (ctx.user.role === "superadmin") {
          return {
            status: "active",
            isTrialExpired: false,
            daysRemaining: null,
            showExpirationWarning: false,
            canAccess: true
          };
        }
        if (!ctx.user.clinicId) {
          throw new Error("Usu\xE1rio n\xE3o est\xE1 associado a nenhuma cl\xEDnica");
        }
        const clinic = await getClinicById(ctx.user.clinicId);
        if (!clinic) {
          throw new Error("Cl\xEDnica n\xE3o encontrada");
        }
        const now = /* @__PURE__ */ new Date();
        let daysRemaining = null;
        let isTrialExpired = false;
        let showExpirationWarning = false;
        let canAccess = true;
        if (clinic.subscriptionStatus === "trial" && clinic.trialEndsAt) {
          const trialEnd = new Date(clinic.trialEndsAt);
          const diffTime = trialEnd.getTime() - now.getTime();
          daysRemaining = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
          if (daysRemaining <= 0) {
            isTrialExpired = true;
            canAccess = false;
            daysRemaining = 0;
          } else if (daysRemaining <= 5) {
            showExpirationWarning = true;
          }
        }
        const blockedStatuses = ["past_due", "canceled", "suspended"];
        if (blockedStatuses.includes(clinic.subscriptionStatus)) {
          canAccess = false;
        }
        let planData = null;
        if (clinic.planId) {
          const plan = await getPlanById(clinic.planId);
          if (plan) {
            planData = {
              id: plan.id,
              name: plan.name,
              slug: plan.slug,
              price: plan.price,
              description: plan.description,
              billingCycle: plan.billingCycle
            };
          }
        }
        return {
          status: clinic.subscriptionStatus,
          isTrialExpired,
          daysRemaining,
          showExpirationWarning,
          canAccess,
          trialEndsAt: clinic.trialEndsAt,
          planId: clinic.planId,
          clinicName: clinic.name,
          plan: planData
        };
      }),
      // Criar checkout de assinatura
      createSubscriptionCheckout: publicProcedure.input(z3.object({
        planId: z3.string().optional()
      })).mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new Error("N\xE3o autenticado");
        }
        if (!stripe) {
          throw new Error("Stripe n\xE3o configurado");
        }
        if (!ctx.user.clinicId) {
          throw new Error("Usu\xE1rio n\xE3o est\xE1 associado a nenhuma cl\xEDnica");
        }
        const clinic = await getClinicById(ctx.user.clinicId);
        if (!clinic) {
          throw new Error("Cl\xEDnica n\xE3o encontrada");
        }
        const user = await getUserById(ctx.user.id);
        if (!user) {
          throw new Error("Usu\xE1rio n\xE3o encontrado");
        }
        const origin = getOriginFromRequest(ctx.req);
        const dbPlans = await getPlans(true);
        const selectedPlanId = input.planId || "profissional";
        let selectedPlan = dbPlans.find((p) => p.slug === selectedPlanId);
        if (!selectedPlan && dbPlans.length > 0) {
          selectedPlan = dbPlans[Math.floor(dbPlans.length / 2)] || dbPlans[0];
        }
        if (!selectedPlan) {
          selectedPlan = {
            id: 0,
            name: "Plano Profissional",
            slug: "profissional",
            description: "Plano padr\xE3o",
            price: "299.00",
            billingCycle: "monthly",
            maxUsers: 5,
            maxPatients: 1e3,
            maxAppointmentsPerMonth: 500,
            hasAIAnalysis: true,
            hasWhatsAppNotifications: true,
            hasTVPanel: true,
            hasAdvancedReports: true,
            hasMultipleLocations: false,
            hasAPIAccess: false,
            hasPrioritySupport: false,
            isActive: true,
            sortOrder: 1,
            createdAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          };
        }
        const priceInCents = Math.round(parseFloat(selectedPlan.price) * 100);
        const session = await stripe.checkout.sessions.create({
          line_items: [
            {
              price_data: {
                currency: "brl",
                product_data: {
                  name: `Dentrics - ${selectedPlan.name}`,
                  description: selectedPlan.description || "Plano de assinatura Dentrics"
                },
                unit_amount: priceInCents,
                recurring: {
                  interval: selectedPlan.billingCycle === "yearly" ? "year" : "month"
                }
              },
              quantity: 1
            }
          ],
          mode: "subscription",
          success_url: `${origin}/inadimplente?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/inadimplente?subscription=cancelled`,
          customer_email: user.email,
          client_reference_id: clinic.id.toString(),
          metadata: {
            clinic_id: clinic.id.toString(),
            clinic_name: clinic.name,
            user_id: ctx.user.id.toString(),
            user_email: user.email,
            plan_id: selectedPlan.slug,
            plan_name: selectedPlan.name,
            plan_db_id: selectedPlan.id.toString()
          },
          allow_promotion_codes: true,
          subscription_data: {
            metadata: {
              clinic_id: clinic.id.toString(),
              plan_id: selectedPlan.slug,
              plan_db_id: selectedPlan.id.toString()
            }
          }
        });
        return { url: session.url, sessionId: session.id };
      }),
      // Criar sessão do portal do cliente Stripe
      createCustomerPortal: publicProcedure.mutation(async ({ ctx }) => {
        if (!ctx.user) {
          throw new Error("N\xE3o autenticado");
        }
        if (!stripe) {
          throw new Error("Stripe n\xE3o configurado");
        }
        const user = await getUserById(ctx.user.id);
        if (!user || !user.clinicId) {
          throw new Error("Usu\xE1rio ou cl\xEDnica n\xE3o encontrada");
        }
        const clinic = await getClinicById(user.clinicId);
        if (!clinic) {
          throw new Error("Cl\xEDnica n\xE3o encontrada");
        }
        let customerId = clinic.stripeCustomerId;
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email,
            name: clinic.name,
            metadata: {
              clinic_id: clinic.id.toString(),
              user_id: ctx.user.id.toString()
            }
          });
          customerId = customer.id;
          await updateClinicStripeCustomer(clinic.id, customerId);
        }
        const origin = ctx.req?.headers?.origin || "https://dentrics.manus.space";
        const session = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${origin}/perfil`
        });
        return { url: session.url };
      })
    })
  }),
  // Dentrics IA - Assistente Inteligente
  dentricsIA: router({
    ask: clinicProcedure.input(z3.object({
      message: z3.string()
    })).mutation(async ({ input, ctx }) => {
      const clinicId = ctx.clinicId;
      const userId = ctx.user.id;
      const message = input.message.toLowerCase();
      const conversationHistory = await getIaConversations(clinicId, userId, 20);
      const isPubMedSearch = message.includes("pubmed") || message.includes("estudo") || message.includes("pesquisa") || message.includes("artigo") || message.includes("cient\xEDfico");
      const isClinicData = message.includes("faturamento") || message.includes("paciente") || message.includes("consulta") || message.includes("or\xE7amento") || message.includes("agenda") || message.includes("hoje") || message.includes("amanh\xE3") || message.includes("m\xEAs") || message.includes("procedimento") || message.includes("valor") || message.includes("pre\xE7o") || message.includes("tratamento") || message.includes("fila") || message.includes("atendimento") || message.includes("transa\xE7") || message.includes("financeiro") || message.includes("estat\xEDstica") || message.includes("relat\xF3rio") || message.includes("an\xE1lise") || message.includes("resumo") || message.includes("semana") || message.includes("ontem") || message.includes("dentista") || message.includes("hor\xE1rio");
      const isAction = message.includes("criar") || message.includes("adicionar") || message.includes("cadastrar") || message.includes("agendar") || message.includes("marcar") || message.includes("coloca") || message.includes("coloque") || message.includes("adicione") || message.includes("crie") || message.includes("editar") || message.includes("atualizar") || message.includes("alterar") || message.includes("excluir") || message.includes("deletar") || message.includes("remover");
      const isSearch = message.includes("buscar") || message.includes("procurar") || message.includes("encontrar") || message.includes("listar") || message.includes("mostrar") || message.includes("quem") || message.includes("qual") || message.includes("quais") || message.includes("onde");
      const isReport = message.includes("relat\xF3rio") || message.includes("resumo") || message.includes("balan\xE7o") || message.includes("estat\xEDstica") || message.includes("an\xE1lise") || message.includes("desempenho") || message.includes("performance");
      const isAlert = message.includes("alerta") || message.includes("aviso") || message.includes("pendente") || message.includes("urgente") || message.includes("aten\xE7\xE3o") || message.includes("lembrete") || message.includes("retorno") || message.includes("aniversari");
      const isSmartSchedule = (message.includes("agendar") || message.includes("marcar")) && (message.includes("para") || message.includes("amanh\xE3") || message.includes("segunda") || message.includes("ter\xE7a") || message.includes("quarta") || message.includes("quinta") || message.includes("sexta") || message.includes("s\xE1bado") || message.includes("\xE0s") || message.includes("as "));
      const isFindSlot = message.includes("hor\xE1rio dispon\xEDvel") || message.includes("pr\xF3ximo hor\xE1rio") || message.includes("vaga") || message.includes("quando posso") || message.includes("tem hor\xE1rio");
      let context = "";
      const sources = [];
      if (isClinicData) {
        try {
          const today = /* @__PURE__ */ new Date();
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const patients2 = await getPatients(void 0, clinicId);
          const appointments2 = await getAppointments(String(clinicId));
          const transactions2 = await getTransactions(String(clinicId));
          const budgets2 = await getBudgets(void 0, clinicId);
          const todayAppointments = appointments2.filter((a) => {
            const date2 = new Date(a.date);
            return date2 >= startOfDay && date2 < new Date(startOfDay.getTime() + 24 * 60 * 60 * 1e3);
          });
          const tomorrow = new Date(startOfDay);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowEnd = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1e3);
          const tomorrowAppointments = appointments2.filter((a) => {
            const date2 = new Date(a.date);
            return date2 >= tomorrow && date2 < tomorrowEnd;
          });
          const startOfWeek = new Date(startOfDay);
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(endOfWeek.getDate() + 7);
          const weekAppointments = appointments2.filter((a) => {
            const date2 = new Date(a.date);
            return date2 >= startOfWeek && date2 < endOfWeek;
          });
          const next30Days = new Date(startOfDay);
          next30Days.setDate(next30Days.getDate() + 30);
          const futureAppointments = appointments2.filter((a) => {
            const date2 = new Date(a.date);
            return date2 >= startOfDay && date2 <= next30Days;
          });
          const todayDetails = todayAppointments.slice(0, 10).map((a) => {
            const patient = patients2.find((p) => p.id === a.patientId);
            return `  - ${a.startTime || "Sem hor\xE1rio"}: ${patient?.name || "Paciente #" + a.patientId} (${a.type || "Consulta"}) - Status: ${a.status || "agendado"}`;
          }).join("\n");
          const tomorrowDetails = tomorrowAppointments.slice(0, 10).map((a) => {
            const patient = patients2.find((p) => p.id === a.patientId);
            return `  - ${a.startTime || "Sem hor\xE1rio"}: ${patient?.name || "Paciente #" + a.patientId} (${a.type || "Consulta"}) - Status: ${a.status || "agendado"}`;
          }).join("\n");
          const weekByDay = {};
          weekAppointments.forEach((a) => {
            const dateStr = new Date(a.date).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
            if (!weekByDay[dateStr]) weekByDay[dateStr] = [];
            weekByDay[dateStr].push(a);
          });
          const weekDetails = Object.entries(weekByDay).map(([day, appts]) => {
            const apptList = appts.slice(0, 5).map((a) => {
              const patient = patients2.find((p) => p.id === a.patientId);
              return `    - ${a.startTime || "Sem hor\xE1rio"}: ${patient?.name || "Paciente"}`;
            }).join("\n");
            return `  ${day} (${appts.length} consultas):
${apptList}`;
          }).join("\n");
          const futureDetails = futureAppointments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 15).map((a) => {
            const patient = patients2.find((p) => p.id === a.patientId);
            const dateStr = new Date(a.date).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
            return `  - ${dateStr} ${a.startTime || ""}: ${patient?.name || "Paciente #" + a.patientId} (${a.type || "Consulta"})`;
          }).join("\n");
          const monthRevenue = transactions2.filter((t2) => t2.type === "income" && new Date(t2.date) >= startOfMonth).reduce((sum, t2) => sum + Number(t2.value), 0);
          const pendingBudgets = budgets2.filter((b) => b.status === "pending");
          const procedures2 = await getProcedures(void 0, clinicId);
          const proceduresDetails = procedures2.map(
            (p) => `  - ${p.name}: R$ ${Number(p.pricePerTooth || 0).toFixed(2)} (${p.categoryId ? "Cat. " + p.categoryId : "Geral"})`
          ).join("\n");
          const queues = await getWaitingQueue(void 0, clinicId);
          const queueDetails = queues.map((q) => {
            const patient = patients2.find((p) => p.id === q.patientId);
            return `  - ${patient?.name || "Paciente"}: ${q.status} - ${q.queueType || "Recep\xE7\xE3o"}`;
          }).join("\n");
          context = `
## Dados da Cl\xEDnica (Tempo Real)
- Total de pacientes cadastrados: ${patients2.length}
- Faturamento do m\xEAs: R$ ${monthRevenue.toFixed(2)}
- Or\xE7amentos pendentes: ${pendingBudgets.length}
- Total de transa\xE7\xF5es: ${transactions2.length}

## Procedimentos Cadastrados (${procedures2.length} procedimentos)
${proceduresDetails || "  Nenhum procedimento cadastrado"}

## Fila de Atendimento Atual (${queues.length} pacientes)
${queueDetails || "  Nenhum paciente na fila"}

## Agenda Completa

### Consultas de Hoje (${todayAppointments.length} consultas)
${todayDetails || "  Nenhuma consulta agendada para hoje"}

### Consultas de Amanh\xE3 (${tomorrowAppointments.length} consultas)
${tomorrowDetails || "  Nenhuma consulta agendada para amanh\xE3"}

### Agenda da Semana (${weekAppointments.length} consultas)
${weekDetails || "  Nenhuma consulta esta semana"}

### Pr\xF3ximas Consultas (pr\xF3ximos 30 dias - ${futureAppointments.length} total)
${futureDetails || "  Nenhuma consulta agendada"}

### Total de Consultas no Sistema: ${appointments2.length}
`;
          sources.push({
            title: "Dados da Cl\xEDnica",
            url: "/dashboard",
            type: "clinic"
          });
        } catch (error) {
          console.error("Erro ao buscar dados da cl\xEDnica:", error);
        }
      }
      if (isPubMedSearch) {
        try {
          const searchTerms = input.message.replace(/pubmed|estudo|pesquisa|artigo|científico|buscar|últimos?|sobre/gi, "").trim();
          if (searchTerms) {
            const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchTerms + " dental OR dentistry")}&retmax=5&retmode=json`;
            const searchResponse = await fetch(searchUrl);
            const searchData = await searchResponse.json();
            if (searchData.esearchresult?.idlist?.length > 0) {
              const ids = searchData.esearchresult.idlist.join(",");
              const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids}&retmode=json`;
              const summaryResponse = await fetch(summaryUrl);
              const summaryData = await summaryResponse.json();
              context += "\n## Estudos Encontrados no PubMed\n";
              for (const id of searchData.esearchresult.idlist) {
                const article = summaryData.result?.[id];
                if (article) {
                  context += `
### ${article.title}
`;
                  context += `- **Autores:** ${article.authors?.map((a) => a.name).join(", ") || "N/A"}
`;
                  context += `- **Publica\xE7\xE3o:** ${article.source} (${article.pubdate})
`;
                  context += `- **PMID:** ${id}
`;
                  sources.push({
                    title: article.title?.substring(0, 50) + "...",
                    url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
                    type: "pubmed"
                  });
                }
              }
            }
          }
        } catch (error) {
          console.error("Erro ao buscar no PubMed:", error);
        }
      }
      let actionResult = "";
      if (isAction) {
        if ((message.includes("procedimento") || message.includes("tratamento")) && (message.includes("criar") || message.includes("adicionar") || message.includes("cadastrar") || message.includes("coloca") || message.includes("crie") || message.includes("adicione"))) {
          const procedimentosEncontrados = [];
          const padraoNomeValor = /([A-Za-zÀ-ú][A-Za-zÀ-ú\s]+?)\s*(?:-|com\s*valor)?\s*R\$\s*([\d.,]+)/gi;
          let match;
          while ((match = padraoNomeValor.exec(message)) !== null) {
            let nome = match[1].trim().replace(/\*\*/g, "").replace(/^\d+\.\s*/, "").replace(/procedimento|tratamento|criar|adicionar|cadastrar/gi, "").trim();
            const valorStr = match[2].replace(/\./g, "").replace(",", ".");
            const valor = parseFloat(valorStr);
            if (nome.length > 2 && valor > 0) {
              procedimentosEncontrados.push({ nome, valor });
            }
          }
          if (procedimentosEncontrados.length === 0) {
            const valorMatch = message.match(/R\$\s*([\d.,]+)|([\d]+(?:[.,]\d{2})?)\s*(?:reais?)?/i);
            let valor = 0;
            if (valorMatch) {
              const valorStr = (valorMatch[1] || valorMatch[2] || "0").replace(/\./g, "").replace(",", ".");
              valor = parseFloat(valorStr);
            }
            let nome = "";
            const padraoNome = message.match(/(?:procedimento|tratamento)\s+([A-Za-zÀ-ú][A-Za-zÀ-ú\s]+?)\s*(?:valor|r\$|\d|$)/i);
            if (padraoNome) {
              nome = padraoNome[1].trim();
            } else {
              nome = message.replace(/criar|adicionar|cadastrar|coloca|coloque|crie|adicione|procedimentos?|tratamentos?|com|valor|de|r\$|reais?|por|no\s*sistema/gi, "").replace(/[\d.,]+/g, "").replace(/\*\*/g, "").trim();
            }
            if (nome && nome.length > 2 && valor > 0) {
              procedimentosEncontrados.push({ nome, valor });
            } else if (nome && nome.length > 2 && valor === 0) {
              actionResult = `

\u26A0\uFE0F **ATEN\xC7\xC3O:** Detectei que voc\xEA quer criar o procedimento "${nome}", mas n\xE3o encontrei o valor. Por favor, informe o valor.

**Exemplo:** "Criar procedimento ${nome} valor R$ 150"`;
            } else if (valor > 0 && (!nome || nome.length <= 2)) {
              actionResult = `

\u26A0\uFE0F **ATEN\xC7\xC3O:** Detectei o valor R$ ${valor.toFixed(2)}, mas n\xE3o consegui identificar o nome do procedimento.

**Exemplo:** "Criar procedimento Limpeza valor R$ ${valor.toFixed(2)}"`;
            }
          }
          if (procedimentosEncontrados.length > 0) {
            const resultados = [];
            const procedimentosExistentes = await getProcedures(void 0, clinicId);
            for (const proc of procedimentosEncontrados) {
              const nomeFormatado = proc.nome.split(" ").filter((w) => w.length > 0).map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
              const jaExiste = procedimentosExistentes.find(
                (p) => p.name.toLowerCase() === nomeFormatado.toLowerCase()
              );
              if (jaExiste) {
                resultados.push(`\u26A0\uFE0F ${nomeFormatado} - J\xE1 existe (R$ ${Number(jaExiste.pricePerTooth).toFixed(2)})`);
                continue;
              }
              try {
                await createProcedure({
                  clinicId,
                  name: nomeFormatado,
                  pricePerTooth: proc.valor.toFixed(2),
                  isActive: true
                });
                const verificacao = await getProcedures(nomeFormatado, clinicId);
                if (verificacao.length > 0) {
                  resultados.push(`\u2705 ${nomeFormatado} - R$ ${proc.valor.toFixed(2)} (verificado)`);
                } else {
                  resultados.push(`\u26A0\uFE0F ${nomeFormatado} - Criado mas n\xE3o verificado`);
                }
              } catch (error) {
                resultados.push(`\u274C ${nomeFormatado} - Erro: ${error.message || error}`);
              }
            }
            const criados = resultados.filter((r) => r.startsWith("\u2705")).length;
            const existentes = resultados.filter((r) => r.startsWith("\u26A0\uFE0F")).length;
            const erros = resultados.filter((r) => r.startsWith("\u274C")).length;
            if (criados > 0) {
              actionResult = `

\u2705 **${criados} PROCEDIMENTO(S) CRIADO(S)!**
${resultados.join("\n")}

Os procedimentos foram adicionados ao cat\xE1logo da cl\xEDnica.`;
            } else if (existentes > 0 && criados === 0) {
              actionResult = `

\u26A0\uFE0F **PROCEDIMENTO(S) J\xC1 EXISTENTE(S):**
${resultados.join("\n")}

Nenhum novo procedimento foi criado pois j\xE1 existem no sistema.`;
            } else {
              actionResult = `

\u274C **ERRO AO CRIAR PROCEDIMENTO(S):**
${resultados.join("\n")}`;
            }
          }
        }
        if (message.includes("paciente") && (message.includes("criar") || message.includes("adicionar") || message.includes("cadastrar") || message.includes("coloca") || message.includes("crie"))) {
          const dadosPaciente = {};
          const cpfMatch = message.match(/(\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2})/i) || message.match(/cpf[:\s]*([\d.-]+)/i);
          if (cpfMatch) {
            dadosPaciente.cpf = cpfMatch[1].replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
          }
          const phoneMatch = message.match(/(?:telefone|tel|fone|whatsapp|zap)[:\s]*\(?([\d\s()-]+)\)?/i) || message.match(/\(?\d{2}\)?[\s.-]?\d{4,5}[-.]?\d{4}/i);
          if (phoneMatch) {
            dadosPaciente.phone = phoneMatch[1] || phoneMatch[0];
          }
          const emailMatch = message.match(/([\w.-]+@[\w.-]+\.[a-z]{2,})/i);
          if (emailMatch) {
            dadosPaciente.email = emailMatch[1].toLowerCase();
          }
          const rgMatch = message.match(/rg[:\s]*([\d.-]+)/i);
          if (rgMatch) {
            dadosPaciente.rg = rgMatch[1];
          }
          let nomeExtraido = "";
          const padraoNome1 = message.match(/(?:cadastrar|criar|adicionar)\s+(?:paciente|cliente)\s+([A-Za-zÀ-ú\s]+?)(?:\s+(?:cpf|telefone|tel|fone|email|e-mail|rg|whatsapp|zap|\d|@)|$)/i);
          if (padraoNome1 && padraoNome1[1]) {
            nomeExtraido = padraoNome1[1].trim();
          }
          if (!nomeExtraido) {
            const padraoNome2 = message.match(/paciente\s+([A-Za-zÀ-ú\s]+?)(?:\s+(?:cpf|telefone|tel|fone|email|e-mail|rg|whatsapp|zap|\d|@)|$)/i);
            if (padraoNome2 && padraoNome2[1]) {
              nomeExtraido = padraoNome2[1].trim();
            }
          }
          if (!nomeExtraido) {
            const palavras = message.split(/\s+/);
            const nomePalavras = [];
            let encontrouPaciente = false;
            for (const palavra of palavras) {
              const palavraLimpa = palavra.toLowerCase();
              if (["cadastrar", "criar", "adicionar", "colocar", "paciente", "cliente"].includes(palavraLimpa)) {
                if (palavraLimpa === "paciente" || palavraLimpa === "cliente") {
                  encontrouPaciente = true;
                }
                continue;
              }
              if (encontrouPaciente && /^[A-Za-zÀ-ú]+$/.test(palavra)) {
                nomePalavras.push(palavra);
              } else if (encontrouPaciente && nomePalavras.length > 0) {
                break;
              }
            }
            if (nomePalavras.length > 0) {
              nomeExtraido = nomePalavras.join(" ");
            }
          }
          if (nomeExtraido && nomeExtraido.length > 1) {
            const palavrasIgnorar = ["com", "de", "da", "do", "e", "o", "a", "os", "as", "um", "uma", "para", "por"];
            dadosPaciente.name = nomeExtraido.split(/\s+/).filter((word) => word.length > 0 && !palavrasIgnorar.includes(word.toLowerCase())).map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ").trim();
          }
          if (dadosPaciente.name && dadosPaciente.name.length > 1) {
            try {
              const result = await createPatient({
                clinicId,
                name: dadosPaciente.name,
                cpf: dadosPaciente.cpf,
                phone: dadosPaciente.phone,
                email: dadosPaciente.email,
                rg: dadosPaciente.rg,
                isActive: true
              });
              const verificacao = await getPatientById(result.id);
              let dadosPreenchidos = [`- Nome: ${dadosPaciente.name}`];
              if (dadosPaciente.cpf) dadosPreenchidos.push(`- CPF: ${dadosPaciente.cpf}`);
              if (dadosPaciente.phone) dadosPreenchidos.push(`- Telefone: ${dadosPaciente.phone}`);
              if (dadosPaciente.email) dadosPreenchidos.push(`- Email: ${dadosPaciente.email}`);
              if (dadosPaciente.rg) dadosPreenchidos.push(`- RG: ${dadosPaciente.rg}`);
              actionResult = `

\u2705 **PACIENTE CADASTRADO COM SUCESSO!**

${dadosPreenchidos.join("\n")}

- ID: ${result.id}
- Status: Ativo
- Verificado no banco: ${verificacao ? "\u2713" : "\u2717"}`;
            } catch (error) {
              actionResult = `

\u274C **ERRO:** N\xE3o foi poss\xEDvel cadastrar o paciente. Erro: ${error.message || error}`;
            }
          } else {
            actionResult = `

\u26A0\uFE0F **ATEN\xC7\xC3O:** N\xE3o consegui identificar o nome do paciente. Por favor, informe no formato:
"Cadastrar paciente Maria Silva cpf 123.456.789-00 telefone (11) 99999-9999"`;
          }
        }
        if ((message.includes("consult\xF3rio") || message.includes("consultorio") || message.includes("sala")) && (message.includes("criar") || message.includes("adicionar") || message.includes("cadastrar") || message.includes("coloca") || message.includes("crie"))) {
          let nomeConsultorio = message.replace(/criar|adicionar|cadastrar|coloca|coloque|crie|um|uma|o|a|consultório|consultorio|sala|com|nome|chamado|de/gi, "").trim();
          nomeConsultorio = nomeConsultorio.replace(/^\s*[\d]+\s*/, "").trim();
          const apenasNumero = message.match(/consultório\s*(\d+)|consultorio\s*(\d+)/i);
          if (apenasNumero) {
            nomeConsultorio = apenasNumero[1] || apenasNumero[2];
          }
          if (nomeConsultorio && nomeConsultorio.length >= 1) {
            try {
              const consultoriosExistentes = await getOffices();
              const jaExiste = consultoriosExistentes.find(
                (c) => c.name.toLowerCase() === nomeConsultorio.toLowerCase() && c.clinicId === clinicId
              );
              if (jaExiste) {
                actionResult = `

\u2705 **A\xC7\xC3O EXECUTADA:** O consult\xF3rio "${nomeConsultorio}" j\xE1 existe e est\xE1 ativo na sua cl\xEDnica. N\xE3o \xE9 poss\xEDvel adicionar um consult\xF3rio com o mesmo nome novamente.`;
              } else {
                await createOffice({
                  clinicId,
                  name: nomeConsultorio.charAt(0).toUpperCase() + nomeConsultorio.slice(1),
                  isActive: true
                });
                actionResult = `

\u2705 **A\xC7\xC3O EXECUTADA:** Consult\xF3rio "${nomeConsultorio}" criado com sucesso!`;
              }
            } catch (error) {
              actionResult = `

\u274C **ERRO:** N\xE3o foi poss\xEDvel criar o consult\xF3rio. Erro: ${error}`;
            }
          }
        }
        if ((message.includes("estoque") || message.includes("unidade") || message.includes("unidades")) && (message.includes("adicionar") || message.includes("criar") || message.includes("cadastrar") || message.includes("coloca") || message.includes("crie") || message.includes("coloque"))) {
          const itensEncontrados = [];
          let valorItem;
          const valorMatch = message.match(/(?:valor|preço|custo|custa|r\$)[:\s]*([\d.,]+)(?:\s*(?:reais|real|r\$))?/i) || message.match(/([\d.,]+)\s*(?:reais|real)/i);
          if (valorMatch) {
            valorItem = parseFloat(valorMatch[1].replace(/\./g, "").replace(",", "."));
          }
          let quantidadeItem = 1;
          const qtdMatch = message.match(/(\d+)\s*(?:unidade|un|peça|caixa|pacote|kit)s?/i);
          if (qtdMatch) {
            quantidadeItem = parseInt(qtdMatch[1]);
          }
          let nomeItem = "";
          const padraoNome1 = message.match(/(?:adicionar|criar|cadastrar|colocar?)\s+(?:no|ao)?\s*estoque\s+([A-Za-zÀ-ú\s]+?)\s+\d+/i);
          if (padraoNome1 && padraoNome1[1]) {
            nomeItem = padraoNome1[1].trim();
          }
          if (!nomeItem) {
            const padraoNome2 = message.match(/estoque\s+([A-Za-zÀ-ú\s]+?)\s+\d+/i);
            if (padraoNome2 && padraoNome2[1]) {
              nomeItem = padraoNome2[1].trim();
            }
          }
          if (!nomeItem) {
            const palavras = message.split(/\s+/);
            const nomePalavras = [];
            let encontrouEstoque = false;
            for (const palavra of palavras) {
              const palavraLimpa = palavra.toLowerCase();
              if (["adicionar", "criar", "cadastrar", "colocar", "coloque", "coloca", "crie", "no", "ao", "estoque", "item", "produto", "material", "com", "de"].includes(palavraLimpa)) {
                if (palavraLimpa === "estoque") {
                  encontrouEstoque = true;
                }
                continue;
              }
              if (encontrouEstoque && /^[A-Za-zÀ-ú]+$/.test(palavra)) {
                nomePalavras.push(palavra);
              } else if (encontrouEstoque && nomePalavras.length > 0) {
                break;
              }
            }
            if (nomePalavras.length > 0) {
              nomeItem = nomePalavras.join(" ");
            }
          }
          if (nomeItem && nomeItem.length > 1) {
            const palavrasIgnorar = ["valor", "pre\xE7o", "custo", "caixa", "unidade", "unidades", "un", "reais", "real", "a", "o", "do", "da"];
            nomeItem = nomeItem.split(/\s+/).filter((word) => word.length > 0 && !palavrasIgnorar.includes(word.toLowerCase())).map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ").trim();
            if (nomeItem.length > 1) {
              itensEncontrados.push({
                nome: nomeItem,
                quantidade: quantidadeItem,
                valor: valorItem
              });
            }
          }
          if (itensEncontrados.length > 0) {
            const resultados = [];
            const itensCriados = [];
            for (const item of itensEncontrados) {
              const nomeFormatado = item.nome.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
              let sucesso = false;
              let tentativas = 0;
              let ultimoErro = "";
              while (!sucesso && tentativas < 3) {
                tentativas++;
                try {
                  await createStockItem({
                    clinicId,
                    name: nomeFormatado,
                    quantity: item.quantidade,
                    minQuantity: 10,
                    unit: "un",
                    costPrice: item.valor ? item.valor.toString() : void 0
                  });
                  const verificacao = await getStockItems(nomeFormatado, clinicId);
                  if (verificacao.length > 0) {
                    sucesso = true;
                    itensCriados.push(nomeFormatado);
                    let resultado = `\u2705 ${nomeFormatado} - ${item.quantidade} un`;
                    if (item.valor) resultado += ` (R$ ${item.valor.toFixed(2)})`;
                    resultado += " (verificado \u2713)";
                    resultados.push(resultado);
                  } else {
                    ultimoErro = "Item n\xE3o encontrado ap\xF3s cria\xE7\xE3o";
                  }
                } catch (error) {
                  ultimoErro = error.message || String(error);
                }
              }
              if (!sucesso) {
                resultados.push(`\u274C ${nomeFormatado} - Falhou ap\xF3s ${tentativas} tentativas: ${ultimoErro}`);
              }
            }
            const estoqueAtual = await getStockItems(void 0, clinicId);
            const itensVerificados = itensCriados.filter(
              (nome) => estoqueAtual.some((e) => e.name.toLowerCase() === nome.toLowerCase())
            );
            const criados = resultados.filter((r) => r.startsWith("\u2705")).length;
            const erros = resultados.filter((r) => r.startsWith("\u274C")).length;
            actionResult = `

\u{1F4E6} **ESTOQUE ATUALIZADO!**

${resultados.join("\n")}

**Resumo:** ${criados} item(ns) adicionado(s)${erros > 0 ? `, ${erros} falha(s)` : ""}
**Verifica\xE7\xE3o:** ${itensVerificados.length} de ${itensCriados.length} confirmados no banco de dados.`;
          } else {
            const qtdMatch2 = message.match(/(\d+)/i);
            let quantidade = qtdMatch2 ? parseInt(qtdMatch2[1]) : 1;
            let nomeItem2 = message.replace(/adicionar|criar|cadastrar|coloca|coloque|crie|ao|no|estoque|item|produto|material|unidade|un|peça|caixa|pacote|kit|com|quantidade|de|s\b/gi, "").replace(/\d+/g, "").replace(/,|\./g, "").trim();
            if (nomeItem2 && nomeItem2.length > 2) {
              const nomeFormatado = nomeItem2.charAt(0).toUpperCase() + nomeItem2.slice(1).toLowerCase();
              let sucesso = false;
              let tentativas = 0;
              while (!sucesso && tentativas < 3) {
                tentativas++;
                try {
                  await createStockItem({
                    clinicId,
                    name: nomeFormatado,
                    quantity: quantidade,
                    minQuantity: 10,
                    unit: "un"
                  });
                  const verificacao = await getStockItems(nomeFormatado, clinicId);
                  if (verificacao.length > 0) {
                    sucesso = true;
                    actionResult = `

\u2705 **ITEM ADICIONADO AO ESTOQUE!**
- Nome: ${nomeFormatado}
- Quantidade: ${quantidade} unidades
- Status: Verificado no banco de dados \u2713`;
                  }
                } catch (error) {
                  if (tentativas >= 3) {
                    actionResult = `

\u274C **ERRO:** N\xE3o foi poss\xEDvel adicionar "${nomeFormatado}" ap\xF3s ${tentativas} tentativas. Erro: ${error.message || error}`;
                  }
                }
              }
            }
          }
        }
        if ((message.includes("entrada") || message.includes("repor") || message.includes("abastecer") || message.includes("aumentar")) && (message.includes("estoque") || message.includes("quantidade"))) {
          const qtdMatch = message.match(/(\d+)/i);
          let quantidade = qtdMatch ? parseInt(qtdMatch[1]) : 0;
          let nomeItem = message.replace(/entrada|repor|abastecer|aumentar|estoque|quantidade|de|do|da|unidade|un|peça|caixa|pacote|kit|s\b/gi, "").replace(/\d+/g, "").trim();
          if (nomeItem && quantidade > 0) {
            try {
              const items = await getStockItems(nomeItem, clinicId);
              if (items.length > 0) {
                const item = items[0];
                await createStockMovement({
                  stockItemId: item.id,
                  type: "in",
                  quantity: quantidade,
                  reason: "Entrada via Dentrics IA"
                });
                actionResult = `

\u2705 **ENTRADA DE ESTOQUE REGISTRADA!**
- Item: ${item.name}
- Quantidade adicionada: +${quantidade} unidades
- Nova quantidade: ${(item.quantity ?? 0) + quantidade} unidades`;
              } else {
                actionResult = `

\u26A0\uFE0F **ATEN\xC7\xC3O:** N\xE3o encontrei o item "${nomeItem}" no estoque. Deseja que eu crie este item?`;
              }
            } catch (error) {
              actionResult = `

\u274C **ERRO:** N\xE3o foi poss\xEDvel registrar a entrada. Erro: ${error.message || error}`;
            }
          }
        }
        if ((message.includes("sa\xEDda") || message.includes("retirar") || message.includes("baixa") || message.includes("consumir") || message.includes("usar")) && (message.includes("estoque") || message.includes("quantidade"))) {
          const qtdMatch = message.match(/(\d+)/i);
          let quantidade = qtdMatch ? parseInt(qtdMatch[1]) : 0;
          let nomeItem = message.replace(/saída|retirar|baixa|consumir|usar|estoque|quantidade|de|do|da|unidade|un|peça|caixa|pacote|kit|s\b/gi, "").replace(/\d+/g, "").trim();
          if (nomeItem && quantidade > 0) {
            try {
              const items = await getStockItems(nomeItem, clinicId);
              if (items.length > 0) {
                const item = items[0];
                if ((item.quantity ?? 0) >= quantidade) {
                  await createStockMovement({
                    stockItemId: item.id,
                    type: "out",
                    quantity: quantidade,
                    reason: "Sa\xEDda via Dentrics IA"
                  });
                  const novaQtd = (item.quantity ?? 0) - quantidade;
                  let alerta = "";
                  if (novaQtd <= (item.minQuantity ?? 10)) {
                    alerta = `

\u26A0\uFE0F **ALERTA:** Estoque baixo! Quantidade abaixo do m\xEDnimo (${item.minQuantity ?? 10} un).`;
                  }
                  actionResult = `

\u2705 **SA\xCDDA DE ESTOQUE REGISTRADA!**
- Item: ${item.name}
- Quantidade retirada: -${quantidade} unidades
- Nova quantidade: ${novaQtd} unidades${alerta}`;
                } else {
                  actionResult = `

\u274C **ERRO:** Quantidade insuficiente! O item "${item.name}" tem apenas ${item.quantity ?? 0} unidades em estoque.`;
                }
              } else {
                actionResult = `

\u26A0\uFE0F **ATEN\xC7\xC3O:** N\xE3o encontrei o item "${nomeItem}" no estoque.`;
              }
            } catch (error) {
              actionResult = `

\u274C **ERRO:** N\xE3o foi poss\xEDvel registrar a sa\xEDda. Erro: ${error.message || error}`;
            }
          }
        }
        if ((message.includes("estoque") || message.includes("itens") || message.includes("produtos")) && (message.includes("listar") || message.includes("mostrar") || message.includes("ver") || message.includes("consultar") || message.includes("quais") || message.includes("quanto"))) {
          try {
            const items = await getStockItems(void 0, clinicId);
            if (items.length > 0) {
              const listaItens = items.map((item) => {
                const status = (item.quantity ?? 0) <= (item.minQuantity ?? 10) ? "\u26A0\uFE0F" : "\u2705";
                return `${status} ${item.name}: ${item.quantity ?? 0} ${item.unit || "un"}`;
              }).join("\n");
              const baixoEstoque = items.filter((i) => (i.quantity ?? 0) <= (i.minQuantity ?? 10)).length;
              actionResult = `

\u{1F4E6} **ESTOQUE ATUAL (${items.length} itens):**
${listaItens}

${baixoEstoque > 0 ? `\u26A0\uFE0F ${baixoEstoque} item(ns) com estoque baixo!` : "\u2705 Todos os itens com estoque adequado."}`;
            } else {
              actionResult = `

\u{1F4E6} **ESTOQUE:** Nenhum item cadastrado no estoque. Deseja adicionar algum item?`;
            }
          } catch (error) {
            actionResult = `

\u274C **ERRO:** N\xE3o foi poss\xEDvel consultar o estoque. Erro: ${error.message || error}`;
          }
        }
        if (isAlert || message.includes("alerta") || message.includes("pendente") || message.includes("aten\xE7\xE3o")) {
          try {
            const alertas = [];
            const stockItems2 = await getStockItems(void 0, clinicId);
            const lowStock = stockItems2.filter((s) => (s.quantity ?? 0) <= (s.minQuantity ?? 10));
            if (lowStock.length > 0) {
              alertas.push(`\u{1F4E6} **ESTOQUE BAIXO:** ${lowStock.length} item(ns)
   ${lowStock.slice(0, 5).map((s) => `- ${s.name}: ${s.quantity} ${s.unit || "un"}`).join("\n   ")}`);
            }
            const returnAlerts2 = await getPendingReturnAlerts(clinicId);
            const urgentReturns = returnAlerts2.filter((r) => r.daysUntilReturn <= 7);
            if (urgentReturns.length > 0) {
              alertas.push(`\u{1F4C5} **RETORNOS URGENTES:** ${urgentReturns.length} paciente(s) precisam retornar esta semana`);
            }
            const budgets2 = await getBudgets(void 0, clinicId);
            const oldPending = budgets2.filter((b) => {
              if (b.status !== "pending") return false;
              const daysSince = Math.floor((Date.now() - new Date(b.createdAt).getTime()) / (1e3 * 60 * 60 * 24));
              return daysSince > 7;
            });
            if (oldPending.length > 0) {
              alertas.push(`\u{1F4B0} **OR\xC7AMENTOS PENDENTES:** ${oldPending.length} or\xE7amento(s) h\xE1 mais de 7 dias`);
            }
            const patients2 = await getPatients(void 0, clinicId);
            const today = /* @__PURE__ */ new Date();
            const birthdayToday = patients2.filter((p) => {
              if (!p.birthDate) return false;
              const birth = new Date(p.birthDate);
              return birth.getDate() === today.getDate() && birth.getMonth() === today.getMonth();
            });
            if (birthdayToday.length > 0) {
              alertas.push(`\u{1F382} **ANIVERSARIANTES HOJE:** ${birthdayToday.map((p) => p.name).join(", ")}`);
            }
            const appointments2 = await getAppointments(void 0, void 0, void 0, clinicId);
            const todayAppts = appointments2.filter((a) => {
              const apptDate = new Date(a.date);
              return apptDate.toDateString() === today.toDateString() && a.status === "scheduled";
            });
            if (todayAppts.length > 0) {
              alertas.push(`\u{1F4CB} **CONSULTAS HOJE:** ${todayAppts.length} consulta(s) aguardando confirma\xE7\xE3o`);
            }
            if (alertas.length > 0) {
              actionResult = `

\u{1F6A8} **ALERTAS E PEND\xCANCIAS:**

${alertas.join("\n\n")}`;
            } else {
              actionResult = `

\u2705 **TUDO EM DIA!** N\xE3o h\xE1 alertas ou pend\xEAncias no momento.`;
            }
          } catch (error) {
            console.error("Erro ao buscar alertas:", error);
          }
        }
        if (isReport || message.includes("relat\xF3rio") || message.includes("resumo") || message.includes("balan\xE7o")) {
          try {
            const today = /* @__PURE__ */ new Date();
            let startDate = new Date(today);
            let endDate = new Date(today);
            let periodo = "hoje";
            if (message.includes("semana")) {
              startDate.setDate(today.getDate() - 7);
              periodo = "da semana";
            } else if (message.includes("m\xEAs")) {
              startDate = new Date(today.getFullYear(), today.getMonth(), 1);
              periodo = "do m\xEAs";
            } else if (message.includes("ontem")) {
              startDate.setDate(today.getDate() - 1);
              endDate.setDate(today.getDate() - 1);
              periodo = "de ontem";
            }
            const appointments2 = await getAppointments(void 0, void 0, void 0, clinicId);
            const transactions2 = await getTransactions(void 0, void 0, void 0, clinicId);
            const budgets2 = await getBudgets(void 0, clinicId);
            const patients2 = await getPatients(void 0, clinicId);
            const periodAppointments = appointments2.filter((a) => {
              const date2 = new Date(a.date);
              return date2 >= startDate && date2 <= endDate;
            });
            const periodTransactions = transactions2.filter((t2) => {
              const date2 = new Date(t2.date);
              return date2 >= startDate && date2 <= endDate;
            });
            const periodBudgets = budgets2.filter((b) => {
              const date2 = new Date(b.createdAt);
              return date2 >= startDate && date2 <= endDate;
            });
            const newPatients = patients2.filter((p) => {
              const date2 = new Date(p.createdAt);
              return date2 >= startDate && date2 <= endDate;
            });
            const income = periodTransactions.filter((t2) => t2.type === "income").reduce((s, t2) => s + Number(t2.value), 0);
            const expenses = periodTransactions.filter((t2) => t2.type === "expense").reduce((s, t2) => s + Number(t2.value), 0);
            const profit = income - expenses;
            const completedAppts = periodAppointments.filter((a) => a.status === "completed").length;
            const cancelledAppts = periodAppointments.filter((a) => a.status === "cancelled").length;
            const approvedBudgets = periodBudgets.filter((b) => b.status === "approved" || b.status === "completed").length;
            const conversionRate = periodBudgets.length > 0 ? Math.round(approvedBudgets / periodBudgets.length * 100) : 0;
            actionResult = `

\u{1F4CA} **RELAT\xD3RIO ${periodo.toUpperCase()}:**

\u{1F4C5} **Atendimentos:**
- Total: ${periodAppointments.length}
- Realizados: ${completedAppts}
- Cancelados: ${cancelledAppts}

\u{1F464} **Pacientes:**
- Novos cadastros: ${newPatients.length}
- Total na cl\xEDnica: ${patients2.length}

\u{1F4B0} **Financeiro:**
- Receita: R$ ${income.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Despesas: R$ ${expenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Lucro: R$ ${profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}

\u{1F4C4} **Or\xE7amentos:**
- Criados: ${periodBudgets.length}
- Aprovados: ${approvedBudgets}
- Taxa de convers\xE3o: ${conversionRate}%`;
          } catch (error) {
            console.error("Erro ao gerar relat\xF3rio:", error);
          }
        }
        if (isFindSlot || message.includes("hor\xE1rio dispon\xEDvel") || message.includes("pr\xF3ximo hor\xE1rio") || message.includes("vaga")) {
          try {
            const appointments2 = await getAppointments(void 0, void 0, void 0, clinicId);
            const dentists2 = await getDentists(true, clinicId);
            const today = /* @__PURE__ */ new Date();
            const availableSlots = [];
            for (let day = 0; day < 14 && availableSlots.length < 5; day++) {
              const checkDate = new Date(today);
              checkDate.setDate(checkDate.getDate() + day);
              if (checkDate.getDay() === 0 || checkDate.getDay() === 6) continue;
              const dateStr = checkDate.toISOString().split("T")[0];
              const dayAppointments = appointments2.filter(
                (a) => new Date(a.date).toISOString().split("T")[0] === dateStr
              );
              for (let hour = 8; hour < 18 && availableSlots.length < 5; hour++) {
                for (let minute = 0; minute < 60; minute += 30) {
                  const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
                  const isOccupied = dayAppointments.some((a) => a.startTime === timeStr);
                  if (!isOccupied) {
                    availableSlots.push({
                      date: dateStr,
                      time: timeStr,
                      dentist: dentists2[0]?.name || "Qualquer dentista"
                    });
                    break;
                  }
                }
                if (availableSlots.length >= 5) break;
              }
            }
            if (availableSlots.length > 0) {
              const slotsText = availableSlots.map(
                (s) => `\u{1F4C5} ${s.date} \xE0s ${s.time}${s.dentist ? ` (${s.dentist})` : ""}`
              ).join("\n");
              actionResult = `

\u2705 **HOR\xC1RIOS DISPON\xCDVEIS:**
${slotsText}

Deseja agendar algum desses hor\xE1rios?`;
            } else {
              actionResult = `

\u26A0\uFE0F **AGENDA CHEIA:** N\xE3o encontrei hor\xE1rios dispon\xEDveis nos pr\xF3ximos 14 dias.`;
            }
          } catch (error) {
            console.error("Erro ao buscar hor\xE1rios:", error);
          }
        }
        if ((message.includes("paciente") || message.includes("cliente")) && (message.includes("listar") || message.includes("mostrar") || message.includes("todos") || message.includes("quais"))) {
          try {
            const patients2 = await getPatients(void 0, clinicId);
            if (patients2.length > 0) {
              const lista = patients2.slice(0, 15).map(
                (p) => `- ${p.name}${p.phone ? ` | \u{1F4F1} ${p.phone}` : ""}${p.cpf ? ` | CPF: ${p.cpf}` : ""}`
              ).join("\n");
              actionResult = `

\u{1F465} **PACIENTES CADASTRADOS (${patients2.length} total):**
${lista}${patients2.length > 15 ? `

... e mais ${patients2.length - 15} pacientes.` : ""}`;
            } else {
              actionResult = `

\u{1F465} **PACIENTES:** Nenhum paciente cadastrado ainda.`;
            }
          } catch (error) {
            console.error("Erro ao listar pacientes:", error);
          }
        }
        if ((message.includes("procedimento") || message.includes("tratamento") || message.includes("servi\xE7o")) && (message.includes("listar") || message.includes("mostrar") || message.includes("todos") || message.includes("quais") || message.includes("tabela"))) {
          try {
            const procedures2 = await getProcedures(void 0, clinicId);
            if (procedures2.length > 0) {
              const lista = procedures2.map(
                (p) => `- ${p.name}: R$ ${Number(p.pricePerTooth || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
              ).join("\n");
              actionResult = `

\u{1F9B7} **PROCEDIMENTOS CADASTRADOS (${procedures2.length}):**
${lista}`;
            } else {
              actionResult = `

\u{1F9B7} **PROCEDIMENTOS:** Nenhum procedimento cadastrado ainda. Deseja criar alguns?`;
            }
          } catch (error) {
            console.error("Erro ao listar procedimentos:", error);
          }
        }
        if ((message.includes("agenda") || message.includes("consulta")) && (message.includes("hoje") || message.includes("agora"))) {
          try {
            const appointments2 = await getAppointments(void 0, void 0, void 0, clinicId);
            const patients2 = await getPatients(void 0, clinicId);
            const today = /* @__PURE__ */ new Date();
            const todayStr = today.toISOString().split("T")[0];
            const todayAppts = appointments2.filter(
              (a) => new Date(a.date).toISOString().split("T")[0] === todayStr
            ).sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
            if (todayAppts.length > 0) {
              const lista = todayAppts.map((a) => {
                const patient = patients2.find((p) => p.id === a.patientId);
                const statusIcon = a.status === "completed" ? "\u2705" : a.status === "cancelled" ? "\u274C" : "\u{1F4CC}";
                return `${statusIcon} ${a.startTime} - ${patient?.name || "Paciente"} (${a.type || "Consulta"})`;
              }).join("\n");
              actionResult = `

\u{1F4C5} **AGENDA DE HOJE (${todayAppts.length} consultas):**
${lista}`;
            } else {
              actionResult = `

\u{1F4C5} **AGENDA DE HOJE:** Nenhuma consulta agendada para hoje.`;
            }
          } catch (error) {
            console.error("Erro ao buscar agenda:", error);
          }
        }
      }
      const systemPrompt = `Voc\xEA \xE9 a **Dentrics IA**, o assistente REAL e INTEGRADO ao sistema de gest\xE3o da cl\xEDnica odontol\xF3gica.

## \u26A0\uFE0F IMPORTANTE - VOC\xCA TEM ACESSO REAL AO BANCO DE DADOS!
- Voc\xEA N\xC3O \xE9 uma simula\xE7\xE3o. Voc\xEA est\xE1 CONECTADO ao banco de dados REAL da cl\xEDnica.
- Todas as a\xE7\xF5es que voc\xEA executa s\xE3o REAIS e PERSISTENTES.
- Quando uma a\xE7\xE3o \xE9 executada, ela J\xC1 FOI salva no banco de dados.
- NUNCA diga que \xE9 uma simula\xE7\xE3o ou que n\xE3o tem acesso real - VOC\xCA TEM!
- NUNCA pe\xE7a confirma\xE7\xE3o do usu\xE1rio para a\xE7\xF5es que j\xE1 foram executadas.

## \u{1F680} SUAS CAPACIDADES (TODAS REAIS E FUNCIONAIS):

### A\xC7\xD5ES DIRETAS NO BANCO DE DADOS:
1. \u2705 **CRIAR PROCEDIMENTOS** - "Criar procedimento Limpeza R$ 150" \u2192 SALVA NO BANCO
2. \u2705 **CADASTRAR PACIENTES** - "Cadastrar paciente Jo\xE3o Silva" \u2192 SALVA NO BANCO
3. \u2705 **CRIAR CONSULT\xD3RIOS** - "Criar consult\xF3rio Sala 1" \u2192 SALVA NO BANCO
4. \u2705 **AGENDAR CONSULTAS** - "Agendar Jo\xE3o para ter\xE7a \xE0s 14h" \u2192 SALVA NO BANCO
5. \u2705 **GERENCIAR ESTOQUE** - "Adicionar 100 luvas ao estoque" \u2192 SALVA NO BANCO
6. \u2705 **EDITAR PACIENTES** - "Atualizar telefone do paciente Maria" \u2192 ATUALIZA NO BANCO
7. \u2705 **EXCLUIR REGISTROS** - "Excluir procedimento X" \u2192 REMOVE DO BANCO

### CONSULTAS EM TEMPO REAL:
- Buscar pacientes por nome, CPF, telefone \u2192 L\xCA DO BANCO
- Encontrar consultas por data, paciente, dentista \u2192 L\xCA DO BANCO
- Listar procedimentos e valores \u2192 L\xCA DO BANCO
- Consultar estoque e alertas \u2192 L\xCA DO BANCO

### RELAT\xD3RIOS COM DADOS REAIS:
- Relat\xF3rio di\xE1rio/semanal/mensal de atendimentos
- An\xE1lise financeira (faturamento, despesas, lucro)
- Taxa de convers\xE3o de or\xE7amentos
- Procedimentos mais realizados

### ALERTAS PROATIVOS (DADOS REAIS):
- Estoque baixo
- Pacientes que precisam retornar
- Aniversariantes do dia
- Or\xE7amentos pendentes antigos

## \u{1F4CB} REGRAS DE COMPORTAMENTO:
1. **NUNCA** diga que \xE9 simula\xE7\xE3o - VOC\xCA TEM ACESSO REAL
2. **CONFIRME** cada a\xE7\xE3o mostrando o resultado REAL do banco
3. **PERGUNTE** se faltar informa\xE7\xE3o essencial
4. **MOSTRE** os dados reais quando consultados
5. Seja **CONCISO** mas completo
6. Use **EMOJIS** para tornar as respostas mais visuais
7. **N\xC3O** pe\xE7a confirma\xE7\xE3o do usu\xE1rio para a\xE7\xF5es j\xE1 executadas

## \u{1F4CA} DADOS REAIS DA CL\xCDNICA:
${context ? context : "(Consulte os dados usando os comandos dispon\xEDveis)"}

## \u2728 RESULTADO DA \xDALTIMA A\xC7\xC3O (REAL - J\xC1 SALVO NO BANCO):
${actionResult ? actionResult : "(Aguardando comando)"}

---
Responda de forma natural, direta e \xFAtil. Voc\xEA \xE9 o assistente mais inteligente que existe para cl\xEDnicas odontol\xF3gicas!`;
      const llmMessages = [
        { role: "system", content: systemPrompt }
      ];
      const recentHistory = conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        llmMessages.push({
          role: msg.role,
          content: msg.content
        });
      }
      llmMessages.push({ role: "user", content: input.message });
      const response = await invokeLLM({
        messages: llmMessages
      });
      let answer = String(response.choices?.[0]?.message?.content || "Desculpe, n\xE3o consegui processar sua pergunta. Tente novamente.");
      if (actionResult && !answer.includes("A\xC7\xC3O EXECUTADA")) {
        answer = answer + actionResult;
      }
      return {
        answer,
        sources
      };
    }),
    searchPubMed: clinicProcedure.input(z3.object({
      query: z3.string(),
      maxResults: z3.number().optional().default(10)
    })).mutation(async ({ input }) => {
      try {
        const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(input.query + " dental OR dentistry")}&retmax=${input.maxResults}&retmode=json`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        if (!searchData.esearchresult?.idlist?.length) {
          return { articles: [] };
        }
        const ids = searchData.esearchresult.idlist.join(",");
        const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids}&retmode=json`;
        const summaryResponse = await fetch(summaryUrl);
        const summaryData = await summaryResponse.json();
        const articles = searchData.esearchresult.idlist.map((id) => {
          const article = summaryData.result?.[id];
          return {
            pmid: id,
            title: article?.title || "",
            authors: article?.authors?.map((a) => a.name) || [],
            source: article?.source || "",
            pubdate: article?.pubdate || "",
            url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
          };
        });
        return { articles };
      } catch (error) {
        console.error("Erro ao buscar no PubMed:", error);
        return { articles: [] };
      }
    }),
    getInsights: clinicProcedure.query(async ({ ctx }) => {
      const clinicId = ctx.clinicId;
      try {
        const patients2 = await getPatients(void 0, clinicId);
        const appointments2 = await getAppointments(String(clinicId));
        const transactions2 = await getTransactions(String(clinicId));
        const budgets2 = await getBudgets(void 0, clinicId);
        const today = /* @__PURE__ */ new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthRevenue = transactions2.filter((t2) => t2.type === "income" && new Date(t2.date) >= startOfMonth).reduce((sum, t2) => sum + Number(t2.value), 0);
        const approvedBudgets = budgets2.filter((b) => b.status === "approved").length;
        const pendingBudgets = budgets2.filter((b) => b.status === "pending").length;
        const totalBudgets = budgets2.length;
        const conversionRate = totalBudgets > 0 ? approvedBudgets / totalBudgets * 100 : 0;
        return {
          totalPatients: patients2.length,
          monthRevenue,
          conversionRate: conversionRate.toFixed(1),
          pendingBudgets,
          totalAppointments: appointments2.length
        };
      } catch (error) {
        console.error("Erro ao buscar insights:", error);
        return {
          totalPatients: 0,
          monthRevenue: 0,
          conversionRate: "0",
          pendingBudgets: 0,
          totalAppointments: 0
        };
      }
    }),
    // Histórico de conversas
    getHistory: clinicProcedure.query(async ({ ctx }) => {
      const conversations = await getIaConversations(ctx.clinicId, ctx.user.id);
      return conversations.map((c) => ({
        id: c.id,
        role: c.role,
        content: c.content,
        sources: c.sources ? JSON.parse(c.sources) : [],
        createdAt: c.createdAt
      }));
    }),
    saveMessage: clinicProcedure.input(z3.object({
      role: z3.enum(["user", "assistant"]),
      content: z3.string(),
      sources: z3.array(z3.object({
        title: z3.string(),
        url: z3.string(),
        type: z3.enum(["pubmed", "journal", "clinic"])
      })).optional()
    })).mutation(async ({ input, ctx }) => {
      await addIaConversation({
        clinicId: ctx.clinicId,
        userId: ctx.user.id,
        role: input.role,
        content: input.content,
        sources: input.sources ? JSON.stringify(input.sources) : null
      });
      return { success: true };
    }),
    clearHistory: clinicProcedure.mutation(async ({ ctx }) => {
      await clearIaConversations(ctx.clinicId, ctx.user.id);
      return { success: true };
    }),
    // Criar procedimento via IA
    createProcedure: clinicProcedure.input(z3.object({
      name: z3.string(),
      value: z3.number(),
      category: z3.string().optional(),
      description: z3.string().optional(),
      duration: z3.number().optional()
    })).mutation(async ({ input, ctx }) => {
      const procedure = await createProcedure({
        clinicId: ctx.clinicId,
        name: input.name,
        pricePerTooth: String(input.value),
        description: input.description,
        duration: input.duration || 30,
        isActive: true
      });
      return { success: true, procedure };
    }),
    // Listar procedimentos via IA
    listProcedures: clinicProcedure.query(async ({ ctx }) => {
      const procedures2 = await getProcedures(void 0, ctx.clinicId);
      return procedures2;
    }),
    // Criar agendamento via IA
    createAppointment: clinicProcedure.input(z3.object({
      patientId: z3.number(),
      date: z3.string(),
      startTime: z3.string(),
      endTime: z3.string().optional(),
      type: z3.string().optional(),
      dentistId: z3.number().optional(),
      notes: z3.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const appointment = await createAppointment({
        clinicId: ctx.clinicId,
        patientId: input.patientId,
        date: new Date(input.date),
        startTime: input.startTime,
        endTime: input.endTime || input.startTime,
        type: input.type || "Consulta",
        dentistId: input.dentistId,
        status: "scheduled",
        notes: input.notes
      });
      return { success: true, appointment };
    }),
    // Buscar paciente por nome via IA
    searchPatient: clinicProcedure.input(z3.object({
      name: z3.string()
    })).query(async ({ input, ctx }) => {
      const patients2 = await getPatients(void 0, ctx.clinicId);
      const filtered = patients2.filter(
        (p) => p.name?.toLowerCase().includes(input.name.toLowerCase())
      );
      return filtered.slice(0, 10);
    }),
    // Obter dados completos em tempo real
    getRealTimeData: clinicProcedure.query(async ({ ctx }) => {
      const clinicId = ctx.clinicId;
      const patients2 = await getPatients(void 0, clinicId);
      const appointments2 = await getAppointments(void 0, void 0, void 0, clinicId);
      const procedures2 = await getProcedures(void 0, clinicId);
      const budgets2 = await getBudgets(void 0, clinicId);
      const transactions2 = await getTransactions(void 0, void 0, void 0, clinicId);
      const queues = await getWaitingQueue(void 0, clinicId);
      return {
        patients: patients2.slice(0, 100),
        appointments: appointments2.slice(0, 100),
        procedures: procedures2,
        budgets: budgets2.slice(0, 50),
        transactions: transactions2.slice(0, 50),
        queues,
        summary: {
          totalPatients: patients2.length,
          totalAppointments: appointments2.length,
          totalProcedures: procedures2.length,
          totalBudgets: budgets2.length,
          patientsInQueue: queues.length
        }
      };
    }),
    // ==================== FUNCIONALIDADES AVANÇADAS DA IA ====================
    // Busca inteligente em linguagem natural
    smartSearch: clinicProcedure.input(z3.object({
      query: z3.string(),
      type: z3.enum(["patients", "appointments", "procedures", "budgets", "stock", "all"]).optional()
    })).mutation(async ({ input, ctx }) => {
      const clinicId = ctx.clinicId;
      const query = input.query.toLowerCase();
      const results = {};
      const searchPatients = !input.type || input.type === "all" || input.type === "patients" || query.includes("paciente") || query.includes("cliente") || query.includes("cpf") || query.includes("telefone");
      const searchAppointments = !input.type || input.type === "all" || input.type === "appointments" || query.includes("consulta") || query.includes("agenda") || query.includes("hor\xE1rio");
      const searchProcedures = !input.type || input.type === "all" || input.type === "procedures" || query.includes("procedimento") || query.includes("tratamento") || query.includes("valor");
      const searchBudgets = !input.type || input.type === "all" || input.type === "budgets" || query.includes("or\xE7amento") || query.includes("proposta");
      const searchStock = !input.type || input.type === "all" || input.type === "stock" || query.includes("estoque") || query.includes("material") || query.includes("produto");
      const searchTerms = query.replace(/buscar|procurar|encontrar|mostrar|listar|quem|qual|quais|onde|paciente|consulta|procedimento|orçamento|estoque|material/gi, "").trim();
      if (searchPatients) {
        const patients2 = await getPatients(searchTerms || void 0, clinicId);
        results.patients = patients2.slice(0, 20).map((p) => ({
          id: p.id,
          name: p.name,
          cpf: p.cpf,
          phone: p.phone,
          email: p.email,
          isActiveToday: p.isActiveToday
        }));
      }
      if (searchAppointments) {
        const appointments2 = await getAppointments(void 0, void 0, void 0, clinicId);
        const filtered = searchTerms ? appointments2.filter(
          (a) => a.type?.toLowerCase().includes(searchTerms) || a.notes?.toLowerCase().includes(searchTerms)
        ) : appointments2;
        results.appointments = filtered.slice(0, 20).map((a) => ({
          id: a.id,
          date: a.date,
          startTime: a.startTime,
          type: a.type,
          status: a.status,
          patientId: a.patientId
        }));
      }
      if (searchProcedures) {
        const procedures2 = await getProcedures(searchTerms || void 0, clinicId);
        results.procedures = procedures2.slice(0, 20).map((p) => ({
          id: p.id,
          name: p.name,
          pricePerTooth: p.pricePerTooth,
          duration: p.duration
        }));
      }
      if (searchBudgets) {
        const budgets2 = await getBudgets(void 0, clinicId);
        const filtered = searchTerms ? budgets2.filter(
          (b) => b.notes?.toLowerCase().includes(searchTerms)
        ) : budgets2;
        results.budgets = filtered.slice(0, 20).map((b) => ({
          id: b.id,
          patientId: b.patientId,
          status: b.status,
          totalValue: b.totalValue,
          finalValue: b.finalValue
        }));
      }
      if (searchStock) {
        const stock = await getStockItems(searchTerms || void 0, clinicId);
        results.stock = stock.slice(0, 20).map((s) => ({
          id: s.id,
          name: s.name,
          quantity: s.quantity,
          minQuantity: s.minQuantity,
          unit: s.unit,
          isLow: (s.quantity ?? 0) <= (s.minQuantity ?? 10)
        }));
      }
      return results;
    }),
    // Sugestões proativas - alertas automáticos
    getProactiveAlerts: clinicProcedure.query(async ({ ctx }) => {
      const clinicId = ctx.clinicId;
      const alerts = [];
      const stockItems2 = await getStockItems(void 0, clinicId);
      const lowStock = stockItems2.filter((s) => (s.quantity ?? 0) <= (s.minQuantity ?? 10));
      if (lowStock.length > 0) {
        alerts.push({
          type: "stock",
          priority: "high",
          title: `\u26A0\uFE0F ${lowStock.length} item(ns) com estoque baixo`,
          description: lowStock.map((s) => `${s.name}: ${s.quantity} ${s.unit || "un"}`).join(", "),
          action: "Ir para Estoque"
        });
      }
      const returnAlerts2 = await getPendingReturnAlerts(clinicId);
      const urgentReturns = returnAlerts2.filter((r) => r.daysUntilReturn <= 7);
      if (urgentReturns.length > 0) {
        alerts.push({
          type: "return",
          priority: "medium",
          title: `\u{1F4C5} ${urgentReturns.length} paciente(s) precisam retornar esta semana`,
          description: "Pacientes com retorno agendado nos pr\xF3ximos 7 dias",
          action: "Ver Alertas de Retorno"
        });
      }
      const budgets2 = await getBudgets(void 0, clinicId);
      const oldPending = budgets2.filter((b) => {
        if (b.status !== "pending") return false;
        const daysSince = Math.floor((Date.now() - new Date(b.createdAt).getTime()) / (1e3 * 60 * 60 * 24));
        return daysSince > 7;
      });
      if (oldPending.length > 0) {
        alerts.push({
          type: "budget",
          priority: "medium",
          title: `\u{1F4B0} ${oldPending.length} or\xE7amento(s) pendente(s) h\xE1 mais de 7 dias`,
          description: "Considere fazer follow-up com estes pacientes",
          action: "Ver Or\xE7amentos"
        });
      }
      const patients2 = await getPatients(void 0, clinicId);
      const today = /* @__PURE__ */ new Date();
      const birthdayToday = patients2.filter((p) => {
        if (!p.birthDate) return false;
        const birth = new Date(p.birthDate);
        return birth.getDate() === today.getDate() && birth.getMonth() === today.getMonth();
      });
      if (birthdayToday.length > 0) {
        alerts.push({
          type: "birthday",
          priority: "low",
          title: `\u{1F382} ${birthdayToday.length} aniversariante(s) hoje!`,
          description: birthdayToday.map((p) => p.name).join(", "),
          action: "Enviar Mensagem"
        });
      }
      const appointments2 = await getAppointments(void 0, void 0, void 0, clinicId);
      const todayAppts = appointments2.filter((a) => {
        const apptDate = new Date(a.date);
        return apptDate.toDateString() === today.toDateString() && a.status === "scheduled";
      });
      if (todayAppts.length > 0) {
        alerts.push({
          type: "appointment",
          priority: "high",
          title: `\u{1F4CB} ${todayAppts.length} consulta(s) hoje aguardando confirma\xE7\xE3o`,
          description: "Consultas agendadas para hoje que ainda n\xE3o foram confirmadas",
          action: "Ver Agenda"
        });
      }
      return alerts.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
      });
    }),
    // Gerar relatórios sob demanda
    generateReport: clinicProcedure.input(z3.object({
      type: z3.enum(["daily", "weekly", "monthly", "financial", "procedures", "patients"]),
      startDate: z3.string().optional(),
      endDate: z3.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const clinicId = ctx.clinicId;
      const today = /* @__PURE__ */ new Date();
      let startDate = input.startDate ? new Date(input.startDate) : new Date(today);
      let endDate = input.endDate ? new Date(input.endDate) : new Date(today);
      if (input.type === "daily") {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (input.type === "weekly") {
        startDate.setDate(today.getDate() - 7);
      } else if (input.type === "monthly") {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      }
      const patients2 = await getPatients(void 0, clinicId);
      const appointments2 = await getAppointments(void 0, void 0, void 0, clinicId);
      const transactions2 = await getTransactions(void 0, void 0, void 0, clinicId);
      const budgets2 = await getBudgets(void 0, clinicId);
      const procedures2 = await getProcedures(void 0, clinicId);
      const periodAppointments = appointments2.filter((a) => {
        const date2 = new Date(a.date);
        return date2 >= startDate && date2 <= endDate;
      });
      const periodTransactions = transactions2.filter((t2) => {
        const date2 = new Date(t2.date);
        return date2 >= startDate && date2 <= endDate;
      });
      const periodBudgets = budgets2.filter((b) => {
        const date2 = new Date(b.createdAt);
        return date2 >= startDate && date2 <= endDate;
      });
      const income = periodTransactions.filter((t2) => t2.type === "income").reduce((sum, t2) => sum + Number(t2.value), 0);
      const expenses = periodTransactions.filter((t2) => t2.type === "expense").reduce((sum, t2) => sum + Number(t2.value), 0);
      const approvedBudgets = periodBudgets.filter((b) => b.status === "approved" || b.status === "completed");
      const conversionRate = periodBudgets.length > 0 ? Math.round(approvedBudgets.length / periodBudgets.length * 100) : 0;
      const procedureCount = {};
      periodAppointments.forEach((a) => {
        if (a.type) {
          procedureCount[a.type] = (procedureCount[a.type] || 0) + 1;
        }
      });
      const topProcedures = Object.entries(procedureCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
      const newPatients = patients2.filter((p) => {
        const date2 = new Date(p.createdAt);
        return date2 >= startDate && date2 <= endDate;
      });
      return {
        period: {
          start: startDate.toISOString().split("T")[0],
          end: endDate.toISOString().split("T")[0],
          type: input.type
        },
        summary: {
          totalAppointments: periodAppointments.length,
          completedAppointments: periodAppointments.filter((a) => a.status === "completed").length,
          cancelledAppointments: periodAppointments.filter((a) => a.status === "cancelled").length,
          newPatients: newPatients.length,
          totalBudgets: periodBudgets.length,
          approvedBudgets: approvedBudgets.length,
          conversionRate
        },
        financial: {
          income,
          expenses,
          profit: income - expenses,
          avgTicket: periodAppointments.length > 0 ? Math.round(income / periodAppointments.length) : 0
        },
        topProcedures,
        generatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }),
    // Encontrar próximo horário disponível
    findNextAvailableSlot: clinicProcedure.input(z3.object({
      dentistId: z3.number().optional(),
      duration: z3.number().optional().default(30),
      // minutos
      preferredDate: z3.string().optional(),
      preferredTime: z3.string().optional()
      // "morning", "afternoon", "evening"
    })).mutation(async ({ input, ctx }) => {
      const clinicId = ctx.clinicId;
      const appointments2 = await getAppointments(void 0, void 0, input.dentistId, clinicId);
      const dentists2 = await getDentists(true, clinicId);
      const startDate = input.preferredDate ? new Date(input.preferredDate) : /* @__PURE__ */ new Date();
      const workHours = {
        morning: { start: 8, end: 12 },
        afternoon: { start: 13, end: 18 },
        evening: { start: 18, end: 21 }
      };
      const availableSlots = [];
      for (let day = 0; day < 30 && availableSlots.length < 10; day++) {
        const checkDate = new Date(startDate);
        checkDate.setDate(checkDate.getDate() + day);
        if (checkDate.getDay() === 0 || checkDate.getDay() === 6) continue;
        const dateStr = checkDate.toISOString().split("T")[0];
        const dayAppointments = appointments2.filter(
          (a) => new Date(a.date).toISOString().split("T")[0] === dateStr
        );
        const timeRange = input.preferredTime ? workHours[input.preferredTime] : { start: 8, end: 21 };
        for (let hour = timeRange.start; hour < timeRange.end && availableSlots.length < 10; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
            const isOccupied = dayAppointments.some((a) => {
              if (input.dentistId && a.dentistId !== input.dentistId) return false;
              return a.startTime === timeStr;
            });
            if (!isOccupied) {
              const slot = { date: dateStr, time: timeStr };
              if (!input.dentistId && dentists2.length > 0) {
                const availableDentist = dentists2.find(
                  (d) => !dayAppointments.some((a) => a.dentistId === d.id && a.startTime === timeStr)
                );
                if (availableDentist) {
                  slot.dentistId = availableDentist.id;
                  slot.dentistName = availableDentist.name;
                }
              }
              availableSlots.push(slot);
            }
          }
        }
      }
      return {
        slots: availableSlots,
        message: availableSlots.length > 0 ? `Encontrei ${availableSlots.length} hor\xE1rio(s) dispon\xEDvel(is)` : "N\xE3o encontrei hor\xE1rios dispon\xEDveis nos pr\xF3ximos 30 dias"
      };
    }),
    // Agendamento inteligente por linguagem natural
    smartSchedule: clinicProcedure.input(z3.object({
      request: z3.string()
      // Ex: "Agendar João para terça às 14h"
    })).mutation(async ({ input, ctx }) => {
      const clinicId = ctx.clinicId;
      const request = input.request.toLowerCase();
      let patientName = "";
      const namePatterns = [
        /(?:agendar|marcar|consulta\s+(?:para|do|da))\s+([a-záàâãéèêíïóôõöúçñ\s]+?)\s+(?:para|no|na|dia|às|as|amanhã|hoje|segunda|terça|quarta|quinta|sexta|sábado)/i,
        /paciente\s+([a-záàâãéèêíïóôõöúçñ\s]+?)\s+(?:para|no|na|dia|às|as)/i
      ];
      for (const pattern of namePatterns) {
        const match = request.match(pattern);
        if (match) {
          patientName = match[1].trim();
          break;
        }
      }
      let patient = null;
      if (patientName) {
        const patients2 = await getPatients(patientName, clinicId);
        patient = patients2[0];
      }
      let targetDate = /* @__PURE__ */ new Date();
      if (request.includes("amanh\xE3")) {
        targetDate.setDate(targetDate.getDate() + 1);
      } else if (request.includes("hoje")) {
      } else if (request.includes("segunda")) {
        const daysUntil = (1 - targetDate.getDay() + 7) % 7 || 7;
        targetDate.setDate(targetDate.getDate() + daysUntil);
      } else if (request.includes("ter\xE7a")) {
        const daysUntil = (2 - targetDate.getDay() + 7) % 7 || 7;
        targetDate.setDate(targetDate.getDate() + daysUntil);
      } else if (request.includes("quarta")) {
        const daysUntil = (3 - targetDate.getDay() + 7) % 7 || 7;
        targetDate.setDate(targetDate.getDate() + daysUntil);
      } else if (request.includes("quinta")) {
        const daysUntil = (4 - targetDate.getDay() + 7) % 7 || 7;
        targetDate.setDate(targetDate.getDate() + daysUntil);
      } else if (request.includes("sexta")) {
        const daysUntil = (5 - targetDate.getDay() + 7) % 7 || 7;
        targetDate.setDate(targetDate.getDate() + daysUntil);
      } else if (request.includes("s\xE1bado")) {
        const daysUntil = (6 - targetDate.getDay() + 7) % 7 || 7;
        targetDate.setDate(targetDate.getDate() + daysUntil);
      }
      let startTime = "09:00";
      const timeMatch = request.match(/(\d{1,2})(?::|h|\s*horas?)(?:(\d{2}))?/i);
      if (timeMatch) {
        const hour = parseInt(timeMatch[1]);
        const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        startTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      }
      const appointments2 = await getAppointments(void 0, void 0, void 0, clinicId);
      const dateStr = targetDate.toISOString().split("T")[0];
      const isOccupied = appointments2.some(
        (a) => new Date(a.date).toISOString().split("T")[0] === dateStr && a.startTime === startTime
      );
      if (!patient) {
        return {
          success: false,
          message: `N\xE3o encontrei o paciente "${patientName}". Deseja cadastr\xE1-lo primeiro?`,
          suggestion: "cadastrar_paciente"
        };
      }
      if (isOccupied) {
        return {
          success: false,
          message: `O hor\xE1rio ${startTime} do dia ${dateStr} j\xE1 est\xE1 ocupado. Deseja que eu encontre outro hor\xE1rio?`,
          suggestion: "encontrar_horario"
        };
      }
      try {
        const appointment = await createAppointment({
          clinicId,
          patientId: patient.id,
          date: targetDate,
          startTime,
          endTime: startTime,
          // Será calculado depois
          type: "Consulta",
          status: "scheduled"
        });
        return {
          success: true,
          message: `\u2705 Consulta agendada com sucesso!

\u{1F4C5} Data: ${dateStr}
\u23F0 Hor\xE1rio: ${startTime}
\u{1F464} Paciente: ${patient.name}`,
          appointment: {
            id: appointment.id,
            date: dateStr,
            time: startTime,
            patientName: patient.name
          }
        };
      } catch (error) {
        return {
          success: false,
          message: `Erro ao agendar: ${error.message}`
        };
      }
    }),
    // Análise de dados e estatísticas
    getAnalytics: clinicProcedure.input(z3.object({
      period: z3.enum(["week", "month", "quarter", "year"]).optional().default("month")
    })).query(async ({ input, ctx }) => {
      const clinicId = ctx.clinicId;
      const today = /* @__PURE__ */ new Date();
      let startDate = new Date(today);
      switch (input.period) {
        case "week":
          startDate.setDate(today.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(today.getMonth() - 1);
          break;
        case "quarter":
          startDate.setMonth(today.getMonth() - 3);
          break;
        case "year":
          startDate.setFullYear(today.getFullYear() - 1);
          break;
      }
      const patients2 = await getPatients(void 0, clinicId);
      const appointments2 = await getAppointments(void 0, void 0, void 0, clinicId);
      const transactions2 = await getTransactions(void 0, void 0, void 0, clinicId);
      const budgets2 = await getBudgets(void 0, clinicId);
      const periodAppointments = appointments2.filter((a) => new Date(a.date) >= startDate);
      const periodTransactions = transactions2.filter((t2) => new Date(t2.date) >= startDate);
      const periodBudgets = budgets2.filter((b) => new Date(b.createdAt) >= startDate);
      const newPatients = patients2.filter((p) => new Date(p.createdAt) >= startDate);
      const income = periodTransactions.filter((t2) => t2.type === "income").reduce((s, t2) => s + Number(t2.value), 0);
      const expenses = periodTransactions.filter((t2) => t2.type === "expense").reduce((s, t2) => s + Number(t2.value), 0);
      const dailyData = {};
      periodAppointments.forEach((a) => {
        const day = new Date(a.date).toISOString().split("T")[0];
        if (!dailyData[day]) dailyData[day] = { appointments: 0, income: 0 };
        dailyData[day].appointments++;
      });
      periodTransactions.filter((t2) => t2.type === "income").forEach((t2) => {
        const day = new Date(t2.date).toISOString().split("T")[0];
        if (!dailyData[day]) dailyData[day] = { appointments: 0, income: 0 };
        dailyData[day].income += Number(t2.value);
      });
      const trend = Object.entries(dailyData).sort((a, b) => a[0].localeCompare(b[0])).map(([date2, data]) => ({ date: date2, ...data }));
      const workDays = Math.ceil((today.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24));
      const totalSlots = workDays * 16;
      const occupancyRate = totalSlots > 0 ? Math.round(periodAppointments.length / totalSlots * 100) : 0;
      const approvedBudgets = periodBudgets.filter((b) => b.status === "approved" || b.status === "completed");
      const conversionRate = periodBudgets.length > 0 ? Math.round(approvedBudgets.length / periodBudgets.length * 100) : 0;
      return {
        period: input.period,
        overview: {
          totalPatients: patients2.length,
          newPatients: newPatients.length,
          totalAppointments: periodAppointments.length,
          completedAppointments: periodAppointments.filter((a) => a.status === "completed").length,
          cancelledAppointments: periodAppointments.filter((a) => a.status === "cancelled").length,
          occupancyRate
        },
        financial: {
          income,
          expenses,
          profit: income - expenses,
          avgTicket: periodAppointments.length > 0 ? Math.round(income / periodAppointments.length) : 0
        },
        budgets: {
          total: periodBudgets.length,
          approved: approvedBudgets.length,
          pending: periodBudgets.filter((b) => b.status === "pending").length,
          rejected: periodBudgets.filter((b) => b.status === "rejected").length,
          conversionRate,
          totalValue: approvedBudgets.reduce((s, b) => s + Number(b.finalValue || b.totalValue || 0), 0)
        },
        trend
      };
    }),
    // Editar paciente via IA
    editPatient: clinicProcedure.input(z3.object({
      patientId: z3.number(),
      updates: z3.object({
        name: z3.string().optional(),
        phone: z3.string().optional(),
        email: z3.string().optional(),
        cpf: z3.string().optional(),
        address: z3.string().optional(),
        notes: z3.string().optional()
      })
    })).mutation(async ({ input, ctx }) => {
      try {
        await updatePatient(input.patientId, input.updates, ctx.clinicId);
        const updated = await getPatientById(input.patientId, ctx.clinicId);
        return {
          success: true,
          message: "Paciente atualizado com sucesso!",
          patient: updated
        };
      } catch (error) {
        return {
          success: false,
          message: `Erro ao atualizar: ${error.message}`
        };
      }
    }),
    // Excluir registros via IA
    deleteRecord: clinicProcedure.input(z3.object({
      type: z3.enum(["patient", "procedure", "appointment", "stockItem"]),
      id: z3.number(),
      confirm: z3.boolean()
    })).mutation(async ({ input, ctx }) => {
      if (!input.confirm) {
        return {
          success: false,
          message: "Por favor, confirme a exclus\xE3o definindo confirm: true",
          requiresConfirmation: true
        };
      }
      try {
        switch (input.type) {
          case "patient":
            await deletePatient(input.id, ctx.clinicId);
            break;
          case "procedure":
            await deleteProcedure(input.id, ctx.clinicId);
            break;
          case "appointment":
            await deleteAppointment(input.id, ctx.clinicId);
            break;
          case "stockItem":
            await deleteStockItem(input.id, ctx.clinicId);
            break;
        }
        return {
          success: true,
          message: `${input.type} exclu\xEDdo com sucesso!`
        };
      } catch (error) {
        return {
          success: false,
          message: `Erro ao excluir: ${error.message}`
        };
      }
    }),
    // Enviar mensagem WhatsApp (preparar - requer integração)
    prepareWhatsAppMessage: clinicProcedure.input(z3.object({
      patientId: z3.number(),
      templateType: z3.enum(["appointment_reminder", "return_reminder", "birthday", "custom"]),
      customMessage: z3.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const patient = await getPatientById(input.patientId, ctx.clinicId);
      if (!patient) {
        return { success: false, message: "Paciente n\xE3o encontrado" };
      }
      if (!patient.phone) {
        return { success: false, message: "Paciente n\xE3o possui telefone cadastrado" };
      }
      let message = "";
      switch (input.templateType) {
        case "appointment_reminder":
          message = `Ol\xE1 ${patient.name}! \u{1F44B}

Lembramos que voc\xEA tem uma consulta agendada conosco. Por favor, confirme sua presen\xE7a respondendo esta mensagem.

Atenciosamente,
Equipe Dentrics`;
          break;
        case "return_reminder":
          message = `Ol\xE1 ${patient.name}! \u{1F44B}

Estamos entrando em contato para lembrar que est\xE1 na hora de agendar seu retorno. Sua sa\xFAde bucal \xE9 importante para n\xF3s!

Entre em contato para agendar.

Atenciosamente,
Equipe Dentrics`;
          break;
        case "birthday":
          message = `Ol\xE1 ${patient.name}! \u{1F382}

A equipe Dentrics deseja a voc\xEA um Feliz Anivers\xE1rio! Que este novo ano traga muitas alegrias e sorrisos.

Um grande abra\xE7o!`;
          break;
        case "custom":
          message = input.customMessage || "";
          break;
      }
      const phone = patient.phone.replace(/\D/g, "");
      const whatsappNumber = phone.startsWith("55") ? phone : `55${phone}`;
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      await createWhatsappNotification({
        clinicId: ctx.clinicId,
        patientId: patient.id,
        phone: patient.phone,
        type: input.templateType === "custom" ? "custom" : input.templateType,
        message,
        status: "pending"
      });
      return {
        success: true,
        message: "Mensagem preparada! Clique no link para enviar pelo WhatsApp.",
        whatsappUrl,
        phone: patient.phone,
        patientName: patient.name,
        messagePreview: message
      };
    })
  }),
  // Smile Design Studio
  smileDesign: router({
    generate: clinicProcedure.input(z3.object({
      imageBase64: z3.string(),
      treatmentType: z3.string(),
      notes: z3.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const treatmentPrompts = {
        clareamento: "Smile Design dental transformation: Edit this smile photo to show professional teeth whitening results. Make the teeth 4-6 shades whiter with a natural pearl-white color. Keep the exact same tooth shape, size, and alignment. Maintain realistic gum color and texture. The result should look like a professional in-office whitening treatment. Keep the person's face, lips, and all other features exactly the same.",
        facetas: "Smile Design dental transformation: Edit this smile photo to show porcelain veneer results. Create perfectly aligned, symmetrical teeth with ideal proportions. The teeth should be bright white but natural-looking, with subtle translucency at the edges. Each tooth should have a harmonious shape following the golden ratio. Keep natural gum contours and the person's face unchanged.",
        lentes: "Smile Design dental transformation: Edit this smile photo to show dental contact lens (ultra-thin veneer) results. Create a Hollywood-style perfect smile with brilliant white teeth. Teeth should be perfectly aligned, symmetrical, and have ideal size proportions. The smile should look glamorous but still natural. Maintain realistic lip and gum appearance.",
        implantes: "Smile Design dental transformation: Edit this smile photo to show dental implant results. Fill any missing tooth gaps with natural-looking replacement teeth that match the surrounding teeth in color, size, and shape. The new teeth should blend seamlessly with existing teeth. Maintain natural gum appearance around the implants.",
        ortodontia: "Smile Design dental transformation: Edit this smile photo to show orthodontic treatment results. Straighten all teeth to perfect alignment. Correct any crowding, spacing, or bite issues. Teeth should be evenly spaced with ideal arch form. Keep the natural tooth color and shape, only change the positioning. Maintain natural gum contours.",
        restauracao: "Smile Design dental transformation: Edit this smile photo to show dental restoration results. Repair any visible chips, cracks, or decay with natural-looking restorations. Match the color perfectly with surrounding teeth. Restore natural tooth anatomy and contours. The repairs should be invisible and blend seamlessly.",
        gengiva: "Smile Design dental transformation: Edit this smile photo to show gum contouring results. Create a harmonious, symmetrical gum line. Remove any excess gum tissue (gummy smile correction). The gum line should follow the natural curve of the upper lip. Teeth should appear longer and more proportional. Keep healthy pink gum color.",
        completo: "Smile Design dental transformation: Edit this smile photo to show full mouth rehabilitation results. Create a perfect Hollywood smile with: brilliant white teeth, perfect alignment, ideal proportions, symmetrical appearance, healthy pink gums, and harmonious gum line. The transformation should be dramatic but still look natural and achievable."
      };
      const treatmentDescriptions = {
        clareamento: "dentes mais brancos e brilhantes, mantendo a forma natural",
        facetas: "dentes perfeitamente alinhados com facetas de porcelana, formato harm\xF4nico",
        lentes: "sorriso perfeito com lentes de contato dental, dentes brancos e alinhados",
        implantes: "dentes completos e naturais com implantes, sorriso restaurado",
        ortodontia: "dentes perfeitamente alinhados ap\xF3s tratamento ortod\xF4ntico",
        restauracao: "dentes restaurados com apar\xEAncia natural e saud\xE1vel",
        gengiva: "linha gengival harm\xF4nica e esteticamente equilibrada",
        completo: "reabilita\xE7\xE3o oral completa com sorriso perfeito e natural"
      };
      const prompt = treatmentPrompts[input.treatmentType] || "Edite esta foto de sorriso para mostrar um sorriso melhorado e mais bonito, com dentes mais brancos e alinhados.";
      const description = treatmentDescriptions[input.treatmentType] || "sorriso melhorado e mais bonito";
      try {
        let base64Data = input.imageBase64;
        let mimeType = "image/jpeg";
        if (base64Data.startsWith("data:")) {
          const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            mimeType = matches[1];
            base64Data = matches[2];
          }
        }
        const fullPrompt = input.notes ? `${prompt} Observa\xE7\xF5es adicionais: ${input.notes}` : prompt;
        const result = await generateImage({
          prompt: fullPrompt,
          originalImages: [{
            b64Json: base64Data,
            mimeType
          }]
        });
        const llmResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Voc\xEA \xE9 um assistente de Smile Design odontol\xF3gico. Descreva brevemente o resultado do tratamento simulado."
            },
            {
              role: "user",
              content: `Descreva em 2-3 frases como ficou o sorriso do paciente ap\xF3s a simula\xE7\xE3o de ${input.treatmentType}. ${input.notes ? `Observa\xE7\xF5es: ${input.notes}` : ""}`
            }
          ]
        });
        return {
          simulatedImageUrl: result.url || input.imageBase64,
          description: llmResponse.choices[0]?.message?.content || description
        };
      } catch (error) {
        console.error("Erro ao gerar simula\xE7\xE3o:", error);
        try {
          const llmResponse = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "Voc\xEA \xE9 um assistente de Smile Design. Descreva como seria o resultado do tratamento."
              },
              {
                role: "user",
                content: `Descreva em 2-3 frases como ficaria o sorriso do paciente ap\xF3s o tratamento de ${input.treatmentType}.`
              }
            ]
          });
          return {
            simulatedImageUrl: input.imageBase64,
            description: llmResponse.choices[0]?.message?.content || description,
            error: "N\xE3o foi poss\xEDvel gerar a simula\xE7\xE3o visual. Mostrando imagem original."
          };
        } catch {
          return {
            simulatedImageUrl: input.imageBase64,
            description,
            error: "N\xE3o foi poss\xEDvel gerar a simula\xE7\xE3o. Tente novamente."
          };
        }
      }
    }),
    save: clinicProcedure.input(z3.object({
      patientId: z3.number(),
      originalImageUrl: z3.string(),
      simulatedImageUrl: z3.string(),
      treatmentType: z3.string(),
      notes: z3.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const result = await createSmileDesign({
        clinicId: ctx.clinicId,
        patientId: input.patientId,
        originalImageUrl: input.originalImageUrl,
        simulatedImageUrl: input.simulatedImageUrl,
        treatmentType: input.treatmentType,
        notes: input.notes || null,
        createdBy: ctx.user.id
      });
      return result;
    }),
    list: clinicProcedure.query(async ({ ctx }) => {
      const designs = await getSmileDesigns(ctx.clinicId);
      return designs;
    }),
    getByPatient: clinicProcedure.input(z3.object({ patientId: z3.number() })).query(async ({ input, ctx }) => {
      const designs = await getSmileDesignsByPatient(ctx.clinicId, input.patientId);
      return designs;
    }),
    // Métricas de conversão do Smile Design
    getMetrics: clinicProcedure.input(z3.object({ days: z3.number().default(30) })).query(async ({ input, ctx }) => {
      const metrics = await getSmileDesignMetrics(ctx.clinicId, input.days);
      return metrics;
    }),
    // Marcar como compartilhado via WhatsApp
    markShared: clinicProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input, ctx }) => {
      await markSmileDesignShared(ctx.clinicId, input.id);
      return { success: true };
    }),
    // Marcar como convertido (orçamento fechado)
    markConverted: clinicProcedure.input(z3.object({ id: z3.number(), budgetId: z3.number().optional() })).mutation(async ({ input, ctx }) => {
      await markSmileDesignConverted(ctx.clinicId, input.id, input.budgetId);
      return { success: true };
    })
  }),
  // Alertas de Retorno
  returnAlerts: router({
    list: clinicProcedure.query(async ({ ctx }) => {
      const alerts = await getReturnAlerts(ctx.clinicId);
      return alerts;
    }),
    getPending: clinicProcedure.query(async ({ ctx }) => {
      const alerts = await getPendingReturnAlerts(ctx.clinicId);
      return alerts;
    }),
    create: clinicProcedure.input(z3.object({
      patientId: z3.number(),
      treatmentType: z3.string().optional(),
      lastVisitDate: z3.string(),
      returnDueDate: z3.string(),
      priority: z3.enum(["low", "medium", "high", "urgent"]).optional()
    })).mutation(async ({ input, ctx }) => {
      const lastVisit = new Date(input.lastVisitDate);
      const returnDue = new Date(input.returnDueDate);
      const daysUntil = Math.ceil((returnDue.getTime() - Date.now()) / (1e3 * 60 * 60 * 24));
      const result = await createReturnAlert({
        clinicId: ctx.clinicId,
        patientId: input.patientId,
        treatmentType: input.treatmentType || null,
        lastVisitDate: lastVisit,
        returnDueDate: returnDue,
        daysUntilReturn: daysUntil,
        priority: input.priority || "medium"
      });
      return result;
    }),
    updateStatus: clinicProcedure.input(z3.object({
      id: z3.number(),
      status: z3.enum(["pending", "contacted", "scheduled", "completed", "cancelled"]),
      notes: z3.string().optional()
    })).mutation(async ({ input, ctx }) => {
      await updateReturnAlertStatus(input.id, input.status, input.notes);
      return { success: true };
    }),
    registerContact: clinicProcedure.input(z3.object({
      id: z3.number(),
      notes: z3.string()
    })).mutation(async ({ input, ctx }) => {
      await registerReturnAlertContact(input.id, input.notes);
      return { success: true };
    }),
    // Configurações de período de retorno
    getSettings: clinicProcedure.query(async ({ ctx }) => {
      const settings = await getReturnPeriodSettings(ctx.clinicId);
      return settings;
    }),
    saveSettings: clinicProcedure.input(z3.object({
      treatmentType: z3.string(),
      returnPeriodDays: z3.number(),
      reminderDaysBefore: z3.number().optional()
    })).mutation(async ({ input, ctx }) => {
      await saveReturnPeriodSetting({
        clinicId: ctx.clinicId,
        treatmentType: input.treatmentType,
        returnPeriodDays: input.returnPeriodDays,
        reminderDaysBefore: input.reminderDaysBefore || 7
      });
      return { success: true };
    }),
    // Gerar alertas automáticos baseado nas consultas
    generateFromAppointments: clinicProcedure.mutation(async ({ ctx }) => {
      const appointments2 = await getAppointments(String(ctx.clinicId));
      const settings = await getReturnPeriodSettings(ctx.clinicId);
      let created = 0;
      const today = /* @__PURE__ */ new Date();
      for (const apt of appointments2) {
        if (apt.status !== "completed") continue;
        const setting = settings.find(
          (s) => apt.notes?.toLowerCase().includes(s.treatmentType.toLowerCase())
        );
        if (setting) {
          const aptDate = new Date(apt.date);
          const returnDate = new Date(aptDate);
          returnDate.setDate(returnDate.getDate() + setting.returnPeriodDays);
          const daysUntil = Math.ceil((returnDate.getTime() - today.getTime()) / (1e3 * 60 * 60 * 24));
          if (daysUntil <= (setting.reminderDaysBefore || 7)) {
            const existingAlerts = await getReturnAlerts(ctx.clinicId);
            const exists = existingAlerts.some(
              (a) => a.patientId === apt.patientId && a.status === "pending"
            );
            if (!exists && apt.patientId) {
              await createReturnAlert({
                clinicId: ctx.clinicId,
                patientId: apt.patientId,
                treatmentType: setting.treatmentType,
                lastVisitDate: aptDate,
                returnDueDate: returnDate,
                daysUntilReturn: daysUntil,
                priority: daysUntil < 0 ? "urgent" : daysUntil <= 3 ? "high" : "medium"
              });
              created++;
            }
          }
        }
      }
      return { created };
    }),
    // Enviar lembrete via WhatsApp
    sendWhatsappReminder: clinicProcedure.input(z3.object({
      alertId: z3.number(),
      patientId: z3.number(),
      phoneNumber: z3.string(),
      templateName: z3.string(),
      messageContent: z3.string()
    })).mutation(async ({ input, ctx }) => {
      await createWhatsappReminderHistory({
        clinicId: ctx.clinicId,
        returnAlertId: input.alertId,
        patientId: input.patientId,
        phoneNumber: input.phoneNumber,
        messageTemplate: input.templateName,
        messageContent: input.messageContent,
        sentBy: ctx.user?.id,
        status: "sent"
      });
      await registerReturnAlertContact(input.alertId, `WhatsApp enviado: ${input.templateName}`);
      return { success: true };
    }),
    // Histórico de lembretes WhatsApp
    getWhatsappHistory: clinicProcedure.input(z3.object({
      alertId: z3.number().optional()
    }).optional()).query(async ({ input, ctx }) => {
      return getWhatsappReminderHistory(ctx.clinicId, input?.alertId);
    }),
    // Estatísticas de envio
    getWhatsappStats: clinicProcedure.input(z3.object({
      startDate: z3.string().optional(),
      endDate: z3.string().optional()
    }).optional()).query(async ({ input, ctx }) => {
      const startDate = input?.startDate ? new Date(input.startDate) : void 0;
      const endDate = input?.endDate ? new Date(input.endDate) : void 0;
      return getWhatsappReminderStats(ctx.clinicId, startDate, endDate);
    })
  }),
  // Templates de Lembrete
  reminderTemplates: router({
    list: clinicProcedure.query(async ({ ctx }) => {
      return getReminderTemplates(ctx.clinicId);
    }),
    create: clinicProcedure.input(z3.object({
      name: z3.string(),
      message: z3.string(),
      isDefault: z3.boolean().optional()
    })).mutation(async ({ input, ctx }) => {
      return createReminderTemplate({
        clinicId: ctx.clinicId,
        name: input.name,
        message: input.message,
        isDefault: input.isDefault || false
      });
    }),
    update: clinicProcedure.input(z3.object({
      id: z3.number(),
      name: z3.string().optional(),
      message: z3.string().optional(),
      isDefault: z3.boolean().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateReminderTemplate(id, data);
      return { success: true };
    }),
    delete: clinicProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
      await deleteReminderTemplate(input.id);
      return { success: true };
    })
  }),
  // ==================== MODELOS 3D ====================
  models3D: router({
    // Listar modelos 3D de um paciente
    getByPatient: clinicProcedure.input(z3.object({ patientId: z3.number() })).query(async ({ input }) => {
      return getPatientModels3D(input.patientId);
    }),
    // Obter modelo 3D por ID
    getById: clinicProcedure.input(z3.object({ id: z3.number() })).query(async ({ input }) => {
      return getPatientModel3DById(input.id);
    }),
    // Salvar modelo 3D no prontuário do paciente
    saveToPatient: clinicProcedure.input(z3.object({
      patientId: z3.number(),
      name: z3.string(),
      description: z3.string().optional(),
      fileData: z3.string(),
      // Base64 do arquivo
      fileName: z3.string(),
      fileType: z3.enum(["stl", "obj", "gltf", "glb"]),
      fileSize: z3.number().optional(),
      category: z3.enum(["escaneamento", "planejamento", "pr\xF3tese", "implante", "ortodontia", "outro"]).optional(),
      addToLibrary: z3.boolean().optional()
    })).mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.fileData, "base64");
      const timestamp2 = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const fileKey = `models3d/patient-${input.patientId}/${timestamp2}-${randomSuffix}-${input.fileName}`;
      const { url } = await storagePut(fileKey, buffer, `model/${input.fileType}`);
      const result = await createPatientModel3D({
        clinicId: ctx.clinicId,
        patientId: input.patientId,
        name: input.name,
        description: input.description,
        fileUrl: url,
        fileKey,
        fileType: input.fileType,
        fileSize: input.fileSize,
        category: input.category || "escaneamento",
        isInLibrary: input.addToLibrary || false,
        createdBy: ctx.user.id
      });
      if (input.addToLibrary) {
        await createModel3DLibrary({
          clinicId: ctx.clinicId,
          name: input.name,
          description: input.description,
          fileUrl: url,
          fileKey,
          fileType: input.fileType,
          fileSize: input.fileSize,
          category: "escaneamento",
          sourcePatientModelId: result.id,
          createdBy: ctx.user.id
        });
      }
      return { id: result.id, url };
    }),
    // Atualizar modelo 3D
    update: clinicProcedure.input(z3.object({
      id: z3.number(),
      name: z3.string().optional(),
      description: z3.string().optional(),
      category: z3.enum(["escaneamento", "planejamento", "pr\xF3tese", "implante", "ortodontia", "outro"]).optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updatePatientModel3D(id, data);
      return { success: true };
    }),
    // Excluir modelo 3D
    delete: clinicProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
      await deletePatientModel3D(input.id);
      return { success: true };
    }),
    // Adicionar modelo existente à biblioteca
    addToLibrary: clinicProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input, ctx }) => {
      const model = await getPatientModel3DById(input.id);
      if (!model) throw new Error("Modelo n\xE3o encontrado");
      await updatePatientModel3D(input.id, { isInLibrary: true });
      await createModel3DLibrary({
        clinicId: ctx.clinicId,
        name: model.name,
        description: model.description,
        fileUrl: model.fileUrl,
        fileKey: model.fileKey,
        fileType: model.fileType,
        fileSize: model.fileSize,
        category: "escaneamento",
        sourcePatientModelId: model.id,
        createdBy: ctx.user.id
      });
      return { success: true };
    }),
    // Listar biblioteca de modelos 3D
    getLibrary: clinicProcedure.query(async ({ ctx }) => {
      return getModels3DLibrary(ctx.clinicId);
    }),
    // Excluir modelo da biblioteca
    deleteFromLibrary: clinicProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
      await deleteModel3DLibrary(input.id);
      return { success: true };
    })
  }),
  // ==================== PROCEDIMENTOS DO TRATAMENTO ====================
  treatmentProcedures: router({
    // Criar procedimentos do tratamento (ao finalizar orçamento)
    create: clinicProcedure.input(z3.object({
      patientId: z3.number(),
      budgetId: z3.number().optional(),
      queueEntryId: z3.number().optional(),
      procedures: z3.array(z3.object({
        procedureId: z3.number().optional(),
        procedureName: z3.string(),
        toothNumber: z3.string().optional(),
        faces: z3.string().optional(),
        condition: z3.string().optional(),
        price: z3.number().optional()
      }))
    })).mutation(async ({ input, ctx }) => {
      const proceduresToCreate = input.procedures.map((p) => ({
        clinicId: ctx.clinicId,
        patientId: input.patientId,
        budgetId: input.budgetId,
        queueEntryId: input.queueEntryId,
        procedureId: p.procedureId,
        procedureName: p.procedureName,
        toothNumber: p.toothNumber,
        faces: p.faces,
        condition: p.condition,
        price: p.price?.toString(),
        status: "pending"
      }));
      return createTreatmentProcedures(proceduresToCreate);
    }),
    // Listar procedimentos por entrada na fila
    getByQueueEntry: publicProcedure.input(z3.object({ queueEntryId: z3.number() })).query(async ({ input }) => {
      return getTreatmentProceduresByQueueEntry(input.queueEntryId);
    }),
    // Listar procedimentos por paciente
    getByPatient: clinicProcedure.input(z3.object({ patientId: z3.number() })).query(async ({ input, ctx }) => {
      return getTreatmentProceduresByPatient(input.patientId, ctx.clinicId);
    }),
    // Listar procedimentos por orçamento
    getByBudget: publicProcedure.input(z3.object({ budgetId: z3.number() })).query(async ({ input }) => {
      return getTreatmentProceduresByBudget(input.budgetId);
    }),
    // Listar procedimentos para especialista (sem valores)
    getForSpecialist: publicProcedure.input(z3.object({
      queueEntryId: z3.number(),
      patientId: z3.number().optional()
    })).query(async ({ input }) => {
      return getTreatmentProceduresForSpecialist(input.queueEntryId, input.patientId);
    }),
    // Listar procedimentos pendentes do paciente
    getPending: clinicProcedure.input(z3.object({ patientId: z3.number() })).query(async ({ input, ctx }) => {
      return getPendingTreatmentProcedures(input.patientId, ctx.clinicId);
    }),
    // Atualizar status de um procedimento
    updateStatus: publicProcedure.input(z3.object({
      id: z3.number(),
      status: z3.enum(["pending", "in_progress", "completed"]),
      notes: z3.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const completedBy = ctx.user?.id;
      return updateTreatmentProcedureStatus(input.id, input.status, completedBy, input.notes);
    }),
    // Marcar múltiplos procedimentos como concluídos
    markMultipleCompleted: publicProcedure.input(z3.object({
      ids: z3.array(z3.number())
    })).mutation(async ({ input, ctx }) => {
      const completedBy = ctx.user?.id || 0;
      return markMultipleProceduresCompleted(input.ids, completedBy);
    }),
    // Vincular procedimentos a uma nova entrada na fila (encaminhamento)
    linkToQueueEntry: publicProcedure.input(z3.object({
      procedureIds: z3.array(z3.number()),
      newQueueEntryId: z3.number()
    })).mutation(async ({ input }) => {
      return linkProceduresToQueueEntry(input.procedureIds, input.newQueueEntryId);
    })
  }),
  // ==================== MEDICAL DOCUMENTS (Prontuário) ====================
  medicalDocuments: router({
    // Listar documentos de um paciente
    list: clinicProcedure.input(z3.object({
      patientId: z3.number(),
      type: z3.enum(["atestado", "receituario", "termo_consentimento", "contrato"]).optional()
    })).query(async ({ input, ctx }) => {
      const clinicId = ctx.user.clinicId ?? 1;
      return getMedicalDocumentsByPatient(input.patientId, clinicId);
    }),
    // Buscar documento por ID
    getById: clinicProcedure.input(z3.object({ id: z3.number() })).query(async ({ input, ctx }) => {
      const clinicId = ctx.user.clinicId ?? 1;
      return getMedicalDocumentById(input.id, clinicId);
    }),
    // Criar documento (Atestado)
    createAtestado: clinicProcedure.input(z3.object({
      patientId: z3.number(),
      dentistId: z3.number(),
      attestationType: z3.enum(["dias", "presenca"]),
      attestationDays: z3.number().optional(),
      includeCid: z3.boolean().optional(),
      cidCode: z3.string().optional(),
      documentDate: z3.string()
    })).mutation(async ({ input, ctx }) => {
      const clinicId = ctx.user.clinicId ?? 1;
      const clinic = await getClinicById(clinicId);
      const patient = await getPatientById(input.patientId);
      const dentist = await getDentistById(input.dentistId);
      return createMedicalDocument({
        clinicId,
        patientId: input.patientId,
        dentistId: input.dentistId,
        type: "atestado",
        attestationType: input.attestationType,
        attestationDays: input.attestationDays,
        includeCid: input.includeCid,
        cidCode: input.cidCode,
        documentDate: new Date(input.documentDate),
        // Snapshot dos dados
        clinicName: clinic?.name,
        clinicAddress: clinic?.address,
        clinicPhone: clinic?.phone,
        clinicCnpj: clinic?.cnpj,
        clinicCro: clinic?.cro,
        dentistName: dentist?.name,
        dentistCro: dentist?.cro,
        patientName: patient?.name,
        patientCpf: patient?.cpf,
        patientAddress: patient?.address
      });
    }),
    // Criar documento (Receituário)
    createReceituario: clinicProcedure.input(z3.object({
      patientId: z3.number(),
      dentistId: z3.number(),
      prescription: z3.string().min(1),
      documentDate: z3.string()
    })).mutation(async ({ input, ctx }) => {
      const clinicId = ctx.user.clinicId ?? 1;
      const clinic = await getClinicById(clinicId);
      const patient = await getPatientById(input.patientId);
      const dentist = await getDentistById(input.dentistId);
      return createMedicalDocument({
        clinicId,
        patientId: input.patientId,
        dentistId: input.dentistId,
        type: "receituario",
        prescription: input.prescription,
        documentDate: new Date(input.documentDate),
        clinicName: clinic?.name,
        clinicAddress: clinic?.address,
        clinicPhone: clinic?.phone,
        clinicCnpj: clinic?.cnpj,
        clinicCro: clinic?.cro,
        dentistName: dentist?.name,
        dentistCro: dentist?.cro,
        patientName: patient?.name,
        patientCpf: patient?.cpf,
        patientAddress: patient?.address
      });
    }),
    // Criar documento (Termo de Consentimento)
    createTermoConsentimento: clinicProcedure.input(z3.object({
      patientId: z3.number(),
      dentistId: z3.number(),
      consentProcedure: z3.string().optional(),
      customProcedure: z3.string().optional(),
      documentDate: z3.string()
    })).mutation(async ({ input, ctx }) => {
      const clinicId = ctx.user.clinicId ?? 1;
      const clinic = await getClinicById(clinicId);
      const patient = await getPatientById(input.patientId);
      const dentist = await getDentistById(input.dentistId);
      return createMedicalDocument({
        clinicId,
        patientId: input.patientId,
        dentistId: input.dentistId,
        type: "termo_consentimento",
        consentProcedure: input.consentProcedure,
        customProcedure: input.customProcedure,
        documentDate: new Date(input.documentDate),
        clinicName: clinic?.name,
        clinicAddress: clinic?.address,
        clinicPhone: clinic?.phone,
        clinicCnpj: clinic?.cnpj,
        clinicCro: clinic?.cro,
        dentistName: dentist?.name,
        dentistCro: dentist?.cro,
        patientName: patient?.name,
        patientCpf: patient?.cpf,
        patientAddress: patient?.address
      });
    }),
    // Criar documento (Contrato)
    createContrato: clinicProcedure.input(z3.object({
      patientId: z3.number(),
      dentistId: z3.number(),
      contractProcedures: z3.string().min(1),
      contractValue: z3.number(),
      paymentMethod: z3.string(),
      contractObservations: z3.string().optional(),
      documentDate: z3.string()
    })).mutation(async ({ input, ctx }) => {
      const clinicId = ctx.user.clinicId ?? 1;
      const clinic = await getClinicById(clinicId);
      const patient = await getPatientById(input.patientId);
      const dentist = await getDentistById(input.dentistId);
      return createMedicalDocument({
        clinicId,
        patientId: input.patientId,
        dentistId: input.dentistId,
        type: "contrato",
        contractProcedures: input.contractProcedures,
        contractValue: input.contractValue.toFixed(2),
        paymentMethod: input.paymentMethod,
        contractObservations: input.contractObservations,
        documentDate: new Date(input.documentDate),
        clinicName: clinic?.name,
        clinicAddress: clinic?.address,
        clinicPhone: clinic?.phone,
        clinicCnpj: clinic?.cnpj,
        clinicCro: clinic?.cro,
        dentistName: dentist?.name,
        dentistCro: dentist?.cro,
        patientName: patient?.name,
        patientCpf: patient?.cpf,
        patientAddress: patient?.address
      });
    }),
    // Deletar documento
    delete: clinicProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input, ctx }) => {
      const clinicId = ctx.user.clinicId ?? 1;
      return deleteMedicalDocument(input.id, clinicId);
    }),
    // Atualizar URL do PDF
    updatePdfUrl: clinicProcedure.input(z3.object({
      id: z3.number(),
      pdfUrl: z3.string()
    })).mutation(async ({ input, ctx }) => {
      const clinicId = ctx.user.clinicId ?? 1;
      return updateMedicalDocument(input.id, clinicId, { pdfUrl: input.pdfUrl });
    }),
    // Assinar documento (paciente ou profissional)
    signDocument: clinicProcedure.input(z3.object({
      id: z3.number(),
      signatureType: z3.enum(["patient", "professional"]),
      signature: z3.string()
      // Base64 da assinatura ou texto
    })).mutation(async ({ input, ctx }) => {
      const clinicId = ctx.user.clinicId ?? 1;
      const now = /* @__PURE__ */ new Date();
      if (input.signatureType === "patient") {
        return updateMedicalDocument(input.id, clinicId, {
          patientSignature: input.signature,
          patientSignedAt: now
        });
      } else {
        return updateMedicalDocument(input.id, clinicId, {
          professionalSignature: input.signature,
          professionalSignedAt: now
        });
      }
    }),
    // Gerar link de validação
    generateValidationLink: clinicProcedure.input(z3.object({
      id: z3.number(),
      expirationDays: z3.number().nullable()
      // null = sem expiração, 7, 30, 90 dias
    })).mutation(async ({ input, ctx }) => {
      const clinicId = ctx.user.clinicId ?? 1;
      const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").substring(0, 32);
      let expiresAt = null;
      if (input.expirationDays) {
        expiresAt = /* @__PURE__ */ new Date();
        expiresAt.setDate(expiresAt.getDate() + input.expirationDays);
      }
      await updateMedicalDocument(input.id, clinicId, {
        validationToken: token,
        validationExpiresAt: expiresAt
      });
      return { token, expiresAt };
    }),
    // Validar documento (rota pública - não requer autenticação)
    validateDocument: publicProcedure.input(z3.object({
      token: z3.string()
    })).query(async ({ input }) => {
      const document = await getMedicalDocumentByToken(input.token);
      if (!document) {
        return { valid: false, error: "Documento n\xE3o encontrado" };
      }
      if (document.validationExpiresAt && /* @__PURE__ */ new Date() > new Date(document.validationExpiresAt)) {
        return { valid: false, error: "Link de valida\xE7\xE3o expirado" };
      }
      return {
        valid: true,
        document: {
          type: document.type,
          clinicName: document.clinicName,
          dentistName: document.dentistName,
          dentistCro: document.dentistCro,
          patientName: document.patientName,
          patientCpf: document.patientCpf,
          documentDate: document.documentDate,
          patientSigned: !!document.patientSignature,
          patientSignedAt: document.patientSignedAt,
          professionalSigned: !!document.professionalSignature,
          professionalSignedAt: document.professionalSignedAt,
          // Campos específicos por tipo
          attestationType: document.attestationType,
          attestationDays: document.attestationDays,
          cidCode: document.cidCode,
          prescription: document.prescription,
          consentProcedure: document.consentProcedure,
          contractProcedures: document.contractProcedures,
          contractValue: document.contractValue,
          paymentMethod: document.paymentMethod
        }
      };
    })
  })
});

// server/_core/context.ts
init_db();
import * as jose from "jose";
function parseCookies(cookieHeader) {
  const cookies = /* @__PURE__ */ new Map();
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.split("=");
    if (name && rest.length > 0) {
      cookies.set(name.trim(), rest.join("=").trim());
    }
  });
  return cookies;
}
async function verifyOwnJWT(token) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");
    const { payload } = await jose.jwtVerify(token, secret);
    if (payload.userId && payload.email) {
      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        clinicId: payload.clinicId
      };
    }
    return null;
  } catch {
    return null;
  }
}
async function createContext(opts) {
  let user = null;
  try {
    const cookies = parseCookies(opts.req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    if (sessionCookie) {
      const ownJwtPayload = await verifyOwnJWT(sessionCookie);
      if (ownJwtPayload) {
        user = await getUserById(ownJwtPayload.userId) || null;
      }
    }
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/app.ts
init_env();
async function attachClient(app, server) {
  const { serveStatic: serveStatic2, setupVite: setupVite2 } = await Promise.resolve().then(() => (init_vite(), vite_exports));
  if (process.env.NODE_ENV === "development") {
    await setupVite2(app, server);
  } else {
    serveStatic2(app);
  }
}
async function createApp(options = {}) {
  const app = express2();
  app.post("/api/stripe/webhook", express2.raw({ type: "application/json" }), async (req, res) => {
    if (!stripe) {
      console.log("[Stripe Webhook] Stripe n\xE3o configurado");
      return res.status(400).json({ error: "Stripe n\xE3o configurado" });
    }
    const sig = req.headers["stripe-signature"];
    const ALTERNATIVE_WEBHOOK_SECRET = "whsec_yeegso47xqfrPnOEZA1cl5ePIOkuZERN";
    const webhookSecret = ALTERNATIVE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.log("[Stripe Webhook] STRIPE_WEBHOOK_SECRET n\xE3o configurado");
      return res.status(400).json({ error: "Webhook secret n\xE3o configurado" });
    }
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.log(`[Stripe Webhook] Erro na verifica\xE7\xE3o da assinatura: ${err.message}`);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
    if (event.id.startsWith("evt_test_")) {
      console.log("[Stripe Webhook] Evento de teste detectado, retornando verifica\xE7\xE3o");
      return res.json({ verified: true });
    }
    console.log(`[Stripe Webhook] Evento recebido: ${event.type}`);
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log(`[Stripe Webhook] Checkout completado: ${session.id}`);
        if (session.mode === "subscription" && session.metadata?.clinic_id) {
          try {
            const clinicId = parseInt(session.metadata.clinic_id);
            const planDbId = session.metadata.plan_db_id ? parseInt(session.metadata.plan_db_id) : null;
            console.log(`[Stripe Webhook] Processando cl\xEDnica ${clinicId}, plano ${planDbId}`);
            const updateData = {
              subscriptionStatus: "active",
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              lastPaymentAt: /* @__PURE__ */ new Date()
            };
            if (planDbId) {
              updateData.planId = planDbId;
            }
            if (session.subscription) {
              try {
                const subscription = await stripe.subscriptions.retrieve(session.subscription);
                const currentPeriodEnd = subscription.current_period_end;
                if (currentPeriodEnd && typeof currentPeriodEnd === "number") {
                  updateData.nextPaymentAt = new Date(currentPeriodEnd * 1e3);
                  console.log(`[Stripe Webhook] Pr\xF3ximo pagamento: ${updateData.nextPaymentAt.toISOString()}`);
                }
                const currentPeriodStart = subscription.current_period_start;
                if (currentPeriodStart && typeof currentPeriodStart === "number") {
                  updateData.subscriptionStartedAt = new Date(currentPeriodStart * 1e3);
                }
              } catch (subError) {
                console.error(`[Stripe Webhook] Erro ao buscar subscription:`, subError);
              }
            }
            const db = await Promise.resolve().then(() => (init_db(), db_exports));
            await db.updateClinicSubscription(clinicId, updateData);
            console.log(`[Stripe Webhook] Cl\xEDnica ${clinicId} ativada com sucesso!`);
          } catch (error) {
            console.error(`[Stripe Webhook] Erro ao ativar cl\xEDnica:`, error);
            console.error(`[Stripe Webhook] Stack:`, error.stack);
          }
        }
        break;
      }
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log(`[Stripe Webhook] Pagamento bem-sucedido: ${paymentIntent.id}`);
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        console.log(`[Stripe Webhook] Pagamento falhou: ${paymentIntent.id}`);
        break;
      }
      default:
        console.log(`[Stripe Webhook] Evento n\xE3o tratado: ${event.type}`);
    }
    res.json({ received: true });
  });
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/storage/image", async (req, res) => {
    const key = req.query.key;
    if (!key) {
      return res.status(400).json({ error: "Missing key parameter" });
    }
    try {
      const baseUrl = ENV.forgeApiUrl;
      const apiKey = ENV.forgeApiKey;
      if (!baseUrl || !apiKey) {
        return res.status(500).json({ error: "Storage not configured" });
      }
      const downloadApiUrl = new URL("v1/storage/downloadUrl", baseUrl.endsWith("/") ? baseUrl : baseUrl + "/");
      downloadApiUrl.searchParams.set("path", key.replace(/^\/+/, ""));
      const urlResponse = await fetch(downloadApiUrl.toString(), {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      if (!urlResponse.ok) {
        console.error("[Storage Proxy] Failed to get download URL:", urlResponse.status, urlResponse.statusText);
        return res.status(urlResponse.status).json({ error: "Failed to get download URL" });
      }
      const { url: signedUrl } = await urlResponse.json();
      const imageResponse = await fetch(signedUrl);
      if (!imageResponse.ok) {
        console.error("[Storage Proxy] Failed to fetch image:", imageResponse.status, imageResponse.statusText);
        return res.status(imageResponse.status).json({ error: "Failed to fetch image" });
      }
      const ext = key.split(".").pop()?.toLowerCase();
      const contentTypes = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp",
        "svg": "image/svg+xml"
      };
      const contentType = contentTypes[ext || ""] || imageResponse.headers.get("content-type") || "application/octet-stream";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      const buffer = await imageResponse.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("[Storage Proxy] Error:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (options.serveClient) {
    if (!options.server) {
      throw new Error("An HTTP server is required when serving the Vite/static client");
    }
    await attachClient(app, options.server);
  }
  return app;
}

// server/vercel.ts
var appPromise = createApp({ serveClient: false });
async function handler(req, res) {
  const app = await appPromise;
  const originalUrl = req.url ?? "/";
  const queryIndex = originalUrl.indexOf("?");
  const pathOnly = queryIndex === -1 ? originalUrl : originalUrl.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : originalUrl.slice(queryIndex);
  if (!pathOnly.startsWith("/api")) {
    req.url = `/api${pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`}${query}`;
  }
  return app(req, res);
}
var config = {
  maxDuration: 30
};
export {
  config,
  handler as default
};
