import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, clinicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { stripe, isStripeConfigured } from "./stripe/stripe";
import { storagePut, storageGet } from "./storage";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    
    // Registro com email e senha
    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2),
        phone: z.string().optional(),
        clinicName: z.string().optional(), // Se informado, cria uma clínica
      }))
      .mutation(async ({ input }) => {
        // Verificar se email já existe
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new Error("Email já cadastrado");
        }
        
        let clinicId: number | undefined;
        
        // Se informou nome da clínica, cria uma nova
        if (input.clinicName) {
          const slug = input.clinicName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
          
          const clinic = await db.createClinic({
            name: input.clinicName,
            slug: slug + '-' + Date.now(),
            isActive: true,
          });
          clinicId = clinic.id;
        }
        
        // Criar usuário
        const user = await db.createUserWithPassword({
          email: input.email,
          password: input.password,
          name: input.name,
          phone: input.phone,
          clinicId,
          role: clinicId ? "admin" : "user", // Se criou clínica, é admin
        });
        
        // Se criou clínica, adiciona como owner
        if (clinicId) {
          await db.addUserToClinic({
            userId: user.id,
            clinicId,
            role: "owner",
            isActive: true,
          });
          
          // Inicializar permissões padrão para todos os cargos
          await db.initializeDefaultPermissions();
        }
        
        return { success: true, userId: user.id, clinicId };
      }),
    
    // Login com email e senha
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        
        if (!user || !user.passwordHash) {
          throw new Error("Email ou senha inválidos");
        }
        
        if (!user.isActive) {
          throw new Error("Usuário desativado");
        }
        
        // Verificar acesso da clínica (exceto superadmin)
        if (user.role !== "superadmin" && user.clinicId) {
          const accessInfo = await db.checkClinicAccess(user.clinicId);
          if (!accessInfo.canAccess) {
            throw new Error(accessInfo.reason || "Acesso bloqueado");
          }
        }
        
        const validPassword = await db.verifyPassword(input.password, user.passwordHash);
        if (!validPassword) {
          throw new Error("Email ou senha inválidos");
        }
        
        // Atualizar último login
        await db.updateUserLastSignIn(user.id);
        
        // Criar sessão (cookie JWT)
        const { SignJWT } = await import("jose");
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");
        
        const token = await new SignJWT({
          userId: user.id,
          email: user.email,
          role: user.role,
          clinicId: user.clinicId,
        })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setExpirationTime("7d")
          .sign(secret);
        
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
        });
        
        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            clinicId: user.clinicId,
          },
        };
      }),
    
    // Alterar senha
    changePassword: publicProcedure
      .input(z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new Error("Não autenticado");
        }
        
        const user = await db.getUserById(ctx.user.id);
        if (!user || !user.passwordHash) {
          throw new Error("Usuário não encontrado");
        }
        
        const validPassword = await db.verifyPassword(input.currentPassword, user.passwordHash);
        if (!validPassword) {
          throw new Error("Senha atual incorreta");
        }
        
        await db.updateUserPassword(user.id, input.newPassword);
        return { success: true };
      }),
    
    // Verificar acesso da clínica
    checkClinicAccess: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        return { canAccess: false, reason: "Não autenticado" };
      }
      
      // Superadmin sempre tem acesso
      if (ctx.user.role === "superadmin") {
        return { canAccess: true, isSuperAdmin: true };
      }
      
      // Se não tem clínica, não pode acessar
      if (!ctx.user.clinicId) {
        return { canAccess: false, reason: "Usuário não está associado a nenhuma clínica" };
      }
      
      const accessInfo = await db.checkClinicAccess(ctx.user.clinicId);
      return {
        ...accessInfo,
        isSuperAdmin: false,
      };
    }),
  }),

  // Dashboard - Multi-tenancy: filtra por clinicId
  dashboard: router({
    stats: clinicProcedure.query(async ({ ctx }) => {
      return db.getDashboardStats(ctx.clinicId);
    }),
    advanced: clinicProcedure
      .input(z.object({ days: z.number().optional() }).optional())
      .query(async ({ input, ctx }) => {
        return db.getAdvancedDashboardStats(input?.days ?? 30, ctx.clinicId);
      }),
    queueStats: clinicProcedure.query(async ({ ctx }) => {
      return db.getQueueStats(ctx.clinicId);
    }),
  }),

  // Patients - Multi-tenancy: filtra por clinicId
  patients: router({
    list: clinicProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(async ({ input, ctx }) => {
        return db.getPatients(input?.search, ctx.clinicId);
      }),
    
    getById: clinicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getPatientById(input.id, ctx.clinicId);
      }),
    
    create: clinicProcedure
      .input(z.object({
        name: z.string().min(1),
        cpf: z.string().optional(),
        rg: z.string().optional(),
        birthDate: z.string().optional(),
        gender: z.enum(["male", "female", "other"]).optional(),
        phone: z.string().optional(),
        whatsapp: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        profession: z.string().optional(),
        emergencyContact: z.string().optional(),
        emergencyPhone: z.string().optional(),
        notes: z.string().optional(),
        insuranceId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createPatient({
          ...input,
          clinicId: ctx.clinicId,
          birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
          email: input.email || undefined,
        });
      }),
    
    update: clinicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          cpf: z.string().optional(),
          rg: z.string().optional(),
          birthDate: z.string().optional(),
          gender: z.enum(["male", "female", "other"]).optional(),
          phone: z.string().optional(),
          whatsapp: z.string().optional(),
          email: z.string().email().optional().or(z.literal("")),
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          profession: z.string().optional(),
          emergencyContact: z.string().optional(),
          emergencyPhone: z.string().optional(),
          notes: z.string().optional(),
          insuranceId: z.number().optional(),
          photoUrl: z.string().optional(),
          isActive: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.updatePatient(input.id, {
          ...input.data,
          birthDate: input.data.birthDate ? new Date(input.data.birthDate) : undefined,
        }, ctx.clinicId);
      }),
    
    delete: clinicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return db.deletePatient(input.id, ctx.clinicId);
      }),
    
    toggleActiveToday: clinicProcedure
      .input(z.object({ id: z.number(), isActiveToday: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        const activatedAt = input.isActiveToday ? new Date() : null;
        return db.updatePatient(input.id, { 
          isActiveToday: input.isActiveToday,
          activatedAt: activatedAt
        }, ctx.clinicId);
      }),
    
    listActiveToday: clinicProcedure
      .query(async ({ ctx }) => {
        return db.getPatientsActiveToday(ctx.clinicId);
      }),
  }),

  // Dentists - Multi-tenancy: filtra por clinicId
  dentists: router({
    list: clinicProcedure
      .input(z.object({ activeOnly: z.boolean().optional() }).optional())
      .query(async ({ input, ctx }) => {
        return db.getDentists(input?.activeOnly, ctx.clinicId);
      }),
    
    getById: clinicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getDentistById(input.id, ctx.clinicId);
      }),
    
    create: clinicProcedure
      .input(z.object({
        name: z.string().min(1),
        cro: z.string().min(1),
        specialty: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        commission: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createDentist({
          ...input,
          clinicId: ctx.clinicId,
          email: input.email || undefined,
        });
      }),
    
    update: clinicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          cro: z.string().optional(),
          specialty: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().email().optional().or(z.literal("")),
          commission: z.string().optional(),
          color: z.string().optional(),
          isActive: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.updateDentist(input.id, input.data, ctx.clinicId);
      }),
    
    delete: clinicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return db.deleteDentist(input.id, ctx.clinicId);
      }),
    
    toggleActiveToday: clinicProcedure
      .input(z.object({ id: z.number(), isActiveToday: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        const checkedInAt = input.isActiveToday ? new Date() : null;
        return db.updateDentist(input.id, { 
          isActiveToday: input.isActiveToday,
          checkedInAt: checkedInAt
        }, ctx.clinicId);
      }),
  }),

  // Procedures - Multi-tenancy: filtra por clinicId
  procedures: router({
    list: clinicProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(async ({ input, ctx }) => {
        return db.getProcedures(input?.search, ctx.clinicId);
      }),
    
    getById: clinicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getProcedureById(input.id, ctx.clinicId);
      }),
    
    create: clinicProcedure
      .input(z.object({
        code: z.string().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        categoryId: z.number().optional(),
        pricePerTooth: z.string(),
        priceUpperArch: z.string().optional(),
        priceLowerArch: z.string().optional(),
        duration: z.number().optional(),
        faces: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createProcedure({ ...input, clinicId: ctx.clinicId });
      }),
    
    update: clinicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          code: z.string().optional(),
          name: z.string().optional(),
          description: z.string().optional(),
          categoryId: z.number().optional(),
          pricePerTooth: z.string().optional(),
          priceUpperArch: z.string().optional(),
          priceLowerArch: z.string().optional(),
          duration: z.number().optional(),
          faces: z.string().optional(),
          isActive: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.updateProcedure(input.id, input.data, ctx.clinicId);
      }),
    
    delete: clinicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return db.deleteProcedure(input.id, ctx.clinicId);
      }),
    
    categories: clinicProcedure.query(async ({ ctx }) => {
      return db.getProcedureCategories(ctx.clinicId);
    }),
    
    createCategory: clinicProcedure
      .input(z.object({ name: z.string().min(1), color: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        return db.createProcedureCategory({ ...input, clinicId: ctx.clinicId });
      }),
  }),

  // Patients of the day (with appointments today) - Multi-tenancy
  patientsToday: router({
    list: clinicProcedure.query(async ({ ctx }) => {
      return db.getPatientsWithAppointmentsToday(ctx.clinicId);
    }),
  }),

  // Appointments - Multi-tenancy: filtra por clinicId
  appointments: router({
    list: clinicProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        dentistId: z.number().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        return db.getAppointments(input?.startDate, input?.endDate, input?.dentistId, ctx.clinicId);
      }),
    
    getById: clinicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getAppointmentById(input.id, ctx.clinicId);
      }),
    
    create: clinicProcedure
      .input(z.object({
        patientId: z.number(),
        dentistId: z.number().optional(),
        date: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        type: z.string().optional(),
        notes: z.string().optional(),
        chairId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createAppointment({
          ...input,
          clinicId: ctx.clinicId,
          date: new Date(input.date),
        });
      }),
    
    update: clinicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          patientId: z.number().optional(),
          dentistId: z.number().optional(),
          date: z.string().optional(),
          startTime: z.string().optional(),
          endTime: z.string().optional(),
          type: z.string().optional(),
          status: z.enum(["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"]).optional(),
          notes: z.string().optional(),
          chairId: z.number().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.updateAppointment(input.id, {
          ...input.data,
          date: input.data.date ? new Date(input.data.date) : undefined,
        }, ctx.clinicId);
      }),
    
    delete: clinicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return db.deleteAppointment(input.id, ctx.clinicId);
      }),
  }),

  // Budgets - Multi-tenancy: filtra por clinicId
  budgets: router({
    list: clinicProcedure
      .input(z.object({ patientId: z.number().optional() }).optional())
      .query(async ({ input, ctx }) => {
        return db.getBudgets(input?.patientId, ctx.clinicId);
      }),
    
    getById: clinicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getBudgetById(input.id, ctx.clinicId);
      }),
    
    create: clinicProcedure
      .input(z.object({
        patientId: z.number(),
        dentistId: z.number().optional(),
        totalValue: z.string(),
        discountPercent: z.string().optional(),
        discountValue: z.string().optional(),
        finalValue: z.string(),
        notes: z.string().optional(),
        validUntil: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createBudget({
          ...input,
          clinicId: ctx.clinicId,
          validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
        });
      }),
    
    update: clinicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          status: z.enum(["pending", "approved", "rejected", "in_progress", "completed"]).optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.updateBudget(input.id, input.data, ctx.clinicId);
      }),
    
    getItems: clinicProcedure
      .input(z.object({ budgetId: z.number() }))
      .query(async ({ input }) => {
        return db.getBudgetItems(input.budgetId);
      }),
    
    createItem: clinicProcedure
      .input(z.object({
        budgetId: z.number(),
        procedureId: z.number(),
        toothNumber: z.string().optional(),
        faces: z.string().optional(),
        quantity: z.number().optional(),
        unitPrice: z.string(),
        totalPrice: z.string(),
        phase: z.enum(["urgent", "important", "aesthetic", "preventive"]).optional(),
        priority: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createBudgetItem(input);
      }),
    
    // Aprovar item individual do orçamento
    approveItem: clinicProcedure
      .input(z.object({ itemId: z.number() }))
      .mutation(async ({ input }) => {
        return db.updateBudgetItem(input.itemId, { 
          status: "approved", 
          approvedAt: new Date() 
        });
      }),
    
    // Rejeitar item individual do orçamento
    rejectItem: clinicProcedure
      .input(z.object({ 
        itemId: z.number(),
        reason: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        return db.updateBudgetItem(input.itemId, { 
          status: "rejected", 
          rejectedAt: new Date(),
          rejectionReason: input.reason
        });
      }),
    
    // Atualizar fase/prioridade do item
    updateItemPhase: clinicProcedure
      .input(z.object({
        itemId: z.number(),
        phase: z.enum(["urgent", "important", "aesthetic", "preventive"]).optional(),
        priority: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { itemId, ...data } = input;
        return db.updateBudgetItem(itemId, data);
      }),
  }),

  // Transactions - Multi-tenancy: filtra por clinicId
  transactions: router({
    list: clinicProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        type: z.enum(["income", "expense"]).optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        return db.getTransactions(input?.startDate, input?.endDate, input?.type, ctx.clinicId);
      }),
    
    create: clinicProcedure
      .input(z.object({
        patientId: z.number().optional(),
        budgetId: z.number().optional(),
        type: z.enum(["income", "expense"]),
        category: z.string().optional(),
        description: z.string().optional(),
        value: z.string(),
        paymentMethod: z.enum(["cash", "credit_card", "debit_card", "pix", "bank_transfer", "check", "insurance"]).optional(),
        date: z.string(),
        status: z.enum(["pending", "paid", "cancelled"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createTransaction({
          ...input,
          clinicId: ctx.clinicId,
          date: new Date(input.date),
        });
      }),
    
    update: clinicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          status: z.enum(["pending", "paid", "cancelled"]).optional(),
          paymentMethod: z.enum(["cash", "credit_card", "debit_card", "pix", "bank_transfer", "check", "insurance"]).optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.updateTransaction(input.id, input.data, ctx.clinicId);
      }),
    
    delete: clinicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return db.deleteTransaction(input.id, ctx.clinicId);
      }),
  }),

  // Insurances - Multi-tenancy: filtra por clinicId
  insurances: router({
    list: clinicProcedure.query(async ({ ctx }) => {
      return db.getInsurances(ctx.clinicId);
    }),
    
    create: clinicProcedure
      .input(z.object({
        name: z.string().min(1),
        code: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        discount: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createInsurance({
          ...input,
          clinicId: ctx.clinicId,
          email: input.email || undefined,
        });
      }),
    
    update: clinicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          code: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().email().optional().or(z.literal("")),
          discount: z.string().optional(),
          isActive: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.updateInsurance(input.id, input.data, ctx.clinicId);
      }),
    
    delete: clinicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return db.deleteInsurance(input.id, ctx.clinicId);
      }),
  }),

  // Stock - Multi-tenancy: filtra por clinicId
  stock: router({
    items: clinicProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(async ({ input, ctx }) => {
        return db.getStockItems(input?.search, ctx.clinicId);
      }),
    
    createItem: clinicProcedure
      .input(z.object({
        name: z.string().min(1),
        categoryId: z.number().optional(),
        quantity: z.number().optional(),
        minQuantity: z.number().optional(),
        unit: z.string().optional(),
        costPrice: z.string().optional(),
        supplier: z.string().optional(),
        expirationDate: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createStockItem({
          ...input,
          clinicId: ctx.clinicId,
          expirationDate: input.expirationDate ? new Date(input.expirationDate) : undefined,
        });
      }),
    
    updateItem: clinicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          categoryId: z.number().optional(),
          quantity: z.number().optional(),
          minQuantity: z.number().optional(),
          unit: z.string().optional(),
          costPrice: z.string().optional(),
          supplier: z.string().optional(),
          expirationDate: z.string().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.updateStockItem(input.id, {
          ...input.data,
          expirationDate: input.data.expirationDate ? new Date(input.data.expirationDate) : undefined,
        }, ctx.clinicId);
      }),
    
    deleteItem: clinicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return db.deleteStockItem(input.id, ctx.clinicId);
      }),
    
    categories: clinicProcedure.query(async ({ ctx }) => {
      return db.getStockCategories(ctx.clinicId);
    }),
    
    createCategory: clinicProcedure
      .input(z.object({ name: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        return db.createStockCategory({ ...input, clinicId: ctx.clinicId });
      }),
    
    addMovement: clinicProcedure
      .input(z.object({
        stockItemId: z.number(),
        type: z.enum(["in", "out"]),
        quantity: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createStockMovement(input);
      }),
    
    movements: clinicProcedure
      .input(z.object({
        stockItemId: z.number().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        return db.getStockMovements(input?.stockItemId, ctx.clinicId, input?.limit);
      }),
    
    summary: clinicProcedure.query(async ({ ctx }) => {
      const items = await db.getStockItems(undefined, ctx.clinicId);
      const movements = await db.getStockMovements(undefined, ctx.clinicId, 50);
      
      const totalItems = items.length;
      const totalQuantity = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
      const totalValue = items.reduce((sum, item) => {
        const qty = item.quantity ?? 0;
        const cost = parseFloat(item.costPrice ?? "0");
        return sum + (qty * cost);
      }, 0);
      const lowStockItems = items.filter(item => (item.quantity ?? 0) <= (item.minQuantity ?? 10));
      
      return {
        totalItems,
        totalQuantity,
        totalValue,
        lowStockCount: lowStockItems.length,
        lowStockItems: lowStockItems.slice(0, 5),
        recentMovements: movements.slice(0, 10),
      };
    }),
  }),

  // Waiting Queue - Multi-tenancy: filtra por clinicId
  queue: router({
    list: clinicProcedure
      .input(z.object({ queueType: z.string().optional() }).optional())
      .query(async ({ input, ctx }) => {
        return db.getWaitingQueue(input?.queueType, ctx.clinicId);
      }),
    
    add: clinicProcedure
      .input(z.object({
        patientId: z.number(),
        queueType: z.enum(["budget", "dentist", "orthodontics", "implant", "prosthetics"]).optional(),
        priority: z.enum(["normal", "high", "urgent"]).optional(),
        dentistId: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.addToQueue({ ...input, clinicId: ctx.clinicId });
      }),
    
    updateStatus: clinicProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["waiting", "in_service", "completed", "cancelled"]),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.updateQueueStatus(input.id, input.status, ctx.clinicId);
      }),
  }),

  // Anamnesis
  anamnesis: router({
    get: publicProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ input }) => {
        return db.getAnamnesis(input.patientId);
      }),
    
    save: publicProcedure
      .input(z.object({
        patientId: z.number(),
        heartDisease: z.boolean().optional(),
        hypertension: z.boolean().optional(),
        diabetes: z.boolean().optional(),
        pregnancy: z.boolean().optional(),
        allergies: z.boolean().optional(),
        allergiesDescription: z.string().optional(),
        medications: z.boolean().optional(),
        medicationsDescription: z.string().optional(),
        surgeries: z.boolean().optional(),
        surgeriesDescription: z.string().optional(),
        smoker: z.boolean().optional(),
        alcohol: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.upsertAnamnesis(input);
      }),
  }),

  // Treatments (Odontogram)
  treatments: router({
    list: publicProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ input }) => {
        return db.getTreatments(input.patientId);
      }),
    
    create: publicProcedure
      .input(z.object({
        patientId: z.number(),
        toothNumber: z.string(),
        face: z.string().optional(),
        condition: z.enum(["healthy", "cavity", "restoration", "extraction", "implant", "crown", "bridge", "canal", "fracture", "absent"]).optional(),
        procedureId: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createTreatment(input);
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          condition: z.enum(["healthy", "cavity", "restoration", "extraction", "implant", "crown", "bridge", "canal", "fracture", "absent"]).optional(),
          procedureId: z.number().optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return db.updateTreatment(input.id, input.data);
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteTreatment(input.id);
      }),
  }),

  // Chairs - Multi-tenancy: filtra por clinicId
  chairs: router({
    list: clinicProcedure.query(async ({ ctx }) => {
      return db.getChairs(ctx.clinicId);
    }),
    
    create: clinicProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createChair({ ...input, clinicId: ctx.clinicId });
      }),
  }),

  // Clinic Settings
  settings: router({
    get: publicProcedure.query(async () => {
      return db.getClinicSettings();
    }),
    
    save: publicProcedure
      .input(z.object({
        name: z.string().optional(),
        cnpj: z.string().optional(),
        cro: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        openTime: z.string().optional(),
        closeTime: z.string().optional(),
        appointmentDuration: z.number().optional(),
        logoUrl: z.string().optional(),
        logoData: z.string().optional(), // Logo como base64 data URL
      }))
      .mutation(async ({ input }) => {
        return db.upsertClinicSettings({
          ...input,
          email: input.email || undefined,
        });
      }),
  }),

  // Laboratories - Multi-tenancy: filtra por clinicId
  laboratories: router({
    list: clinicProcedure.query(async ({ ctx }) => {
      return db.getLaboratories(ctx.clinicId);
    }),
    create: clinicProcedure
      .input(z.object({
        name: z.string().min(1),
        phone: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        address: z.string().optional(),
        contactPerson: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createLaboratory({ ...input, clinicId: ctx.clinicId, email: input.email || undefined });
      }),
    update: clinicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().email().optional().or(z.literal("")),
          address: z.string().optional(),
          contactPerson: z.string().optional(),
          isActive: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.updateLaboratory(input.id, input.data, ctx.clinicId);
      }),
    delete: clinicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return db.deleteLaboratory(input.id, ctx.clinicId);
      }),
  }),

  // Prosthesis Types - Multi-tenancy: filtra por clinicId
  prosthesisTypes: router({
    list: clinicProcedure.query(async ({ ctx }) => {
      return db.getProsthesisTypes(ctx.clinicId);
    }),
    create: clinicProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        defaultPrice: z.string().optional(),
        estimatedDays: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createProsthesisType({ ...input, clinicId: ctx.clinicId });
      }),
    update: clinicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          defaultPrice: z.string().optional(),
          estimatedDays: z.number().optional(),
          isActive: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.updateProsthesisType(input.id, input.data, ctx.clinicId);
      }),
    delete: clinicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return db.deleteProsthesisType(input.id, ctx.clinicId);
      }),
  }),

  // Prosthesis Orders - Multi-tenancy: filtra por clinicId
  prosthesisOrders: router({
    list: clinicProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input, ctx }) => {
        return db.getProsthesisOrders(input?.status, ctx.clinicId);
      }),
    getById: clinicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getProsthesisOrderById(input.id, ctx.clinicId);
      }),
    create: clinicProcedure
      .input(z.object({
        patientId: z.number(),
        dentistId: z.number().optional(),
        laboratoryId: z.number().optional(),
        prosthesisTypeId: z.number().optional(),
        toothNumber: z.string().optional(),
        color: z.string().optional(),
        material: z.string().optional(),
        price: z.string().optional(),
        labCost: z.string().optional(),
        orderDate: z.string().optional(),
        expectedDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createProsthesisOrder({
          ...input,
          clinicId: ctx.clinicId,
          orderDate: input.orderDate ? new Date(input.orderDate) : undefined,
          expectedDate: input.expectedDate ? new Date(input.expectedDate) : undefined,
        });
      }),
    update: clinicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          laboratoryId: z.number().optional(),
          prosthesisTypeId: z.number().optional(),
          toothNumber: z.string().optional(),
          color: z.string().optional(),
          material: z.string().optional(),
          price: z.string().optional(),
          labCost: z.string().optional(),
          status: z.enum(["pending", "sent_to_lab", "in_production", "ready", "delivered", "installed"]).optional(),
          expectedDate: z.string().optional(),
          deliveryDate: z.string().optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.updateProsthesisOrder(input.id, {
          ...input.data,
          expectedDate: input.data.expectedDate ? new Date(input.data.expectedDate) : undefined,
          deliveryDate: input.data.deliveryDate ? new Date(input.data.deliveryDate) : undefined,
        }, ctx.clinicId);
      }),
    delete: clinicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return db.deleteProsthesisOrder(input.id, ctx.clinicId);
      }),
    stats: clinicProcedure.query(async ({ ctx }) => {
      return db.getProsthesisStats(ctx.clinicId);
    }),
  }),

  // AI Analysis - Multi-tenancy: filtra por clinicId
  aiAnalysis: router({
    list: clinicProcedure
      .input(z.object({ patientId: z.number().optional() }).optional())
      .query(async ({ input, ctx }) => {
        return db.getAiAnalyses(input?.patientId, ctx.clinicId);
      }),
    create: publicProcedure
      .input(z.object({
        patientId: z.number(),
        imageUrl: z.string().min(1),
        imageType: z.enum(["panoramic", "periapical", "bitewing", "cephalometric", "intraoral"]).optional(),
      }))
      .mutation(async ({ input }) => {
        // Criar registro inicial
        const result = await db.createAiAnalysis(input);
        
        // Iniciar análise assíncrona com LLM
        (async () => {
          try {
            const imageTypeLabels: Record<string, string> = {
              panoramic: "Radiografia Panorâmica",
              periapical: "Radiografia Periapical",
              bitewing: "Radiografia Interproximal (Bitewing)",
              cephalometric: "Radiografia Cefalmétrica",
              intraoral: "Foto Intraoral",
            };
            
            const imageTypeLabel = imageTypeLabels[input.imageType || "panoramic"] || "Imagem Odontológica";
            
            const systemPrompt = `Você é um especialista em radiologia odontológica e diagnóstico por imagem dental com vasta experiência clínica.
Sua função é analisar imagens odontológicas e fornecer uma avaliação detalhada baseada em evidências científicas.

Ao analisar a imagem, você deve:
1. Identificar estruturas anatômicas visíveis
2. Detectar possíveis alterações patológicas (cáries, lesões periapicais, doença periodontal, etc.)
3. Avaliar a qualidade óssea e estruturas de suporte
4. Identificar tratamentos prévios (restaurações, próteses, implantes, tratamentos endodônticos)
5. Fornecer recomendações clínicas baseadas nos achados

Sempre baseie suas observações em literatura científica reconhecida.
Quando relevante, cite referências de estudos publicados em periódicos como:
- Journal of Dental Research
- Journal of Endodontics
- Journal of Periodontology
- Oral Surgery, Oral Medicine, Oral Pathology
- Dentomaxillofacial Radiology

IMPORTANTE: Esta é uma ferramenta de auxílio ao diagnóstico. O diagnóstico final deve ser realizado por um profissional qualificado.`;

            const userPrompt = `Analise esta ${imageTypeLabel} e forneça:

1. **ACHADOS**: Descreva detalhadamente o que você observa na imagem, incluindo:
   - Estruturas anatômicas identificadas
   - Alterações ou patologias detectadas
   - Tratamentos prévios visíveis

2. **RECOMENDAÇÕES**: Com base nos achados, sugira:
   - Exames complementares se necessário
   - Possíveis tratamentos indicados
   - Acompanhamento recomendado

3. **REFERÊNCIAS CIENTÍFICAS**: Cite estudos ou literatura relevante que suportam sua análise.

Formate sua resposta de forma clara e organizada.`;

            const response = await invokeLLM({
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
              maxTokens: 2000,
            });

            const analysisText = response.choices[0]?.message?.content || "";
            
            // Extrair seções da resposta
            let findings = "";
            let recommendations = "";
            
            if (typeof analysisText === "string") {
              // Tentar extrair achados
              const findingsMatch = analysisText.match(/\*\*ACHADOS\*\*[:\s]*([\s\S]*?)(?=\*\*RECOMENDAÇÕES\*\*|\*\*REFERÊNCIAS|$)/i);
              if (findingsMatch) {
                findings = findingsMatch[1].trim();
              }
              
              // Tentar extrair recomendações
              const recsMatch = analysisText.match(/\*\*RECOMENDAÇÕES\*\*[:\s]*([\s\S]*?)(?=\*\*REFERÊNCIAS|$)/i);
              if (recsMatch) {
                recommendations = recsMatch[1].trim();
              }
              
              // Se não conseguiu extrair, usar o texto completo
              if (!findings) {
                findings = analysisText;
              }
            }

            // Atualizar o registro com os resultados
            await db.updateAiAnalysis(result.id, {
              analysisResult: typeof analysisText === "string" ? analysisText : JSON.stringify(analysisText),
              findings: findings || "Análise concluída. Verifique o resultado completo.",
              recommendations: recommendations || "Consulte um profissional para avaliação clínica.",
              confidence: "85",
              analyzedAt: new Date(),
            });
            
            console.log(`[AI Analysis] Análise ${result.id} concluída com sucesso`);
          } catch (error) {
            console.error(`[AI Analysis] Erro na análise ${result.id}:`, error);
            await db.updateAiAnalysis(result.id, {
              findings: "Erro ao processar a análise. Por favor, tente novamente.",
              recommendations: "Recomendamos enviar a imagem novamente ou consultar um profissional.",
              confidence: "0",
              analyzedAt: new Date(),
            });
          }
        })();
        
        return result;
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          analysisResult: z.string().optional(),
          findings: z.string().optional(),
          recommendations: z.string().optional(),
          confidence: z.string().optional(),
          analyzedAt: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return db.updateAiAnalysis(input.id, {
          ...input.data,
          analyzedAt: input.data.analyzedAt ? new Date(input.data.analyzedAt) : undefined,
        });
      }),
    // Rota para verificar status de uma análise
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const analyses = await db.getAiAnalyses();
        return analyses.find(a => a.id === input.id) || null;
      }),
  }),

  // Check-ins - Multi-tenancy: filtra por clinicId
  checkins: router({
    list: clinicProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input, ctx }) => {
        return db.getCheckins(input?.status, ctx.clinicId);
      }),
    // Criação pública de check-in (para pacientes via QR Code)
    create: publicProcedure
      .input(z.object({
        patientId: z.number().optional(),
        patientName: z.string().optional(),
        phone: z.string().optional(),
        reason: z.string().optional(),
        queueType: z.enum(["budget", "dentist", "orthodontics", "implant", "prosthetics"]).optional(),
        clinicId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        // Usa clinicId do input ou default para 1
        const clinicId = input.clinicId || 1;
        return db.createCheckin({ ...input, clinicId });
      }),
    // Obter posição na fila (público para pacientes acompanharem)
    getQueuePosition: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getCheckinQueuePosition(input.id);
      }),
    update: clinicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          status: z.enum(["waiting", "called", "in_service", "completed"]).optional(),
          calledTime: z.string().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.updateCheckin(input.id, {
          ...input.data,
          calledTime: input.data.calledTime ? new Date(input.data.calledTime) : undefined,
        }, ctx.clinicId);
      }),
  }),

  // Patient Documents
  documents: router({
    list: publicProcedure
      .input(z.object({
        patientId: z.number(),
        type: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return db.getPatientDocuments(input.patientId, input.type);
      }),
    
    create: publicProcedure
      .input(z.object({
        patientId: z.number(),
        type: z.enum(["image", "document", "xray", "receipt"]).optional(),
        name: z.string().min(1),
        url: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createPatientDocument(input);
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deletePatientDocument(input.id);
      }),
  }),

  // WhatsApp Notifications
  whatsapp: router({
    list: publicProcedure
      .input(z.object({ status: z.string().optional(), type: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.getWhatsappNotifications(input);
      }),
    create: publicProcedure
      .input(z.object({
        patientId: z.number().optional(),
        appointmentId: z.number().optional(),
        phone: z.string().min(1),
        type: z.enum(["appointment_reminder", "queue_call", "confirmation", "followup", "custom"]).optional(),
        message: z.string().min(1),
        scheduledFor: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createWhatsappNotification({
          ...input,
          scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : undefined,
        });
      }),
    updateStatus: publicProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "sent", "delivered", "read", "failed"]),
        errorMessage: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.updateWhatsappNotification(input.id, {
          status: input.status,
          errorMessage: input.errorMessage,
          sentAt: input.status === "sent" ? new Date() : undefined,
        });
      }),
    getPending: publicProcedure.query(async () => {
      return db.getPendingNotifications();
    }),
  }),

  // Notification Settings
  notificationSettings: router({
    get: publicProcedure.query(async () => {
      return db.getNotificationSettings();
    }),
    save: publicProcedure
      .input(z.object({
        appointmentReminderEnabled: z.boolean().optional(),
        reminderHoursBefore: z.number().optional(),
        queueCallEnabled: z.boolean().optional(),
        confirmationEnabled: z.boolean().optional(),
        followupEnabled: z.boolean().optional(),
        followupDaysAfter: z.number().optional(),
        whatsappApiKey: z.string().optional(),
        whatsappPhoneId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.upsertNotificationSettings(input);
      }),
  }),

  // Orthodontic Treatments
  orthodontics: router({
    list: publicProcedure
      .input(z.object({ patientId: z.number().optional(), dentistId: z.number().optional(), status: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.getOrthodonticTreatments(input);
      }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getOrthodonticTreatmentById(input.id);
      }),
    create: publicProcedure
      .input(z.object({
        patientId: z.number(),
        dentistId: z.number().optional(),
        type: z.enum(["fixed_braces", "invisible_aligner", "retainer", "expander", "other"]).optional(),
        startDate: z.string().optional(),
        estimatedEndDate: z.string().optional(),
        upperArch: z.string().optional(),
        lowerArch: z.string().optional(),
        bracketType: z.string().optional(),
        notes: z.string().optional(),
        totalValue: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createOrthodonticTreatment({
          ...input,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          estimatedEndDate: input.estimatedEndDate ? new Date(input.estimatedEndDate) : undefined,
        });
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          status: z.enum(["planning", "active", "maintenance", "completed", "cancelled"]).optional(),
          actualEndDate: z.string().optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return db.updateOrthodonticTreatment(input.id, {
          ...input.data,
          actualEndDate: input.data.actualEndDate ? new Date(input.data.actualEndDate) : undefined,
        });
      }),
    stats: publicProcedure
      .input(z.object({ dentistId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.getOrthodontistStats(input?.dentistId);
      }),
  }),

  // Orthodontic Maintenances
  orthodonticMaintenances: router({
    list: publicProcedure
      .input(z.object({ treatmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getOrthodonticMaintenances(input.treatmentId);
      }),
    create: publicProcedure
      .input(z.object({
        treatmentId: z.number(),
        appointmentId: z.number().optional(),
        date: z.string(),
        procedure: z.string().optional(),
        wireChange: z.boolean().optional(),
        wireType: z.string().optional(),
        elasticChange: z.boolean().optional(),
        elasticType: z.string().optional(),
        notes: z.string().optional(),
        nextAppointmentDate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createOrthodonticMaintenance({
          ...input,
          date: new Date(input.date),
          nextAppointmentDate: input.nextAppointmentDate ? new Date(input.nextAppointmentDate) : undefined,
        });
      }),
  }),

  // Implant Plans
  implants: router({
    list: publicProcedure
      .input(z.object({ patientId: z.number().optional(), dentistId: z.number().optional(), status: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.getImplantPlans(input);
      }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getImplantPlanById(input.id);
      }),
    create: publicProcedure
      .input(z.object({
        patientId: z.number(),
        dentistId: z.number().optional(),
        toothNumber: z.string(),
        implantBrand: z.string().optional(),
        implantModel: z.string().optional(),
        implantDiameter: z.string().optional(),
        implantLength: z.string().optional(),
        boneGraft: z.boolean().optional(),
        boneGraftType: z.string().optional(),
        sinusLift: z.boolean().optional(),
        surgeryDate: z.string().optional(),
        healingTime: z.number().optional(),
        totalValue: z.string().optional(),
        notes: z.string().optional(),
        ctScanUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createImplantPlan({
          ...input,
          surgeryDate: input.surgeryDate ? new Date(input.surgeryDate) : undefined,
        });
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          status: z.enum(["planning", "surgery_scheduled", "implant_placed", "healing", "prosthesis_phase", "completed"]).optional(),
          surgeryDate: z.string().optional(),
          prosthesisDate: z.string().optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return db.updateImplantPlan(input.id, {
          ...input.data,
          surgeryDate: input.data.surgeryDate ? new Date(input.data.surgeryDate) : undefined,
          prosthesisDate: input.data.prosthesisDate ? new Date(input.data.prosthesisDate) : undefined,
        });
      }),
    stats: publicProcedure
      .input(z.object({ dentistId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.getImplantologistStats(input?.dentistId);
      }),
  }),

  // User Permissions
  permissions: router({
    get: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getUserPermissions(input.userId);
      }),
    set: publicProcedure
      .input(z.object({
        userId: z.number(),
        module: z.string(),
        canView: z.boolean().optional(),
        canCreate: z.boolean().optional(),
        canEdit: z.boolean().optional(),
        canDelete: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.setUserPermission(input);
      }),
    delete: publicProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteUserPermissions(input.userId);
      }),
  }),

  // Access Profiles
  accessProfiles: router({
    list: publicProcedure.query(async () => {
      return db.getAccessProfiles();
    }),
    create: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        permissions: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createAccessProfile(input);
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          permissions: z.string().optional(),
          isDefault: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return db.updateAccessProfile(input.id, input.data);
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteAccessProfile(input.id);
      }),
  }),

  // Dentist Area
  dentistArea: router({
    stats: publicProcedure
      .input(z.object({ dentistId: z.number() }))
      .query(async ({ input }) => {
        return db.getDentistAreaStats(input.dentistId);
      }),
  }),

  // Consultórios
  offices: router({
    list: publicProcedure.query(async () => {
      return db.getOffices();
    }),
    active: publicProcedure.query(async () => {
      return db.getActiveOffices();
    }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getOfficeById(input.id);
      }),
    create: publicProcedure
      .input(z.object({
        name: z.string(),
        number: z.string().optional(),
        floor: z.string().optional(),
        description: z.string().optional(),
        specialties: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createOffice(input);
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          number: z.string().optional(),
          floor: z.string().optional(),
          description: z.string().optional(),
          specialties: z.string().optional(),
          isActive: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return db.updateOffice(input.id, input.data);
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteOffice(input.id);
      }),
  }),

  // Fila de Atendimento
  serviceQueue: router({
    list: publicProcedure
      .input(z.object({ queueType: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.getServiceQueue(input?.queueType);
      }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getServiceQueueEntry(input.id);
      }),
    stats: publicProcedure.query(async () => {
      return db.getServiceQueueStats();
    }),
    add: publicProcedure
      .input(z.object({
        patientId: z.number(),
        patientName: z.string(),
        queueType: z.enum(["reception", "budget", "dentist", "orthodontics", "implant", "prosthetics"]),
        priority: z.enum(["normal", "high", "urgent"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.addToServiceQueue(input);
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          queueType: z.enum(["reception", "budget", "dentist", "orthodontics", "implant", "prosthetics"]).optional(),
          status: z.enum(["waiting", "called", "in_service", "pending_payment", "completed", "forwarded"]).optional(),
          priority: z.enum(["normal", "high", "urgent"]).optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return db.updateServiceQueueEntry(input.id, input.data);
      }),
    callPatient: publicProcedure
      .input(z.object({
        id: z.number(),
        officeId: z.number(),
        officeName: z.string(),
        professionalId: z.number().optional(),
        professionalName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.callPatientFromQueue(input.id, input.officeId, input.officeName, input.professionalId, input.professionalName);
      }),
    startService: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.startService(input.id);
      }),
    forward: publicProcedure
      .input(z.object({
        id: z.number(),
        nextQueue: z.string(),
        notes: z.string().optional(),
        evaluationNotes: z.string().optional(),
        amountToPay: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.finishServiceAndForward(input.id, input.nextQueue, input.notes, input.evaluationNotes, input.amountToPay);
      }),
    requestPayment: publicProcedure
      .input(z.object({
        id: z.number(),
        amountToPay: z.number(),
        evaluationNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.requestPayment(input.id, input.amountToPay, input.evaluationNotes);
      }),
    receivePayment: publicProcedure
      .input(z.object({
        id: z.number(),
        amountPaid: z.number(),
        paymentMethod: z.string(),
      }))
      .mutation(async ({ input }) => {
        return db.receivePayment(input.id, input.amountPaid, input.paymentMethod);
      }),
    complete: publicProcedure
      .input(z.object({
        id: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.completeService(input.id, input.notes);
      }),
    cancel: publicProcedure
      .input(z.object({
        id: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.cancelServiceQueueEntry(input.id, input.reason);
      }),
    history: publicProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ input }) => {
        return db.getQueueHistoryByPatient(input.patientId);
      }),
  }),

  // Painel TV
  tvPanel: router({
    activeCalls: publicProcedure.query(async () => {
      return db.getActiveTvPanelCalls();
    }),
    recentCalls: publicProcedure.query(async () => {
      return db.getRecentTvPanelCalls();
    }),
  }),

  // Stripe - Pagamentos
  stripe: router({
    isConfigured: publicProcedure.query(() => {
      return { configured: isStripeConfigured() };
    }),
    
    createCheckoutSession: publicProcedure
      .input(z.object({
        patientId: z.number(),
        patientName: z.string(),
        patientEmail: z.string().email().optional(),
        budgetId: z.number().optional(),
        amount: z.number(), // em centavos
        description: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!stripe) {
          throw new Error("Stripe não configurado");
        }

        const origin = ctx.req.headers.origin || "http://localhost:3000";

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "brl",
                product_data: {
                  name: input.description,
                  description: `Paciente: ${input.patientName}`,
                },
                unit_amount: input.amount,
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${origin}/financeiro?payment=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/financeiro?payment=cancelled`,
          customer_email: input.patientEmail,
          client_reference_id: input.patientId.toString(),
          metadata: {
            patient_id: input.patientId.toString(),
            patient_name: input.patientName,
            budget_id: input.budgetId?.toString() || "",
          },
          allow_promotion_codes: true,
        });

        return { url: session.url, sessionId: session.id };
      }),

    getPaymentStatus: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        if (!stripe) {
          throw new Error("Stripe não configurado");
        }

        const session = await stripe.checkout.sessions.retrieve(input.sessionId);
        return {
          status: session.payment_status,
          amountTotal: session.amount_total,
          customerEmail: session.customer_email,
        };
      }),
    
    // Criar link de pagamento para orçamento
    createPaymentLink: clinicProcedure
      .input(z.object({
        budgetId: z.number(),
        patientId: z.number(),
        patientName: z.string(),
        patientEmail: z.string().email().optional(),
        patientPhone: z.string().optional(),
        amount: z.number(), // em centavos
        description: z.string(),
        expiresInDays: z.number().optional().default(7),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!stripe) {
          throw new Error("Stripe não configurado");
        }

        const origin = ctx.req.headers.origin || "http://localhost:3000";

        // Criar sessão de checkout com link compartilhável
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card", "boleto"],
          line_items: [
            {
              price_data: {
                currency: "brl",
                product_data: {
                  name: `Orçamento #${input.budgetId}`,
                  description: input.description,
                },
                unit_amount: input.amount,
              },
              quantity: 1,
            },
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
            clinic_id: ctx.clinicId.toString(),
          },
          expires_at: Math.floor(Date.now() / 1000) + (input.expiresInDays * 24 * 60 * 60),
          allow_promotion_codes: true,
          phone_number_collection: { enabled: true },
        });

        return { 
          url: session.url, 
          sessionId: session.id,
          expiresAt: new Date(session.expires_at! * 1000).toISOString(),
        };
      }),
  }),

  // File Upload
  upload: router({
    file: publicProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64
        contentType: z.string(),
        folder: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileData, "base64");
        const folder = input.folder || "uploads";
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const key = `${folder}/${timestamp}-${randomSuffix}-${input.fileName}`;
        
        await storagePut(key, buffer, input.contentType);
        // Retornar a URL do proxy em vez da URL direta do CloudFront
        const proxyUrl = `/api/storage/image?key=${encodeURIComponent(key)}`;
        return { url: proxyUrl, key };
      }),
    
    // Proxy para servir imagens do storage (contorna problema de CORS/acesso)
    getImageUrl: publicProcedure
      .input(z.object({
        key: z.string(),
      }))
      .query(async ({ input }) => {
        try {
          const { url } = await storageGet(input.key);
          return { url };
        } catch (error) {
          return { url: null };
        }
      }),
  }),

  // Admin - Gerenciamento de Clínicas e Usuários (apenas superadmin)
  admin: router({
    // Estatísticas gerais
    stats: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user || ctx.user.role !== "superadmin") {
        throw new Error("Acesso negado");
      }
      const clinicsCount = await db.getClinicsCount();
      const clinics = await db.getClinics();
      const users = await db.getAllUsers();
      return {
        totalClinics: clinicsCount,
        totalUsers: users.length,
        activeClinics: clinics.filter(c => c.isActive).length,
        activeUsers: users.filter(u => u.isActive).length,
      };
    }),

    // Clínicas
    clinics: router({
      // Procedure pública para buscar dados da clínica (para check-in e painel TV)
      getPublicInfo: publicProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
          const clinic = await db.getClinicById(input.id);
          if (!clinic) {
            return null;
          }
          // Retorna apenas informações públicas (nome e logo)
          return {
            id: clinic.id,
            name: clinic.name,
            logoUrl: clinic.logoUrl,
          };
        }),
      
      list: publicProcedure.query(async ({ ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin") {
          throw new Error("Acesso negado");
        }
        return db.getClinics();
      }),
      
      getById: publicProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input, ctx }) => {
          if (!ctx.user || ctx.user.role !== "superadmin") {
            throw new Error("Acesso negado");
          }
          return db.getClinicById(input.id);
        }),
      
      create: publicProcedure
        .input(z.object({
          name: z.string().min(2),
          slug: z.string().min(2),
          cnpj: z.string().optional(),
          cro: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().email().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          logoUrl: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user || ctx.user.role !== "superadmin") {
            throw new Error("Acesso negado");
          }
          return db.createClinic({
            ...input,
            isActive: true,
          });
        }),
      
      update: publicProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().optional(),
          slug: z.string().optional(),
          cnpj: z.string().optional(),
          cro: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          logoUrl: z.string().optional(),
          isActive: z.boolean().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user || ctx.user.role !== "superadmin") {
            throw new Error("Acesso negado");
          }
          const { id, ...data } = input;
          await db.updateClinic(id, data);
          return { success: true };
        }),
      
      delete: publicProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user || ctx.user.role !== "superadmin") {
            throw new Error("Acesso negado");
          }
          await db.deleteClinic(input.id);
          return { success: true };
        }),
      
      getUsers: publicProcedure
        .input(z.object({ clinicId: z.number() }))
        .query(async ({ input, ctx }) => {
          if (!ctx.user || ctx.user.role !== "superadmin") {
            throw new Error("Acesso negado");
          }
          return db.getClinicUsers(input.clinicId);
        }),
      
      // Gestão de usuários da clínica (para admins da clínica)
      getUsersWithDetails: publicProcedure
        .input(z.object({ clinicId: z.number() }))
        .query(async ({ input, ctx }) => {
          if (!ctx.user) throw new Error("Não autenticado");
          // Verificar se é superadmin ou admin/owner da clínica
          // Por enquanto, permitir para qualquer usuário autenticado
          return db.getClinicUsersWithDetails(input.clinicId);
        }),
      
      inviteUser: publicProcedure
        .input(z.object({
          email: z.string().email(),
          clinicId: z.number(),
          role: z.enum(["owner", "admin", "atendente", "dentista", "protesista", "ortodontista", "implantodontista", "bucomaxilo", "odontopediatria"]),
        }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user) throw new Error("Não autenticado");
          return db.inviteUserToClinic(input.email, input.clinicId, input.role);
        }),
      
      updateUserRole: publicProcedure
        .input(z.object({
          userClinicId: z.number(),
          role: z.enum(["owner", "admin", "atendente", "dentista", "protesista", "ortodontista", "implantodontista", "bucomaxilo", "odontopediatria"]),
        }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user) throw new Error("Não autenticado");
          await db.updateUserClinicById(input.userClinicId, { role: input.role });
          return { success: true };
        }),
      
      toggleUserActive: publicProcedure
        .input(z.object({
          userClinicId: z.number(),
          isActive: z.boolean(),
        }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user) throw new Error("Não autenticado");
          await db.updateUserClinicById(input.userClinicId, { isActive: input.isActive });
          return { success: true };
        }),
      
      removeUser: publicProcedure
        .input(z.object({ userClinicId: z.number() }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user) throw new Error("Não autenticado");
          await db.removeUserFromClinicById(input.userClinicId);
          return { success: true };
        }),
    }),

    // Usuários
    users: router({
      list: publicProcedure.query(async ({ ctx }) => {
        if (!ctx.user || (ctx.user.role !== "superadmin" && ctx.user.role !== "admin")) {
          throw new Error("Acesso negado");
        }
        
        // Superadmin vê todos os usuários
        if (ctx.user.role === "superadmin") {
          return db.getAllUsers();
        }
        
        // Admin comum vê apenas usuários da sua clínica
        const clinicId = ctx.user.clinicId;
        if (!clinicId) {
          return [];
        }
        return db.getUsersByClinicId(clinicId);
      }),
      
      getById: publicProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input, ctx }) => {
          if (!ctx.user || (ctx.user.role !== "superadmin" && ctx.user.role !== "admin")) {
            throw new Error("Acesso negado");
          }
          return db.getUserById(input.id);
        }),
      
      create: publicProcedure
        .input(z.object({
          email: z.string().email(),
          password: z.string().min(6),
          name: z.string().min(2),
          phone: z.string().optional(),
          role: z.enum(["user", "admin", "superadmin"]),
          clinicId: z.number().optional(),
          clinicRole: z.enum(["owner", "admin", "atendente", "dentista", "protesista", "ortodontista", "implantodontista", "bucomaxilo", "odontopediatria"]).optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user || (ctx.user.role !== "superadmin" && ctx.user.role !== "admin")) {
            throw new Error("Acesso negado");
          }
          
          const existingUser = await db.getUserByEmail(input.email);
          if (existingUser) {
            throw new Error("Email já cadastrado");
          }
          
          // Obter clinicId do admin que está criando
          const adminClinicId = input.clinicId || ctx.user.clinicId;
          
          // Criar o usuário já com o clinicId definido
          const newUser = await db.createUserWithPassword({
            ...input,
            clinicId: adminClinicId ?? undefined,
          });
          
          // Vincular à clínica na tabela de associação também
          if (adminClinicId && newUser.id) {
            await db.addUserToClinic({
              userId: newUser.id,
              clinicId: adminClinicId,
              role: input.clinicRole || "atendente",
              isActive: true,
            });
          }
          
          return newUser;
        }),
      
      update: publicProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().optional(),
          phone: z.string().optional(),
          role: z.enum(["user", "admin", "superadmin"]).optional(),
          clinicId: z.number().nullable().optional(),
          isActive: z.boolean().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user || (ctx.user.role !== "superadmin" && ctx.user.role !== "admin")) {
            throw new Error("Acesso negado");
          }
          const { id, ...data } = input;
          await db.updateUser(id, data);
          return { success: true };
        }),
      
      delete: publicProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user || (ctx.user.role !== "superadmin" && ctx.user.role !== "admin")) {
            throw new Error("Acesso negado");
          }
          await db.deleteUser(input.id);
          return { success: true };
        }),
      
      resetPassword: publicProcedure
        .input(z.object({
          id: z.number(),
          newPassword: z.string().min(6),
        }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user || (ctx.user.role !== "superadmin" && ctx.user.role !== "admin")) {
            throw new Error("Acesso negado");
          }
          await db.updateUserPassword(input.id, input.newPassword);
          return { success: true };
        }),
      
      getClinics: publicProcedure
        .input(z.object({ userId: z.number() }))
        .query(async ({ input, ctx }) => {
          if (!ctx.user || (ctx.user.role !== "superadmin" && ctx.user.role !== "admin")) {
            throw new Error("Acesso negado");
          }
          return db.getUserClinics(input.userId);
        }),
      
      addToClinic: publicProcedure
        .input(z.object({
          userId: z.number(),
          clinicId: z.number(),
          role: z.enum(["owner", "admin", "atendente", "dentista", "protesista", "ortodontista", "implantodontista", "bucomaxilo", "odontopediatria"]),
        }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user || (ctx.user.role !== "superadmin" && ctx.user.role !== "admin")) {
            throw new Error("Acesso negado");
          }
          return db.addUserToClinic(input);
        }),
      
      removeFromClinic: publicProcedure
        .input(z.object({
          userId: z.number(),
          clinicId: z.number(),
        }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user || (ctx.user.role !== "superadmin" && ctx.user.role !== "admin")) {
            throw new Error("Acesso negado");
          }
          await db.removeUserFromClinic(input.userId, input.clinicId);
          return { success: true };
        }),
      
      // Obter o cargo do usuário atual na clínica
      getCurrentUserClinicRole: publicProcedure
        .query(async ({ ctx }) => {
          if (!ctx.user) throw new Error("Não autenticado");
          
          // Se for superadmin, retorna admin
          if (ctx.user.role === "superadmin") {
            return { role: "admin" as const };
          }
          
          // Buscar o cargo na clínica
          if (ctx.user.clinicId) {
            const userClinic = await db.getUserClinicRole(ctx.user.id, ctx.user.clinicId);
            if (userClinic) {
              return { role: userClinic.role };
            }
          }
          
          // Se for admin do sistema, retorna admin
          if (ctx.user.role === "admin") {
            return { role: "admin" as const };
          }
          
          // Padrão: atendente
          return { role: "atendente" as const };
        }),
    }),
    
    // Permissões por cargo
    permissions: router({
      list: publicProcedure.query(async ({ ctx }) => {
        if (!ctx.user) throw new Error("Não autenticado");
        return db.getAllRolePermissions();
      }),
      
      getByRole: publicProcedure
        .input(z.object({ role: z.string() }))
        .query(async ({ input, ctx }) => {
          if (!ctx.user) throw new Error("Não autenticado");
          return db.getRolePermissions(input.role);
        }),
      
      update: publicProcedure
        .input(z.object({
          role: z.string(),
          permissions: z.object({
            canViewPainel: z.boolean().optional(),
            canViewAtendente: z.boolean().optional(),
            canViewPacientes: z.boolean().optional(),
            canViewProntuarios: z.boolean().optional(),
            canViewAgenda: z.boolean().optional(),
            canViewOrcamentista: z.boolean().optional(),
            canViewAreaDentista: z.boolean().optional(),
            canViewAreaOrtodontista: z.boolean().optional(),
            canViewAreaImplantodontista: z.boolean().optional(),
            canViewAreaProtesista: z.boolean().optional(),
            canViewAreaBucomaxilo: z.boolean().optional(),
            canViewAreaOdontopediatria: z.boolean().optional(),
            canViewProcedimentos: z.boolean().optional(),
            canViewDentistas: z.boolean().optional(),
            canViewProteses: z.boolean().optional(),
            canViewFinanceiro: z.boolean().optional(),
            canViewConvenios: z.boolean().optional(),
            canViewEstoque: z.boolean().optional(),
            canViewRelatorios: z.boolean().optional(),
            canViewAnaliseIA: z.boolean().optional(),
            canViewQRCheckin: z.boolean().optional(),
            canViewPainelTV: z.boolean().optional(),
            canViewNotificacoes: z.boolean().optional(),
            canViewGestaoUsuarios: z.boolean().optional(),
            canViewConfiguracoes: z.boolean().optional(),
            canViewAdmin: z.boolean().optional(),
          }),
        }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user) throw new Error("Não autenticado");
          
          // Garantir que o Painel sempre fique ativo - proteção no backend
          const permissionsToSave = {
            ...input.permissions,
            canViewPainel: true, // Sempre forçar como true
          };
          
          await db.upsertRolePermissions(input.role, permissionsToSave);
          return { success: true };
        }),
      
      initializeDefaults: publicProcedure
        .mutation(async ({ ctx }) => {
          if (!ctx.user) throw new Error("Não autenticado");
          await db.initializeDefaultPermissions();
          return { success: true };
        }),
    }),
    
    // Planos de assinatura
    plans: router({
      list: publicProcedure.query(async ({ ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin") {
          throw new Error("Acesso negado");
        }
        return db.getPlans(false); // Incluir inativos para admin
      }),
      
      listActive: publicProcedure.query(async () => {
        return db.getPlans(true); // Apenas ativos para público
      }),
      
      getById: publicProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input, ctx }) => {
          if (!ctx.user || ctx.user.role !== "superadmin") {
            throw new Error("Acesso negado");
          }
          return db.getPlanById(input.id);
        }),
      
      create: publicProcedure
        .input(z.object({
          name: z.string().min(2),
          slug: z.string().min(2),
          description: z.string().optional(),
          price: z.string(),
          billingCycle: z.enum(["monthly", "yearly"]),
          maxUsers: z.number().optional(),
          maxPatients: z.number().optional(),
          maxAppointmentsPerMonth: z.number().optional(),
          hasAIAnalysis: z.boolean().optional(),
          hasWhatsAppNotifications: z.boolean().optional(),
          hasTVPanel: z.boolean().optional(),
          hasAdvancedReports: z.boolean().optional(),
          hasMultipleLocations: z.boolean().optional(),
          hasAPIAccess: z.boolean().optional(),
          hasPrioritySupport: z.boolean().optional(),
          sortOrder: z.number().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user || ctx.user.role !== "superadmin") {
            throw new Error("Acesso negado");
          }
          return db.createPlan(input);
        }),
      
      update: publicProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().optional(),
          slug: z.string().optional(),
          description: z.string().optional(),
          price: z.string().optional(),
          billingCycle: z.enum(["monthly", "yearly"]).optional(),
          maxUsers: z.number().optional(),
          maxPatients: z.number().optional(),
          maxAppointmentsPerMonth: z.number().optional(),
          hasAIAnalysis: z.boolean().optional(),
          hasWhatsAppNotifications: z.boolean().optional(),
          hasTVPanel: z.boolean().optional(),
          hasAdvancedReports: z.boolean().optional(),
          hasMultipleLocations: z.boolean().optional(),
          hasAPIAccess: z.boolean().optional(),
          hasPrioritySupport: z.boolean().optional(),
          isActive: z.boolean().optional(),
          sortOrder: z.number().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user || ctx.user.role !== "superadmin") {
            throw new Error("Acesso negado");
          }
          const { id, ...data } = input;
          await db.updatePlan(id, data);
          return { success: true };
        }),
      
      delete: publicProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user || ctx.user.role !== "superadmin") {
            throw new Error("Acesso negado");
          }
          await db.deletePlan(input.id);
          return { success: true };
        }),
    }),
    
    // Assinaturas das clínicas
    subscriptions: router({
      stats: publicProcedure.query(async ({ ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin") {
          throw new Error("Acesso negado");
        }
        return db.getClinicSubscriptionStats();
      }),
      
      listClinicsWithStatus: publicProcedure.query(async ({ ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin") {
          throw new Error("Acesso negado");
        }
        return db.getClinicsWithSubscriptionStatus();
      }),
      
      getOverdue: publicProcedure.query(async ({ ctx }) => {
        if (!ctx.user || ctx.user.role !== "superadmin") {
          throw new Error("Acesso negado");
        }
        return db.getOverdueClinics();
      }),
      
      updateClinicPlan: publicProcedure
        .input(z.object({
          clinicId: z.number(),
          planId: z.number(),
        }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user || ctx.user.role !== "superadmin") {
            throw new Error("Acesso negado");
          }
          await db.updateClinicSubscription(input.clinicId, {
            planId: input.planId,
            subscriptionStatus: "active",
            subscriptionStartedAt: new Date(),
          });
          return { success: true };
        }),
      
      updateStatus: publicProcedure
        .input(z.object({
          clinicId: z.number(),
          status: z.enum(["trial", "active", "past_due", "canceled", "suspended"]),
        }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user || ctx.user.role !== "superadmin") {
            throw new Error("Acesso negado");
          }
          await db.updateClinicSubscription(input.clinicId, {
            subscriptionStatus: input.status,
          });
          // Se suspender, desativar a clínica
          if (input.status === "suspended") {
            await db.suspendClinic(input.clinicId);
          } else if (input.status === "active") {
            await db.reactivateClinic(input.clinicId);
          }
          return { success: true };
        }),
      
      suspendClinic: publicProcedure
        .input(z.object({ clinicId: z.number() }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user || ctx.user.role !== "superadmin") {
            throw new Error("Acesso negado");
          }
          await db.suspendClinic(input.clinicId);
          return { success: true };
        }),
      
      reactivateClinic: publicProcedure
        .input(z.object({ clinicId: z.number() }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user || ctx.user.role !== "superadmin") {
            throw new Error("Acesso negado");
          }
          await db.reactivateClinic(input.clinicId);
          return { success: true };
        }),
      
      registerPayment: publicProcedure
        .input(z.object({
          clinicId: z.number(),
          amount: z.number(),
        }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user || ctx.user.role !== "superadmin") {
            throw new Error("Acesso negado");
          }
          const clinic = await db.getClinicById(input.clinicId);
          if (!clinic) throw new Error("Clínica não encontrada");
          
          // Calcular próxima data de pagamento (30 dias)
          const nextPayment = new Date();
          nextPayment.setDate(nextPayment.getDate() + 30);
          
          await db.updateClinicSubscription(input.clinicId, {
            subscriptionStatus: "active",
            lastPaymentAt: new Date(),
            nextPaymentAt: nextPayment,
          });
          
          // Reativar se estava suspensa
          if (clinic.subscriptionStatus === "suspended" || clinic.subscriptionStatus === "past_due") {
            await db.reactivateClinic(input.clinicId);
          }
          
          return { success: true };
        }),
      
      // Obter informações do trial/assinatura da clínica atual
      getSubscriptionInfo: publicProcedure.query(async ({ ctx }) => {
        if (!ctx.user) {
          throw new Error("Não autenticado");
        }
        
        // Superadmin não tem restrições
        if (ctx.user.role === "superadmin") {
          return {
            status: "active" as const,
            isTrialExpired: false,
            daysRemaining: null,
            showExpirationWarning: false,
            canAccess: true,
          };
        }
        
        if (!ctx.user.clinicId) {
          throw new Error("Usuário não está associado a nenhuma clínica");
        }
        
        const clinic = await db.getClinicById(ctx.user.clinicId);
        if (!clinic) {
          throw new Error("Clínica não encontrada");
        }
        
        const now = new Date();
        let daysRemaining: number | null = null;
        let isTrialExpired = false;
        let showExpirationWarning = false;
        let canAccess = true;
        
        // Calcular dias restantes do trial
        if (clinic.subscriptionStatus === "trial" && clinic.trialEndsAt) {
          const trialEnd = new Date(clinic.trialEndsAt);
          const diffTime = trialEnd.getTime() - now.getTime();
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (daysRemaining <= 0) {
            isTrialExpired = true;
            canAccess = false;
            daysRemaining = 0;
          } else if (daysRemaining <= 5) {
            showExpirationWarning = true;
          }
        }
        
        // Verificar status bloqueado
        const blockedStatuses = ["past_due", "canceled", "suspended"];
        if (blockedStatuses.includes(clinic.subscriptionStatus)) {
          canAccess = false;
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
        };
      }),
      
      // Criar checkout de assinatura
      createSubscriptionCheckout: publicProcedure
        .input(z.object({
          planId: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user) {
            throw new Error("Não autenticado");
          }
          
          if (!stripe) {
            throw new Error("Stripe não configurado");
          }
          
          if (!ctx.user.clinicId) {
            throw new Error("Usuário não está associado a nenhuma clínica");
          }
          
          const clinic = await db.getClinicById(ctx.user.clinicId);
          if (!clinic) {
            throw new Error("Clínica não encontrada");
          }
          
          const user = await db.getUserById(ctx.user.id);
          if (!user) {
            throw new Error("Usuário não encontrado");
          }
          
          const origin = ctx.req.headers.origin || "http://localhost:3000";
          
          // Definição dos planos de assinatura
          const PLANS: Record<string, { name: string; description: string; price: number }> = {
            basic: {
              name: "Plano Básico",
              description: "Até 200 pacientes, 2 usuários, 1 dentista",
              price: 14900, // R$ 149,00
            },
            professional: {
              name: "Plano Profissional",
              description: "Pacientes ilimitados, 5 usuários, 3 dentistas, IA, WhatsApp",
              price: 29900, // R$ 299,00
            },
            premium: {
              name: "Plano Premium",
              description: "Tudo ilimitado, multi-clínicas, API, suporte prioritário 24/7",
              price: 49900, // R$ 499,00
            },
          };
          
          // Selecionar plano (padrão: profissional)
          const selectedPlanId = input.planId || "professional";
          const selectedPlan = PLANS[selectedPlanId] || PLANS.professional;
          
          // Criar sessão de checkout para assinatura
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card", "boleto"],
            line_items: [
              {
                price_data: {
                  currency: "brl",
                  product_data: {
                    name: `Dentrics - ${selectedPlan.name}`,
                    description: selectedPlan.description,
                  },
                  unit_amount: selectedPlan.price,
                  recurring: {
                    interval: "month",
                  },
                },
                quantity: 1,
              },
            ],
            mode: "subscription",
            success_url: `${origin}/painel?subscription=success&plan=${selectedPlanId}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/inadimplente?subscription=cancelled`,
            customer_email: user.email,
            client_reference_id: clinic.id.toString(),
            metadata: {
              clinic_id: clinic.id.toString(),
              clinic_name: clinic.name,
              user_id: ctx.user.id.toString(),
              user_email: user.email,
              plan_id: selectedPlanId,
              plan_name: selectedPlan.name,
            },
            allow_promotion_codes: true,
            subscription_data: {
              metadata: {
                clinic_id: clinic.id.toString(),
                plan_id: selectedPlanId,
              },
            },
          });
          
          return { url: session.url, sessionId: session.id };
        }),
        
      // Criar sessão do portal do cliente Stripe
      createCustomerPortal: publicProcedure
        .mutation(async ({ ctx }) => {
          if (!ctx.user) {
            throw new Error("Não autenticado");
          }
          
          if (!stripe) {
            throw new Error("Stripe não configurado");
          }
          
          const user = await db.getUserById(ctx.user.id);
          if (!user || !user.clinicId) {
            throw new Error("Usuário ou clínica não encontrada");
          }
          
          const clinic = await db.getClinicById(user.clinicId);
          if (!clinic) {
            throw new Error("Clínica não encontrada");
          }
          
          // Verificar se a clínica tem um customer ID do Stripe
          let customerId = clinic.stripeCustomerId;
          
          if (!customerId) {
            // Criar customer no Stripe se não existir
            const customer = await stripe.customers.create({
              email: user.email,
              name: clinic.name,
              metadata: {
                clinic_id: clinic.id.toString(),
                user_id: ctx.user.id.toString(),
              },
            });
            customerId = customer.id;
            
            // Salvar o customer ID na clínica
            await db.updateClinicStripeCustomer(clinic.id, customerId);
          }
          
          // Obter a URL de origem do request
          const origin = ctx.req?.headers?.origin || "https://dentrics.manus.space";
          
          // Criar sessão do portal do cliente
          const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${origin}/perfil`,
          });
          
          return { url: session.url };
        }),
    }),
  }),

  // Dentrics IA - Assistente Inteligente
  dentricsIA: router({
    ask: clinicProcedure
      .input(z.object({
        message: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const clinicId = ctx.clinicId;
        const userId = ctx.user.id;
        const message = input.message.toLowerCase();
        
        // Buscar histórico de conversas para contexto
        const conversationHistory = await db.getIaConversations(clinicId, userId, 20);
        
        // Detectar tipo de pergunta
        const isPubMedSearch = message.includes("pubmed") || 
                               message.includes("estudo") || 
                               message.includes("pesquisa") ||
                               message.includes("artigo") ||
                               message.includes("científico");
        
        const isClinicData = message.includes("faturamento") ||
                             message.includes("paciente") ||
                             message.includes("consulta") ||
                             message.includes("orçamento") ||
                             message.includes("agenda") ||
                             message.includes("hoje") ||
                             message.includes("amanhã") ||
                             message.includes("mês") ||
                             message.includes("procedimento") ||
                             message.includes("valor") ||
                             message.includes("preço") ||
                             message.includes("tratamento") ||
                             message.includes("fila") ||
                             message.includes("atendimento") ||
                             message.includes("transaç") ||
                             message.includes("financeiro") ||
                             message.includes("estatística") ||
                             message.includes("relatório") ||
                             message.includes("análise") ||
                             message.includes("resumo") ||
                             message.includes("semana") ||
                             message.includes("ontem") ||
                             message.includes("dentista") ||
                             message.includes("horário");
        
        // Detectar se é uma ação (criar, adicionar, agendar)
        const isAction = message.includes("criar") ||
                         message.includes("adicionar") ||
                         message.includes("cadastrar") ||
                         message.includes("agendar") ||
                         message.includes("marcar") ||
                         message.includes("coloca") ||
                         message.includes("coloque") ||
                         message.includes("adicione") ||
                         message.includes("crie") ||
                         message.includes("editar") ||
                         message.includes("atualizar") ||
                         message.includes("alterar") ||
                         message.includes("excluir") ||
                         message.includes("deletar") ||
                         message.includes("remover");
        
        // Detectar se é busca/consulta
        const isSearch = message.includes("buscar") ||
                         message.includes("procurar") ||
                         message.includes("encontrar") ||
                         message.includes("listar") ||
                         message.includes("mostrar") ||
                         message.includes("quem") ||
                         message.includes("qual") ||
                         message.includes("quais") ||
                         message.includes("onde");
        
        // Detectar se é relatório
        const isReport = message.includes("relatório") ||
                         message.includes("resumo") ||
                         message.includes("balanço") ||
                         message.includes("estatística") ||
                         message.includes("análise") ||
                         message.includes("desempenho") ||
                         message.includes("performance");
        
        // Detectar se é alerta/sugestão
        const isAlert = message.includes("alerta") ||
                        message.includes("aviso") ||
                        message.includes("pendente") ||
                        message.includes("urgente") ||
                        message.includes("atenção") ||
                        message.includes("lembrete") ||
                        message.includes("retorno") ||
                        message.includes("aniversari");
        
        // Detectar se é agendamento inteligente
        const isSmartSchedule = (message.includes("agendar") || message.includes("marcar")) &&
                                (message.includes("para") || message.includes("amanhã") || 
                                 message.includes("segunda") || message.includes("terça") ||
                                 message.includes("quarta") || message.includes("quinta") ||
                                 message.includes("sexta") || message.includes("sábado") ||
                                 message.includes("às") || message.includes("as "));
        
        // Detectar se quer encontrar horário
        const isFindSlot = message.includes("horário disponível") ||
                           message.includes("próximo horário") ||
                           message.includes("vaga") ||
                           message.includes("quando posso") ||
                           message.includes("tem horário");
        
        let context = "";
        const sources: Array<{ title: string; url: string; type: "pubmed" | "journal" | "clinic" }> = [];
        
        // Buscar dados da clínica se necessário
        if (isClinicData) {
          try {
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            
            // Buscar estatísticas
            const patients = await db.getPatients(undefined, clinicId);
            const appointments = await db.getAppointments(String(clinicId));
            const transactions = await db.getTransactions(String(clinicId));
            const budgets = await db.getBudgets(undefined, clinicId);
            
            // Calcular métricas
            const todayAppointments = appointments.filter(a => {
              const date = new Date(a.date);
              return date >= startOfDay && date < new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
            });
            
            // Consultas de amanhã
            const tomorrow = new Date(startOfDay);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowEnd = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
            const tomorrowAppointments = appointments.filter(a => {
              const date = new Date(a.date);
              return date >= tomorrow && date < tomorrowEnd;
            });
            
            // Consultas desta semana
            const startOfWeek = new Date(startOfDay);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 7);
            const weekAppointments = appointments.filter(a => {
              const date = new Date(a.date);
              return date >= startOfWeek && date < endOfWeek;
            });
            
            // Consultas futuras (próximos 30 dias)
            const next30Days = new Date(startOfDay);
            next30Days.setDate(next30Days.getDate() + 30);
            const futureAppointments = appointments.filter(a => {
              const date = new Date(a.date);
              return date >= startOfDay && date <= next30Days;
            });
            
            // Formatar detalhes das consultas de hoje
            const todayDetails = todayAppointments.slice(0, 10).map(a => {
              const patient = patients.find(p => p.id === a.patientId);
              return `  - ${a.startTime || 'Sem horário'}: ${patient?.name || 'Paciente #' + a.patientId} (${a.type || 'Consulta'}) - Status: ${a.status || 'agendado'}`;
            }).join('\n');
            
            // Formatar detalhes das consultas de amanhã
            const tomorrowDetails = tomorrowAppointments.slice(0, 10).map(a => {
              const patient = patients.find(p => p.id === a.patientId);
              return `  - ${a.startTime || 'Sem horário'}: ${patient?.name || 'Paciente #' + a.patientId} (${a.type || 'Consulta'}) - Status: ${a.status || 'agendado'}`;
            }).join('\n');
            
            // Formatar agenda da semana
            const weekByDay: Record<string, any[]> = {};
            weekAppointments.forEach(a => {
              const dateStr = new Date(a.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
              if (!weekByDay[dateStr]) weekByDay[dateStr] = [];
              weekByDay[dateStr].push(a);
            });
            
            const weekDetails = Object.entries(weekByDay).map(([day, appts]) => {
              const apptList = appts.slice(0, 5).map(a => {
                const patient = patients.find(p => p.id === a.patientId);
                return `    - ${a.startTime || 'Sem horário'}: ${patient?.name || 'Paciente'}`;
              }).join('\n');
              return `  ${day} (${appts.length} consultas):\n${apptList}`;
            }).join('\n');
            
            // Formatar próximas consultas futuras
            const futureDetails = futureAppointments
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 15)
              .map(a => {
                const patient = patients.find(p => p.id === a.patientId);
                const dateStr = new Date(a.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
                return `  - ${dateStr} ${a.startTime || ''}: ${patient?.name || 'Paciente #' + a.patientId} (${a.type || 'Consulta'})`;
              }).join('\n');
            
            const monthRevenue = transactions
              .filter(t => t.type === "income" && new Date(t.date) >= startOfMonth)
              .reduce((sum, t) => sum + Number(t.value), 0);
            
            const pendingBudgets = budgets.filter(b => b.status === "pending");
            
            // Buscar procedimentos
            const procedures = await db.getProcedures(undefined, clinicId);
            const proceduresDetails = procedures.map(p => 
              `  - ${p.name}: R$ ${Number(p.pricePerTooth || 0).toFixed(2)} (${p.categoryId ? 'Cat. ' + p.categoryId : 'Geral'})`
            ).join('\n');
            
            // Buscar fila de atendimento
            const queues = await db.getWaitingQueue(undefined, clinicId);
            const queueDetails = queues.map(q => {
              const patient = patients.find(p => p.id === q.patientId);
              return `  - ${patient?.name || 'Paciente'}: ${q.status} - ${q.queueType || 'Recepção'}`;
            }).join('\n');
            
            context = `
## Dados da Clínica (Tempo Real)
- Total de pacientes cadastrados: ${patients.length}
- Faturamento do mês: R$ ${monthRevenue.toFixed(2)}
- Orçamentos pendentes: ${pendingBudgets.length}
- Total de transações: ${transactions.length}

## Procedimentos Cadastrados (${procedures.length} procedimentos)
${proceduresDetails || '  Nenhum procedimento cadastrado'}

## Fila de Atendimento Atual (${queues.length} pacientes)
${queueDetails || '  Nenhum paciente na fila'}

## Agenda Completa

### Consultas de Hoje (${todayAppointments.length} consultas)
${todayDetails || '  Nenhuma consulta agendada para hoje'}

### Consultas de Amanhã (${tomorrowAppointments.length} consultas)
${tomorrowDetails || '  Nenhuma consulta agendada para amanhã'}

### Agenda da Semana (${weekAppointments.length} consultas)
${weekDetails || '  Nenhuma consulta esta semana'}

### Próximas Consultas (próximos 30 dias - ${futureAppointments.length} total)
${futureDetails || '  Nenhuma consulta agendada'}

### Total de Consultas no Sistema: ${appointments.length}
`;
            
            sources.push({
              title: "Dados da Clínica",
              url: "/dashboard",
              type: "clinic",
            });
          } catch (error) {
            console.error("Erro ao buscar dados da clínica:", error);
          }
        }
        
        // Buscar no PubMed se necessário
        if (isPubMedSearch) {
          try {
            // Extrair termos de busca
            const searchTerms = input.message
              .replace(/pubmed|estudo|pesquisa|artigo|científico|buscar|últimos?|sobre/gi, "")
              .trim();
            
            if (searchTerms) {
              // Usar a API do PubMed (E-utilities)
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
                    context += `\n### ${article.title}\n`;
                    context += `- **Autores:** ${article.authors?.map((a: any) => a.name).join(", ") || "N/A"}\n`;
                    context += `- **Publicação:** ${article.source} (${article.pubdate})\n`;
                    context += `- **PMID:** ${id}\n`;
                    
                    sources.push({
                      title: article.title?.substring(0, 50) + "...",
                      url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
                      type: "pubmed",
                    });
                  }
                }
              }
            }
          } catch (error) {
            console.error("Erro ao buscar no PubMed:", error);
          }
        }
        
        // Executar ações se detectadas
        let actionResult = "";
        
        if (isAction) {
          // Detectar tipo de ação e executar
          
          // CRIAR PROCEDIMENTO(S)
          if ((message.includes("procedimento") || message.includes("tratamento")) && 
              (message.includes("criar") || message.includes("adicionar") || message.includes("cadastrar") || message.includes("coloca") || message.includes("crie") || message.includes("adicione"))) {
            
            const procedimentosEncontrados: Array<{nome: string, valor: number}> = [];
            
            // PADRÃO 1: "Nome R$ valor" ou "Nome - R$ valor" ou "Nome com valor R$ valor"
            const padraoNomeValor = /([A-Za-zÀ-ú][A-Za-zÀ-ú\s]+?)\s*(?:-|com\s*valor)?\s*R\$\s*([\d.,]+)/gi;
            let match;
            while ((match = padraoNomeValor.exec(message)) !== null) {
              let nome = match[1].trim()
                .replace(/\*\*/g, "")
                .replace(/^\d+\.\s*/, "")
                .replace(/procedimento|tratamento|criar|adicionar|cadastrar/gi, "")
                .trim();
              const valorStr = match[2].replace(/\./g, "").replace(",", ".");
              const valor = parseFloat(valorStr);
              if (nome.length > 2 && valor > 0) {
                procedimentosEncontrados.push({ nome, valor });
              }
            }
            
            // PADRÃO 2: Extração simples - "criar procedimento NOME valor R$ X"
            if (procedimentosEncontrados.length === 0) {
              // Extrair valor primeiro
              const valorMatch = message.match(/R\$\s*([\d.,]+)|([\d]+(?:[.,]\d{2})?)\s*(?:reais?)?/i);
              let valor = 0;
              if (valorMatch) {
                const valorStr = (valorMatch[1] || valorMatch[2] || "0").replace(/\./g, "").replace(",", ".");
                valor = parseFloat(valorStr);
              }
              
              // Extrair nome - pegar texto entre "procedimento/tratamento" e "valor/R$/número"
              let nome = "";
              const padraoNome = message.match(/(?:procedimento|tratamento)\s+([A-Za-zÀ-ú][A-Za-zÀ-ú\s]+?)\s*(?:valor|r\$|\d|$)/i);
              if (padraoNome) {
                nome = padraoNome[1].trim();
              } else {
                // Fallback: remover palavras-chave e pegar o que sobra
                nome = message
                  .replace(/criar|adicionar|cadastrar|coloca|coloque|crie|adicione|procedimentos?|tratamentos?|com|valor|de|r\$|reais?|por|no\s*sistema/gi, "")
                  .replace(/[\d.,]+/g, "")
                  .replace(/\*\*/g, "")
                  .trim();
              }
              
              if (nome && nome.length > 2 && valor > 0) {
                procedimentosEncontrados.push({ nome, valor });
              } else if (nome && nome.length > 2 && valor === 0) {
                actionResult = `\n\n⚠️ **ATENÇÃO:** Detectei que você quer criar o procedimento "${nome}", mas não encontrei o valor. Por favor, informe o valor.\n\n**Exemplo:** "Criar procedimento ${nome} valor R$ 150"`;
              } else if (valor > 0 && (!nome || nome.length <= 2)) {
                actionResult = `\n\n⚠️ **ATENÇÃO:** Detectei o valor R$ ${valor.toFixed(2)}, mas não consegui identificar o nome do procedimento.\n\n**Exemplo:** "Criar procedimento Limpeza valor R$ ${valor.toFixed(2)}"`;
              }
            }
            
            // Criar os procedimentos encontrados
            if (procedimentosEncontrados.length > 0) {
              const resultados: string[] = [];
              
              // Verificar duplicados antes de criar
              const procedimentosExistentes = await db.getProcedures(undefined, clinicId);
              
              for (const proc of procedimentosEncontrados) {
                // Formatar nome
                const nomeFormatado = proc.nome
                  .split(' ')
                  .filter(w => w.length > 0)
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join(' ');
                
                // Verificar se já existe
                const jaExiste = procedimentosExistentes.find(
                  (p: any) => p.name.toLowerCase() === nomeFormatado.toLowerCase()
                );
                
                if (jaExiste) {
                  resultados.push(`⚠️ ${nomeFormatado} - Já existe (R$ ${Number(jaExiste.pricePerTooth).toFixed(2)})`);
                  continue;
                }
                
                try {
                  await db.createProcedure({
                    clinicId: clinicId,
                    name: nomeFormatado,
                    pricePerTooth: proc.valor.toFixed(2),
                    isActive: true,
                  });
                  
                  // Verificar se foi criado
                  const verificacao = await db.getProcedures(nomeFormatado, clinicId);
                  if (verificacao.length > 0) {
                    resultados.push(`✅ ${nomeFormatado} - R$ ${proc.valor.toFixed(2)} (verificado)`);
                  } else {
                    resultados.push(`⚠️ ${nomeFormatado} - Criado mas não verificado`);
                  }
                } catch (error: any) {
                  resultados.push(`❌ ${nomeFormatado} - Erro: ${error.message || error}`);
                }
              }
              
              const criados = resultados.filter(r => r.startsWith("✅")).length;
              const existentes = resultados.filter(r => r.startsWith("⚠️")).length;
              const erros = resultados.filter(r => r.startsWith("❌")).length;
              
              if (criados > 0) {
                actionResult = `\n\n✅ **${criados} PROCEDIMENTO(S) CRIADO(S)!**\n${resultados.join("\n")}\n\nOs procedimentos foram adicionados ao catálogo da clínica.`;
              } else if (existentes > 0 && criados === 0) {
                actionResult = `\n\n⚠️ **PROCEDIMENTO(S) JÁ EXISTENTE(S):**\n${resultados.join("\n")}\n\nNenhum novo procedimento foi criado pois já existem no sistema.`;
              } else {
                actionResult = `\n\n❌ **ERRO AO CRIAR PROCEDIMENTO(S):**\n${resultados.join("\n")}`;
              }
            }
          }
          
          // CRIAR PACIENTE
          if (message.includes("paciente") && 
              (message.includes("criar") || message.includes("adicionar") || message.includes("cadastrar") || message.includes("coloca") || message.includes("crie"))) {
            
            // Extrair dados do paciente de forma inteligente
            const dadosPaciente: {
              name?: string;
              cpf?: string;
              phone?: string;
              email?: string;
              rg?: string;
              address?: string;
            } = {};
            
            // Extrair CPF (formato: XXX.XXX.XXX-XX ou apenas números)
            const cpfMatch = message.match(/(\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2})/i) || 
                            message.match(/cpf[:\s]*([\d.-]+)/i);
            if (cpfMatch) {
              dadosPaciente.cpf = cpfMatch[1].replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
            }
            
            // Extrair telefone (formato: (XX) XXXXX-XXXX ou similar)
            const phoneMatch = message.match(/(?:telefone|tel|fone|whatsapp|zap)[:\s]*\(?([\d\s()-]+)\)?/i) ||
                              message.match(/\(?\d{2}\)?[\s.-]?\d{4,5}[-.]?\d{4}/i);
            if (phoneMatch) {
              dadosPaciente.phone = phoneMatch[1] || phoneMatch[0];
            }
            
            // Extrair email
            const emailMatch = message.match(/([\w.-]+@[\w.-]+\.[a-z]{2,})/i);
            if (emailMatch) {
              dadosPaciente.email = emailMatch[1].toLowerCase();
            }
            
            // Extrair RG
            const rgMatch = message.match(/rg[:\s]*([\d.-]+)/i);
            if (rgMatch) {
              dadosPaciente.rg = rgMatch[1];
            }
            
            // Extrair nome - MÉTODO MELHORADO
            // Primeiro, tentar encontrar o nome após "paciente" e antes de qualquer campo específico
            let nomeExtraido = "";
            
            // Padrão 1: "cadastrar paciente NOME cpf/telefone/email..."
            const padraoNome1 = message.match(/(?:cadastrar|criar|adicionar)\s+(?:paciente|cliente)\s+([A-Za-zÀ-ú\s]+?)(?:\s+(?:cpf|telefone|tel|fone|email|e-mail|rg|whatsapp|zap|\d|@)|$)/i);
            if (padraoNome1 && padraoNome1[1]) {
              nomeExtraido = padraoNome1[1].trim();
            }
            
            // Padrão 2: "paciente NOME" no início
            if (!nomeExtraido) {
              const padraoNome2 = message.match(/paciente\s+([A-Za-zÀ-ú\s]+?)(?:\s+(?:cpf|telefone|tel|fone|email|e-mail|rg|whatsapp|zap|\d|@)|$)/i);
              if (padraoNome2 && padraoNome2[1]) {
                nomeExtraido = padraoNome2[1].trim();
              }
            }
            
            // Padrão 3: Se não encontrou, pegar apenas palavras alfabéticas no início
            if (!nomeExtraido) {
              const palavras = message.split(/\s+/);
              const nomePalavras: string[] = [];
              let encontrouPaciente = false;
              
              for (const palavra of palavras) {
                const palavraLimpa = palavra.toLowerCase();
                
                // Pular comandos
                if (["cadastrar", "criar", "adicionar", "colocar", "paciente", "cliente"].includes(palavraLimpa)) {
                  if (palavraLimpa === "paciente" || palavraLimpa === "cliente") {
                    encontrouPaciente = true;
                  }
                  continue;
                }
                
                // Se encontrou "paciente" e a palavra é apenas letras, é parte do nome
                if (encontrouPaciente && /^[A-Za-zÀ-ú]+$/.test(palavra)) {
                  nomePalavras.push(palavra);
                } else if (encontrouPaciente && nomePalavras.length > 0) {
                  // Parou de ser nome (encontrou número, email, etc)
                  break;
                }
              }
              
              if (nomePalavras.length > 0) {
                nomeExtraido = nomePalavras.join(" ");
              }
            }
            
            // Limpar e formatar o nome
            if (nomeExtraido && nomeExtraido.length > 1) {
              // Remover palavras que não são nomes (preposções, artigos, etc.)
              const palavrasIgnorar = ["com", "de", "da", "do", "e", "o", "a", "os", "as", "um", "uma", "para", "por"];
              
              dadosPaciente.name = nomeExtraido
                .split(/\s+/)
                .filter(word => word.length > 0 && !palavrasIgnorar.includes(word.toLowerCase()))
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(" ")
                .trim();
            }
            
            // Criar paciente se tiver pelo menos o nome
            if (dadosPaciente.name && dadosPaciente.name.length > 1) {
              try {
                const result = await db.createPatient({
                  clinicId: clinicId,
                  name: dadosPaciente.name,
                  cpf: dadosPaciente.cpf,
                  phone: dadosPaciente.phone,
                  email: dadosPaciente.email,
                  rg: dadosPaciente.rg,
                  isActive: true,
                });
                
                // Verificar se foi criado
                const verificacao = await db.getPatientById(result.id);
                
                let dadosPreenchidos = [`- Nome: ${dadosPaciente.name}`];
                if (dadosPaciente.cpf) dadosPreenchidos.push(`- CPF: ${dadosPaciente.cpf}`);
                if (dadosPaciente.phone) dadosPreenchidos.push(`- Telefone: ${dadosPaciente.phone}`);
                if (dadosPaciente.email) dadosPreenchidos.push(`- Email: ${dadosPaciente.email}`);
                if (dadosPaciente.rg) dadosPreenchidos.push(`- RG: ${dadosPaciente.rg}`);
                
                actionResult = `\n\n✅ **PACIENTE CADASTRADO COM SUCESSO!**\n\n${dadosPreenchidos.join("\n")}\n\n- ID: ${result.id}\n- Status: Ativo\n- Verificado no banco: ${verificacao ? "✓" : "✗"}`;
              } catch (error: any) {
                actionResult = `\n\n❌ **ERRO:** Não foi possível cadastrar o paciente. Erro: ${error.message || error}`;
              }
            } else {
              actionResult = `\n\n⚠️ **ATENÇÃO:** Não consegui identificar o nome do paciente. Por favor, informe no formato:\n"Cadastrar paciente Maria Silva cpf 123.456.789-00 telefone (11) 99999-9999"`;
            }
          }
          
          // CRIAR CONSULTÓRIO
          if ((message.includes("consultório") || message.includes("consultorio") || message.includes("sala")) && 
              (message.includes("criar") || message.includes("adicionar") || message.includes("cadastrar") || message.includes("coloca") || message.includes("crie"))) {
            let nomeConsultorio = message
              .replace(/criar|adicionar|cadastrar|coloca|coloque|crie|um|uma|o|a|consultório|consultorio|sala|com|nome|chamado|de/gi, "")
              .trim();
            
            // Limpar números e caracteres especiais extras
            nomeConsultorio = nomeConsultorio.replace(/^\s*[\d]+\s*/, "").trim();
            
            // Se o nome for apenas um número, usar como nome do consultório
            const apenasNumero = message.match(/consultório\s*(\d+)|consultorio\s*(\d+)/i);
            if (apenasNumero) {
              nomeConsultorio = apenasNumero[1] || apenasNumero[2];
            }
            
            if (nomeConsultorio && nomeConsultorio.length >= 1) {
              try {
                // VERIFICAR SE JÁ EXISTE antes de criar
                const consultoriosExistentes = await db.getOffices();
                const jaExiste = consultoriosExistentes.find(
                  (c: any) => c.name.toLowerCase() === nomeConsultorio.toLowerCase() && c.clinicId === clinicId
                );
                
                if (jaExiste) {
                  actionResult = `\n\n✅ **AÇÃO EXECUTADA:** O consultório "${nomeConsultorio}" já existe e está ativo na sua clínica. Não é possível adicionar um consultório com o mesmo nome novamente.`;
                } else {
                  await db.createOffice({
                    clinicId: clinicId,
                    name: nomeConsultorio.charAt(0).toUpperCase() + nomeConsultorio.slice(1),
                    isActive: true,
                  });
                  actionResult = `\n\n✅ **AÇÃO EXECUTADA:** Consultório "${nomeConsultorio}" criado com sucesso!`;
                }
              } catch (error) {
                actionResult = `\n\n❌ **ERRO:** Não foi possível criar o consultório. Erro: ${error}`;
              }
            }
          }
          
          // ADICIONAR ITEM(S) AO ESTOQUE
          if ((message.includes("estoque") || message.includes("unidade") || message.includes("unidades")) && 
              (message.includes("adicionar") || message.includes("criar") || message.includes("cadastrar") || message.includes("coloca") || message.includes("crie") || message.includes("coloque"))) {
            
            const itensEncontrados: Array<{nome: string, quantidade: number, valor?: number}> = [];
            
            // MÉTODO MELHORADO - Extração precisa de nome, quantidade e valor
            
            // Primeiro extrair o valor (se houver) para não confundir com quantidade
            let valorItem: number | undefined;
            const valorMatch = message.match(/(?:valor|preço|custo|custa|r\$)[:\s]*([\d.,]+)(?:\s*(?:reais|real|r\$))?/i) ||
                               message.match(/([\d.,]+)\s*(?:reais|real)/i);
            if (valorMatch) {
              valorItem = parseFloat(valorMatch[1].replace(/\./g, "").replace(",", "."));
            }
            
            // Extrair quantidade (número seguido de "unidades", "un", "caixa", etc.)
            let quantidadeItem = 1;
            const qtdMatch = message.match(/(\d+)\s*(?:unidade|un|peça|caixa|pacote|kit)s?/i);
            if (qtdMatch) {
              quantidadeItem = parseInt(qtdMatch[1]);
            }
            
            // Extrair nome do item - MÉTODO MELHORADO
            let nomeItem = "";
            
            // Padrão 1: "adicionar no estoque NOME QUANTIDADE unidades"
            const padraoNome1 = message.match(/(?:adicionar|criar|cadastrar|colocar?)\s+(?:no|ao)?\s*estoque\s+([A-Za-zÀ-ú\s]+?)\s+\d+/i);
            if (padraoNome1 && padraoNome1[1]) {
              nomeItem = padraoNome1[1].trim();
            }
            
            // Padrão 2: "estoque NOME QUANTIDADE"
            if (!nomeItem) {
              const padraoNome2 = message.match(/estoque\s+([A-Za-zÀ-ú\s]+?)\s+\d+/i);
              if (padraoNome2 && padraoNome2[1]) {
                nomeItem = padraoNome2[1].trim();
              }
            }
            
            // Padrão 3: Pegar palavras alfabéticas após "estoque" e antes de números
            if (!nomeItem) {
              const palavras = message.split(/\s+/);
              const nomePalavras: string[] = [];
              let encontrouEstoque = false;
              
              for (const palavra of palavras) {
                const palavraLimpa = palavra.toLowerCase();
                
                // Pular comandos e palavras-chave
                if (["adicionar", "criar", "cadastrar", "colocar", "coloque", "coloca", "crie", "no", "ao", "estoque", "item", "produto", "material", "com", "de"].includes(palavraLimpa)) {
                  if (palavraLimpa === "estoque") {
                    encontrouEstoque = true;
                  }
                  continue;
                }
                
                // Se encontrou "estoque" e a palavra é apenas letras, é parte do nome
                if (encontrouEstoque && /^[A-Za-zÀ-ú]+$/.test(palavra)) {
                  nomePalavras.push(palavra);
                } else if (encontrouEstoque && nomePalavras.length > 0) {
                  // Parou de ser nome (encontrou número, vírgula, etc)
                  break;
                }
              }
              
              if (nomePalavras.length > 0) {
                nomeItem = nomePalavras.join(" ");
              }
            }
            
            // Limpar e formatar o nome
            if (nomeItem && nomeItem.length > 1) {
              // Remover palavras que não são nomes de produtos
              const palavrasIgnorar = ["valor", "preço", "custo", "caixa", "unidade", "unidades", "un", "reais", "real", "a", "o", "do", "da"];
              
              nomeItem = nomeItem
                .split(/\s+/)
                .filter(word => word.length > 0 && !palavrasIgnorar.includes(word.toLowerCase()))
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(" ")
                .trim();
              
              if (nomeItem.length > 1) {
                itensEncontrados.push({ 
                  nome: nomeItem, 
                  quantidade: quantidadeItem,
                  valor: valorItem
                });
              }
            }
            
            // Se encontrou itens, criar todos
            if (itensEncontrados.length > 0) {
              const resultados: string[] = [];
              const itensCriados: string[] = [];
              
              for (const item of itensEncontrados) {
                const nomeFormatado = item.nome
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join(' ');
                
                // Tentar criar até 3 vezes
                let sucesso = false;
                let tentativas = 0;
                let ultimoErro = "";
                
                while (!sucesso && tentativas < 3) {
                  tentativas++;
                  try {
                    await db.createStockItem({
                      clinicId: clinicId,
                      name: nomeFormatado,
                      quantity: item.quantidade,
                      minQuantity: 10,
                      unit: "un",
                      costPrice: item.valor ? item.valor.toString() : undefined,
                    });
                    
                    // VERIFICAR se realmente foi criado
                    const verificacao = await db.getStockItems(nomeFormatado, clinicId);
                    if (verificacao.length > 0) {
                      sucesso = true;
                      itensCriados.push(nomeFormatado);
                      let resultado = `✅ ${nomeFormatado} - ${item.quantidade} un`;
                      if (item.valor) resultado += ` (R$ ${item.valor.toFixed(2)})`;
                      resultado += " (verificado ✓)";
                      resultados.push(resultado);
                    } else {
                      ultimoErro = "Item não encontrado após criação";
                    }
                  } catch (error: any) {
                    ultimoErro = error.message || String(error);
                  }
                }
                
                if (!sucesso) {
                  resultados.push(`❌ ${nomeFormatado} - Falhou após ${tentativas} tentativas: ${ultimoErro}`);
                }
              }
              
              // Verificar estoque final
              const estoqueAtual = await db.getStockItems(undefined, clinicId);
              const itensVerificados = itensCriados.filter(nome => 
                estoqueAtual.some(e => e.name.toLowerCase() === nome.toLowerCase())
              );
              
              const criados = resultados.filter(r => r.startsWith("✅")).length;
              const erros = resultados.filter(r => r.startsWith("❌")).length;
              
              actionResult = `\n\n📦 **ESTOQUE ATUALIZADO!**\n\n${resultados.join("\n")}\n\n**Resumo:** ${criados} item(ns) adicionado(s)${erros > 0 ? `, ${erros} falha(s)` : ""}\n**Verificação:** ${itensVerificados.length} de ${itensCriados.length} confirmados no banco de dados.`;
            } else {
              // Tentar extração simples para um único item
              const qtdMatch = message.match(/(\d+)/i);
              let quantidade = qtdMatch ? parseInt(qtdMatch[1]) : 1;
              
              let nomeItem = message
                .replace(/adicionar|criar|cadastrar|coloca|coloque|crie|ao|no|estoque|item|produto|material|unidade|un|peça|caixa|pacote|kit|com|quantidade|de|s\b/gi, "")
                .replace(/\d+/g, "")
                .replace(/,|\./g, "")
                .trim();
              
              if (nomeItem && nomeItem.length > 2) {
                const nomeFormatado = nomeItem.charAt(0).toUpperCase() + nomeItem.slice(1).toLowerCase();
                
                let sucesso = false;
                let tentativas = 0;
                
                while (!sucesso && tentativas < 3) {
                  tentativas++;
                  try {
                    await db.createStockItem({
                      clinicId: clinicId,
                      name: nomeFormatado,
                      quantity: quantidade,
                      minQuantity: 10,
                      unit: "un",
                    });
                    
                    // Verificar
                    const verificacao = await db.getStockItems(nomeFormatado, clinicId);
                    if (verificacao.length > 0) {
                      sucesso = true;
                      actionResult = `\n\n✅ **ITEM ADICIONADO AO ESTOQUE!**\n- Nome: ${nomeFormatado}\n- Quantidade: ${quantidade} unidades\n- Status: Verificado no banco de dados ✓`;
                    }
                  } catch (error: any) {
                    if (tentativas >= 3) {
                      actionResult = `\n\n❌ **ERRO:** Não foi possível adicionar "${nomeFormatado}" após ${tentativas} tentativas. Erro: ${error.message || error}`;
                    }
                  }
                }
              }
            }
          }
          
          // ENTRADA DE ESTOQUE (aumentar quantidade)
          if ((message.includes("entrada") || message.includes("repor") || message.includes("abastecer") || message.includes("aumentar")) && 
              (message.includes("estoque") || message.includes("quantidade"))) {
            
            const qtdMatch = message.match(/(\d+)/i);
            let quantidade = qtdMatch ? parseInt(qtdMatch[1]) : 0;
            
            let nomeItem = message
              .replace(/entrada|repor|abastecer|aumentar|estoque|quantidade|de|do|da|unidade|un|peça|caixa|pacote|kit|s\b/gi, "")
              .replace(/\d+/g, "")
              .trim();
            
            if (nomeItem && quantidade > 0) {
              try {
                // Buscar item pelo nome
                const items = await db.getStockItems(nomeItem, clinicId);
                if (items.length > 0) {
                  const item = items[0];
                  await db.createStockMovement({
                    stockItemId: item.id,
                    type: "in",
                    quantity: quantidade,
                    reason: "Entrada via Dentrics IA",
                  });
                  actionResult = `\n\n✅ **ENTRADA DE ESTOQUE REGISTRADA!**\n- Item: ${item.name}\n- Quantidade adicionada: +${quantidade} unidades\n- Nova quantidade: ${(item.quantity ?? 0) + quantidade} unidades`;
                } else {
                  actionResult = `\n\n⚠️ **ATENÇÃO:** Não encontrei o item "${nomeItem}" no estoque. Deseja que eu crie este item?`;
                }
              } catch (error: any) {
                actionResult = `\n\n❌ **ERRO:** Não foi possível registrar a entrada. Erro: ${error.message || error}`;
              }
            }
          }
          
          // SAÍDA DE ESTOQUE (diminuir quantidade)
          if ((message.includes("saída") || message.includes("retirar") || message.includes("baixa") || message.includes("consumir") || message.includes("usar")) && 
              (message.includes("estoque") || message.includes("quantidade"))) {
            
            const qtdMatch = message.match(/(\d+)/i);
            let quantidade = qtdMatch ? parseInt(qtdMatch[1]) : 0;
            
            let nomeItem = message
              .replace(/saída|retirar|baixa|consumir|usar|estoque|quantidade|de|do|da|unidade|un|peça|caixa|pacote|kit|s\b/gi, "")
              .replace(/\d+/g, "")
              .trim();
            
            if (nomeItem && quantidade > 0) {
              try {
                const items = await db.getStockItems(nomeItem, clinicId);
                if (items.length > 0) {
                  const item = items[0];
                  if ((item.quantity ?? 0) >= quantidade) {
                    await db.createStockMovement({
                      stockItemId: item.id,
                      type: "out",
                      quantity: quantidade,
                      reason: "Saída via Dentrics IA",
                    });
                    const novaQtd = (item.quantity ?? 0) - quantidade;
                    let alerta = "";
                    if (novaQtd <= (item.minQuantity ?? 10)) {
                      alerta = `\n\n⚠️ **ALERTA:** Estoque baixo! Quantidade abaixo do mínimo (${item.minQuantity ?? 10} un).`;
                    }
                    actionResult = `\n\n✅ **SAÍDA DE ESTOQUE REGISTRADA!**\n- Item: ${item.name}\n- Quantidade retirada: -${quantidade} unidades\n- Nova quantidade: ${novaQtd} unidades${alerta}`;
                  } else {
                    actionResult = `\n\n❌ **ERRO:** Quantidade insuficiente! O item "${item.name}" tem apenas ${item.quantity ?? 0} unidades em estoque.`;
                  }
                } else {
                  actionResult = `\n\n⚠️ **ATENÇÃO:** Não encontrei o item "${nomeItem}" no estoque.`;
                }
              } catch (error: any) {
                actionResult = `\n\n❌ **ERRO:** Não foi possível registrar a saída. Erro: ${error.message || error}`;
              }
            }
          }
          
          // CONSULTAR ESTOQUE
          if ((message.includes("estoque") || message.includes("itens") || message.includes("produtos")) && 
              (message.includes("listar") || message.includes("mostrar") || message.includes("ver") || message.includes("consultar") || message.includes("quais") || message.includes("quanto"))) {
            try {
              const items = await db.getStockItems(undefined, clinicId);
              if (items.length > 0) {
                const listaItens = items.map(item => {
                  const status = (item.quantity ?? 0) <= (item.minQuantity ?? 10) ? "⚠️" : "✅";
                  return `${status} ${item.name}: ${item.quantity ?? 0} ${item.unit || "un"}`;
                }).join("\n");
                const baixoEstoque = items.filter(i => (i.quantity ?? 0) <= (i.minQuantity ?? 10)).length;
                actionResult = `\n\n📦 **ESTOQUE ATUAL (${items.length} itens):**\n${listaItens}\n\n${baixoEstoque > 0 ? `⚠️ ${baixoEstoque} item(ns) com estoque baixo!` : "✅ Todos os itens com estoque adequado."}`;
              } else {
                actionResult = `\n\n📦 **ESTOQUE:** Nenhum item cadastrado no estoque. Deseja adicionar algum item?`;
              }
            } catch (error: any) {
              actionResult = `\n\n❌ **ERRO:** Não foi possível consultar o estoque. Erro: ${error.message || error}`;
            }
          }
          
          // ALERTAS PROATIVOS
          if (isAlert || message.includes("alerta") || message.includes("pendente") || message.includes("atenção")) {
            try {
              const alertas: string[] = [];
              
              // Estoque baixo
              const stockItems = await db.getStockItems(undefined, clinicId);
              const lowStock = stockItems.filter(s => (s.quantity ?? 0) <= (s.minQuantity ?? 10));
              if (lowStock.length > 0) {
                alertas.push(`📦 **ESTOQUE BAIXO:** ${lowStock.length} item(ns)\n   ${lowStock.slice(0, 5).map(s => `- ${s.name}: ${s.quantity} ${s.unit || 'un'}`).join('\n   ')}`);
              }
              
              // Pacientes que precisam retornar
              const returnAlerts = await db.getPendingReturnAlerts(clinicId);
              const urgentReturns = returnAlerts.filter(r => r.daysUntilReturn <= 7);
              if (urgentReturns.length > 0) {
                alertas.push(`📅 **RETORNOS URGENTES:** ${urgentReturns.length} paciente(s) precisam retornar esta semana`);
              }
              
              // Orçamentos pendentes antigos
              const budgets = await db.getBudgets(undefined, clinicId);
              const oldPending = budgets.filter(b => {
                if (b.status !== "pending") return false;
                const daysSince = Math.floor((Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                return daysSince > 7;
              });
              if (oldPending.length > 0) {
                alertas.push(`💰 **ORÇAMENTOS PENDENTES:** ${oldPending.length} orçamento(s) há mais de 7 dias`);
              }
              
              // Aniversariantes
              const patients = await db.getPatients(undefined, clinicId);
              const today = new Date();
              const birthdayToday = patients.filter(p => {
                if (!p.birthDate) return false;
                const birth = new Date(p.birthDate);
                return birth.getDate() === today.getDate() && birth.getMonth() === today.getMonth();
              });
              if (birthdayToday.length > 0) {
                alertas.push(`🎂 **ANIVERSARIANTES HOJE:** ${birthdayToday.map(p => p.name).join(", ")}`);
              }
              
              // Consultas de hoje não confirmadas
              const appointments = await db.getAppointments(undefined, undefined, undefined, clinicId);
              const todayAppts = appointments.filter(a => {
                const apptDate = new Date(a.date);
                return apptDate.toDateString() === today.toDateString() && a.status === "scheduled";
              });
              if (todayAppts.length > 0) {
                alertas.push(`📋 **CONSULTAS HOJE:** ${todayAppts.length} consulta(s) aguardando confirmação`);
              }
              
              if (alertas.length > 0) {
                actionResult = `\n\n🚨 **ALERTAS E PENDÊNCIAS:**\n\n${alertas.join('\n\n')}`;
              } else {
                actionResult = `\n\n✅ **TUDO EM DIA!** Não há alertas ou pendências no momento.`;
              }
            } catch (error: any) {
              console.error("Erro ao buscar alertas:", error);
            }
          }
          
          // RELATÓRIO RÁPIDO
          if (isReport || message.includes("relatório") || message.includes("resumo") || message.includes("balanço")) {
            try {
              const today = new Date();
              let startDate = new Date(today);
              let endDate = new Date(today);
              let periodo = "hoje";
              
              if (message.includes("semana")) {
                startDate.setDate(today.getDate() - 7);
                periodo = "da semana";
              } else if (message.includes("mês")) {
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                periodo = "do mês";
              } else if (message.includes("ontem")) {
                startDate.setDate(today.getDate() - 1);
                endDate.setDate(today.getDate() - 1);
                periodo = "de ontem";
              }
              
              const appointments = await db.getAppointments(undefined, undefined, undefined, clinicId);
              const transactions = await db.getTransactions(undefined, undefined, undefined, clinicId);
              const budgets = await db.getBudgets(undefined, clinicId);
              const patients = await db.getPatients(undefined, clinicId);
              
              // Filtrar por período
              const periodAppointments = appointments.filter(a => {
                const date = new Date(a.date);
                return date >= startDate && date <= endDate;
              });
              
              const periodTransactions = transactions.filter(t => {
                const date = new Date(t.date);
                return date >= startDate && date <= endDate;
              });
              
              const periodBudgets = budgets.filter(b => {
                const date = new Date(b.createdAt);
                return date >= startDate && date <= endDate;
              });
              
              const newPatients = patients.filter(p => {
                const date = new Date(p.createdAt);
                return date >= startDate && date <= endDate;
              });
              
              const income = periodTransactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.value), 0);
              const expenses = periodTransactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.value), 0);
              const profit = income - expenses;
              
              const completedAppts = periodAppointments.filter(a => a.status === "completed").length;
              const cancelledAppts = periodAppointments.filter(a => a.status === "cancelled").length;
              const approvedBudgets = periodBudgets.filter(b => b.status === "approved" || b.status === "completed").length;
              const conversionRate = periodBudgets.length > 0 ? Math.round((approvedBudgets / periodBudgets.length) * 100) : 0;
              
              actionResult = `\n\n📊 **RELATÓRIO ${periodo.toUpperCase()}:**

📅 **Atendimentos:**
- Total: ${periodAppointments.length}
- Realizados: ${completedAppts}
- Cancelados: ${cancelledAppts}

👤 **Pacientes:**
- Novos cadastros: ${newPatients.length}
- Total na clínica: ${patients.length}

💰 **Financeiro:**
- Receita: R$ ${income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Despesas: R$ ${expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Lucro: R$ ${profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

📄 **Orçamentos:**
- Criados: ${periodBudgets.length}
- Aprovados: ${approvedBudgets}
- Taxa de conversão: ${conversionRate}%`;
            } catch (error: any) {
              console.error("Erro ao gerar relatório:", error);
            }
          }
          
          // ENCONTRAR HORÁRIO DISPONÍVEL
          if (isFindSlot || message.includes("horário disponível") || message.includes("próximo horário") || message.includes("vaga")) {
            try {
              const appointments = await db.getAppointments(undefined, undefined, undefined, clinicId);
              const dentists = await db.getDentists(true, clinicId);
              const today = new Date();
              
              const availableSlots: Array<{ date: string; time: string; dentist?: string }> = [];
              
              // Buscar nos próximos 14 dias
              for (let day = 0; day < 14 && availableSlots.length < 5; day++) {
                const checkDate = new Date(today);
                checkDate.setDate(checkDate.getDate() + day);
                
                // Pular fins de semana
                if (checkDate.getDay() === 0 || checkDate.getDay() === 6) continue;
                
                const dateStr = checkDate.toISOString().split('T')[0];
                const dayAppointments = appointments.filter(a => 
                  new Date(a.date).toISOString().split('T')[0] === dateStr
                );
                
                // Verificar horários (8h-18h)
                for (let hour = 8; hour < 18 && availableSlots.length < 5; hour++) {
                  for (let minute = 0; minute < 60; minute += 30) {
                    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    
                    const isOccupied = dayAppointments.some(a => a.startTime === timeStr);
                    
                    if (!isOccupied) {
                      availableSlots.push({ 
                        date: dateStr, 
                        time: timeStr,
                        dentist: dentists[0]?.name || "Qualquer dentista"
                      });
                      break;
                    }
                  }
                  if (availableSlots.length >= 5) break;
                }
              }
              
              if (availableSlots.length > 0) {
                const slotsText = availableSlots.map(s => 
                  `📅 ${s.date} às ${s.time}${s.dentist ? ` (${s.dentist})` : ""}`
                ).join('\n');
                actionResult = `\n\n✅ **HORÁRIOS DISPONÍVEIS:**\n${slotsText}\n\nDeseja agendar algum desses horários?`;
              } else {
                actionResult = `\n\n⚠️ **AGENDA CHEIA:** Não encontrei horários disponíveis nos próximos 14 dias.`;
              }
            } catch (error: any) {
              console.error("Erro ao buscar horários:", error);
            }
          }
          
          // LISTAR PACIENTES
          if ((message.includes("paciente") || message.includes("cliente")) && 
              (message.includes("listar") || message.includes("mostrar") || message.includes("todos") || message.includes("quais"))) {
            try {
              const patients = await db.getPatients(undefined, clinicId);
              if (patients.length > 0) {
                const lista = patients.slice(0, 15).map(p => 
                  `- ${p.name}${p.phone ? ` | 📱 ${p.phone}` : ""}${p.cpf ? ` | CPF: ${p.cpf}` : ""}`
                ).join('\n');
                actionResult = `\n\n👥 **PACIENTES CADASTRADOS (${patients.length} total):**\n${lista}${patients.length > 15 ? `\n\n... e mais ${patients.length - 15} pacientes.` : ""}`;
              } else {
                actionResult = `\n\n👥 **PACIENTES:** Nenhum paciente cadastrado ainda.`;
              }
            } catch (error: any) {
              console.error("Erro ao listar pacientes:", error);
            }
          }
          
          // LISTAR PROCEDIMENTOS
          if ((message.includes("procedimento") || message.includes("tratamento") || message.includes("serviço")) && 
              (message.includes("listar") || message.includes("mostrar") || message.includes("todos") || message.includes("quais") || message.includes("tabela"))) {
            try {
              const procedures = await db.getProcedures(undefined, clinicId);
              if (procedures.length > 0) {
                const lista = procedures.map(p => 
                  `- ${p.name}: R$ ${Number(p.pricePerTooth || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                ).join('\n');
                actionResult = `\n\n🦷 **PROCEDIMENTOS CADASTRADOS (${procedures.length}):**\n${lista}`;
              } else {
                actionResult = `\n\n🦷 **PROCEDIMENTOS:** Nenhum procedimento cadastrado ainda. Deseja criar alguns?`;
              }
            } catch (error: any) {
              console.error("Erro ao listar procedimentos:", error);
            }
          }
          
          // AGENDA DE HOJE
          if ((message.includes("agenda") || message.includes("consulta")) && 
              (message.includes("hoje") || message.includes("agora"))) {
            try {
              const appointments = await db.getAppointments(undefined, undefined, undefined, clinicId);
              const patients = await db.getPatients(undefined, clinicId);
              const today = new Date();
              const todayStr = today.toISOString().split('T')[0];
              
              const todayAppts = appointments.filter(a => 
                new Date(a.date).toISOString().split('T')[0] === todayStr
              ).sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
              
              if (todayAppts.length > 0) {
                const lista = todayAppts.map(a => {
                  const patient = patients.find(p => p.id === a.patientId);
                  const statusIcon = a.status === "completed" ? "✅" : a.status === "cancelled" ? "❌" : "📌";
                  return `${statusIcon} ${a.startTime} - ${patient?.name || "Paciente"} (${a.type || "Consulta"})`;
                }).join('\n');
                actionResult = `\n\n📅 **AGENDA DE HOJE (${todayAppts.length} consultas):**\n${lista}`;
              } else {
                actionResult = `\n\n📅 **AGENDA DE HOJE:** Nenhuma consulta agendada para hoje.`;
              }
            } catch (error: any) {
              console.error("Erro ao buscar agenda:", error);
            }
          }
        }
        
        // Construir prompt para a IA - VERSÃO COM ACESSO REAL AO BANCO DE DADOS
        const systemPrompt = `Você é a **Dentrics IA**, o assistente REAL e INTEGRADO ao sistema de gestão da clínica odontológica.

## ⚠️ IMPORTANTE - VOCÊ TEM ACESSO REAL AO BANCO DE DADOS!
- Você NÃO é uma simulação. Você está CONECTADO ao banco de dados REAL da clínica.
- Todas as ações que você executa são REAIS e PERSISTENTES.
- Quando uma ação é executada, ela JÁ FOI salva no banco de dados.
- NUNCA diga que é uma simulação ou que não tem acesso real - VOCÊ TEM!
- NUNCA peça confirmação do usuário para ações que já foram executadas.

## 🚀 SUAS CAPACIDADES (TODAS REAIS E FUNCIONAIS):

### AÇÕES DIRETAS NO BANCO DE DADOS:
1. ✅ **CRIAR PROCEDIMENTOS** - "Criar procedimento Limpeza R$ 150" → SALVA NO BANCO
2. ✅ **CADASTRAR PACIENTES** - "Cadastrar paciente João Silva" → SALVA NO BANCO
3. ✅ **CRIAR CONSULTÓRIOS** - "Criar consultório Sala 1" → SALVA NO BANCO
4. ✅ **AGENDAR CONSULTAS** - "Agendar João para terça às 14h" → SALVA NO BANCO
5. ✅ **GERENCIAR ESTOQUE** - "Adicionar 100 luvas ao estoque" → SALVA NO BANCO
6. ✅ **EDITAR PACIENTES** - "Atualizar telefone do paciente Maria" → ATUALIZA NO BANCO
7. ✅ **EXCLUIR REGISTROS** - "Excluir procedimento X" → REMOVE DO BANCO

### CONSULTAS EM TEMPO REAL:
- Buscar pacientes por nome, CPF, telefone → LÊ DO BANCO
- Encontrar consultas por data, paciente, dentista → LÊ DO BANCO
- Listar procedimentos e valores → LÊ DO BANCO
- Consultar estoque e alertas → LÊ DO BANCO

### RELATÓRIOS COM DADOS REAIS:
- Relatório diário/semanal/mensal de atendimentos
- Análise financeira (faturamento, despesas, lucro)
- Taxa de conversão de orçamentos
- Procedimentos mais realizados

### ALERTAS PROATIVOS (DADOS REAIS):
- Estoque baixo
- Pacientes que precisam retornar
- Aniversariantes do dia
- Orçamentos pendentes antigos

## 📋 REGRAS DE COMPORTAMENTO:
1. **NUNCA** diga que é simulação - VOCÊ TEM ACESSO REAL
2. **CONFIRME** cada ação mostrando o resultado REAL do banco
3. **PERGUNTE** se faltar informação essencial
4. **MOSTRE** os dados reais quando consultados
5. Seja **CONCISO** mas completo
6. Use **EMOJIS** para tornar as respostas mais visuais
7. **NÃO** peça confirmação do usuário para ações já executadas

## 📊 DADOS REAIS DA CLÍNICA:
${context ? context : "(Consulte os dados usando os comandos disponíveis)"}

## ✨ RESULTADO DA ÚLTIMA AÇÃO (REAL - JÁ SALVO NO BANCO):
${actionResult ? actionResult : "(Aguardando comando)"}

---
Responda de forma natural, direta e útil. Você é o assistente mais inteligente que existe para clínicas odontológicas!`;
        
        // Construir mensagens com histórico
        const llmMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          { role: "system", content: systemPrompt },
        ];
        
        // Adicionar histórico de conversas (até as últimas 10 mensagens)
        const recentHistory = conversationHistory.slice(-10);
        for (const msg of recentHistory) {
          llmMessages.push({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          });
        }
        
        // Adicionar mensagem atual
        llmMessages.push({ role: "user", content: input.message });
        
        // Chamar a IA do Manus com histórico
        const response = await invokeLLM({
          messages: llmMessages,
        });
        
        let answer = String(response.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua pergunta. Tente novamente.");
        
        // Adicionar resultado da ação à resposta se houver
        if (actionResult && !answer.includes("AÇÃO EXECUTADA")) {
          answer = answer + actionResult;
        }
        
        return {
          answer,
          sources,
        };
      }),
    
    searchPubMed: clinicProcedure
      .input(z.object({
        query: z.string(),
        maxResults: z.number().optional().default(10),
      }))
      .mutation(async ({ input }) => {
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
          
          const articles = searchData.esearchresult.idlist.map((id: string) => {
            const article = summaryData.result?.[id];
            return {
              pmid: id,
              title: article?.title || "",
              authors: article?.authors?.map((a: any) => a.name) || [],
              source: article?.source || "",
              pubdate: article?.pubdate || "",
              url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
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
        const patients = await db.getPatients(undefined, clinicId);
        const appointments = await db.getAppointments(String(clinicId));
        const transactions = await db.getTransactions(String(clinicId));
        const budgets = await db.getBudgets(undefined, clinicId);
        
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Calcular métricas
        const monthRevenue = transactions
          .filter(t => t.type === "income" && new Date(t.date) >= startOfMonth)
          .reduce((sum, t) => sum + Number(t.value), 0);
        
        const approvedBudgets = budgets.filter(b => b.status === "approved").length;
        const pendingBudgets = budgets.filter(b => b.status === "pending").length;
        const totalBudgets = budgets.length;
        
        const conversionRate = totalBudgets > 0 ? (approvedBudgets / totalBudgets) * 100 : 0;
        
        return {
          totalPatients: patients.length,
          monthRevenue,
          conversionRate: conversionRate.toFixed(1),
          pendingBudgets,
          totalAppointments: appointments.length,
        };
      } catch (error) {
        console.error("Erro ao buscar insights:", error);
        return {
          totalPatients: 0,
          monthRevenue: 0,
          conversionRate: "0",
          pendingBudgets: 0,
          totalAppointments: 0,
        };
      }
    }),
    
    // Histórico de conversas
    getHistory: clinicProcedure.query(async ({ ctx }) => {
      const conversations = await db.getIaConversations(ctx.clinicId, ctx.user.id);
      return conversations.map(c => ({
        id: c.id,
        role: c.role,
        content: c.content,
        sources: c.sources ? JSON.parse(c.sources) : [],
        createdAt: c.createdAt,
      }));
    }),
    
    saveMessage: clinicProcedure
      .input(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
        sources: z.array(z.object({
          title: z.string(),
          url: z.string(),
          type: z.enum(["pubmed", "journal", "clinic"]),
        })).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.addIaConversation({
          clinicId: ctx.clinicId,
          userId: ctx.user.id,
          role: input.role,
          content: input.content,
          sources: input.sources ? JSON.stringify(input.sources) : null,
        });
        return { success: true };
      }),
    
    clearHistory: clinicProcedure.mutation(async ({ ctx }) => {
      await db.clearIaConversations(ctx.clinicId, ctx.user.id);
      return { success: true };
    }),

    // Criar procedimento via IA
    createProcedure: clinicProcedure
      .input(z.object({
        name: z.string(),
        value: z.number(),
        category: z.string().optional(),
        description: z.string().optional(),
        duration: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const procedure = await db.createProcedure({
          clinicId: ctx.clinicId,
          name: input.name,
          pricePerTooth: String(input.value),
          description: input.description,
          duration: input.duration || 30,
          isActive: true,
        });
        return { success: true, procedure };
      }),

    // Listar procedimentos via IA
    listProcedures: clinicProcedure.query(async ({ ctx }) => {
      const procedures = await db.getProcedures(undefined, ctx.clinicId);
      return procedures;
    }),

    // Criar agendamento via IA
    createAppointment: clinicProcedure
      .input(z.object({
        patientId: z.number(),
        date: z.string(),
        startTime: z.string(),
        endTime: z.string().optional(),
        type: z.string().optional(),
        dentistId: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const appointment = await db.createAppointment({
          clinicId: ctx.clinicId,
          patientId: input.patientId,
          date: new Date(input.date),
          startTime: input.startTime,
          endTime: input.endTime || input.startTime,
          type: input.type || "Consulta",
          dentistId: input.dentistId,
          status: "scheduled",
          notes: input.notes,
        });
        return { success: true, appointment };
      }),

    // Buscar paciente por nome via IA
    searchPatient: clinicProcedure
      .input(z.object({
        name: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        const patients = await db.getPatients(undefined, ctx.clinicId);
        const filtered = patients.filter(p => 
          p.name?.toLowerCase().includes(input.name.toLowerCase())
        );
        return filtered.slice(0, 10);
      }),

    // Obter dados completos em tempo real
    getRealTimeData: clinicProcedure.query(async ({ ctx }) => {
      const clinicId = ctx.clinicId;
      
      const patients = await db.getPatients(undefined, clinicId);
      const appointments = await db.getAppointments(undefined, undefined, undefined, clinicId);
      const procedures = await db.getProcedures(undefined, clinicId);
      const budgets = await db.getBudgets(undefined, clinicId);
      const transactions = await db.getTransactions(undefined, undefined, undefined, clinicId);
      const queues = await db.getWaitingQueue(undefined, clinicId);
      
      return {
        patients: patients.slice(0, 100),
        appointments: appointments.slice(0, 100),
        procedures,
        budgets: budgets.slice(0, 50),
        transactions: transactions.slice(0, 50),
        queues,
        summary: {
          totalPatients: patients.length,
          totalAppointments: appointments.length,
          totalProcedures: procedures.length,
          totalBudgets: budgets.length,
          patientsInQueue: queues.length,
        },
      };
    }),

    // ==================== FUNCIONALIDADES AVANÇADAS DA IA ====================
    
    // Busca inteligente em linguagem natural
    smartSearch: clinicProcedure
      .input(z.object({
        query: z.string(),
        type: z.enum(["patients", "appointments", "procedures", "budgets", "stock", "all"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const clinicId = ctx.clinicId;
        const query = input.query.toLowerCase();
        const results: any = {};
        
        // Detectar o que buscar baseado na query
        const searchPatients = !input.type || input.type === "all" || input.type === "patients" || 
          query.includes("paciente") || query.includes("cliente") || query.includes("cpf") || query.includes("telefone");
        const searchAppointments = !input.type || input.type === "all" || input.type === "appointments" ||
          query.includes("consulta") || query.includes("agenda") || query.includes("horário");
        const searchProcedures = !input.type || input.type === "all" || input.type === "procedures" ||
          query.includes("procedimento") || query.includes("tratamento") || query.includes("valor");
        const searchBudgets = !input.type || input.type === "all" || input.type === "budgets" ||
          query.includes("orçamento") || query.includes("proposta");
        const searchStock = !input.type || input.type === "all" || input.type === "stock" ||
          query.includes("estoque") || query.includes("material") || query.includes("produto");
        
        // Extrair termos de busca
        const searchTerms = query
          .replace(/buscar|procurar|encontrar|mostrar|listar|quem|qual|quais|onde|paciente|consulta|procedimento|orçamento|estoque|material/gi, "")
          .trim();
        
        if (searchPatients) {
          const patients = await db.getPatients(searchTerms || undefined, clinicId);
          results.patients = patients.slice(0, 20).map(p => ({
            id: p.id,
            name: p.name,
            cpf: p.cpf,
            phone: p.phone,
            email: p.email,
            isActiveToday: p.isActiveToday,
          }));
        }
        
        if (searchAppointments) {
          const appointments = await db.getAppointments(undefined, undefined, undefined, clinicId);
          const filtered = searchTerms ? appointments.filter(a => 
            a.type?.toLowerCase().includes(searchTerms) ||
            a.notes?.toLowerCase().includes(searchTerms)
          ) : appointments;
          results.appointments = filtered.slice(0, 20).map(a => ({
            id: a.id,
            date: a.date,
            startTime: a.startTime,
            type: a.type,
            status: a.status,
            patientId: a.patientId,
          }));
        }
        
        if (searchProcedures) {
          const procedures = await db.getProcedures(searchTerms || undefined, clinicId);
          results.procedures = procedures.slice(0, 20).map(p => ({
            id: p.id,
            name: p.name,
            pricePerTooth: p.pricePerTooth,
            duration: p.duration,
          }));
        }
        
        if (searchBudgets) {
          const budgets = await db.getBudgets(undefined, clinicId);
          const filtered = searchTerms ? budgets.filter(b => 
            b.notes?.toLowerCase().includes(searchTerms)
          ) : budgets;
          results.budgets = filtered.slice(0, 20).map(b => ({
            id: b.id,
            patientId: b.patientId,
            status: b.status,
            totalValue: b.totalValue,
            finalValue: b.finalValue,
          }));
        }
        
        if (searchStock) {
          const stock = await db.getStockItems(searchTerms || undefined, clinicId);
          results.stock = stock.slice(0, 20).map(s => ({
            id: s.id,
            name: s.name,
            quantity: s.quantity,
            minQuantity: s.minQuantity,
            unit: s.unit,
            isLow: (s.quantity ?? 0) <= (s.minQuantity ?? 10),
          }));
        }
        
        return results;
      }),

    // Sugestões proativas - alertas automáticos
    getProactiveAlerts: clinicProcedure.query(async ({ ctx }) => {
      const clinicId = ctx.clinicId;
      const alerts: Array<{ type: string; priority: string; title: string; description: string; action?: string }> = [];
      
      // 1. Estoque baixo
      const stockItems = await db.getStockItems(undefined, clinicId);
      const lowStock = stockItems.filter(s => (s.quantity ?? 0) <= (s.minQuantity ?? 10));
      if (lowStock.length > 0) {
        alerts.push({
          type: "stock",
          priority: "high",
          title: `⚠️ ${lowStock.length} item(ns) com estoque baixo`,
          description: lowStock.map(s => `${s.name}: ${s.quantity} ${s.unit || 'un'}`).join(", "),
          action: "Ir para Estoque",
        });
      }
      
      // 2. Pacientes que precisam retornar
      const returnAlerts = await db.getPendingReturnAlerts(clinicId);
      const urgentReturns = returnAlerts.filter(r => r.daysUntilReturn <= 7);
      if (urgentReturns.length > 0) {
        alerts.push({
          type: "return",
          priority: "medium",
          title: `📅 ${urgentReturns.length} paciente(s) precisam retornar esta semana`,
          description: "Pacientes com retorno agendado nos próximos 7 dias",
          action: "Ver Alertas de Retorno",
        });
      }
      
      // 3. Orçamentos pendentes há mais de 7 dias
      const budgets = await db.getBudgets(undefined, clinicId);
      const oldPending = budgets.filter(b => {
        if (b.status !== "pending") return false;
        const daysSince = Math.floor((Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        return daysSince > 7;
      });
      if (oldPending.length > 0) {
        alerts.push({
          type: "budget",
          priority: "medium",
          title: `💰 ${oldPending.length} orçamento(s) pendente(s) há mais de 7 dias`,
          description: "Considere fazer follow-up com estes pacientes",
          action: "Ver Orçamentos",
        });
      }
      
      // 4. Aniversariantes do dia
      const patients = await db.getPatients(undefined, clinicId);
      const today = new Date();
      const birthdayToday = patients.filter(p => {
        if (!p.birthDate) return false;
        const birth = new Date(p.birthDate);
        return birth.getDate() === today.getDate() && birth.getMonth() === today.getMonth();
      });
      if (birthdayToday.length > 0) {
        alerts.push({
          type: "birthday",
          priority: "low",
          title: `🎂 ${birthdayToday.length} aniversariante(s) hoje!`,
          description: birthdayToday.map(p => p.name).join(", "),
          action: "Enviar Mensagem",
        });
      }
      
      // 5. Consultas de hoje sem confirmação
      const appointments = await db.getAppointments(undefined, undefined, undefined, clinicId);
      const todayAppts = appointments.filter(a => {
        const apptDate = new Date(a.date);
        return apptDate.toDateString() === today.toDateString() && a.status === "scheduled";
      });
      if (todayAppts.length > 0) {
        alerts.push({
          type: "appointment",
          priority: "high",
          title: `📋 ${todayAppts.length} consulta(s) hoje aguardando confirmação`,
          description: "Consultas agendadas para hoje que ainda não foram confirmadas",
          action: "Ver Agenda",
        });
      }
      
      return alerts.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) - 
               (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);
      });
    }),

    // Gerar relatórios sob demanda
    generateReport: clinicProcedure
      .input(z.object({
        type: z.enum(["daily", "weekly", "monthly", "financial", "procedures", "patients"]),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const clinicId = ctx.clinicId;
        const today = new Date();
        
        let startDate = input.startDate ? new Date(input.startDate) : new Date(today);
        let endDate = input.endDate ? new Date(input.endDate) : new Date(today);
        
        // Ajustar datas baseado no tipo
        if (input.type === "daily") {
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
        } else if (input.type === "weekly") {
          startDate.setDate(today.getDate() - 7);
        } else if (input.type === "monthly") {
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        }
        
        // Buscar dados
        const patients = await db.getPatients(undefined, clinicId);
        const appointments = await db.getAppointments(undefined, undefined, undefined, clinicId);
        const transactions = await db.getTransactions(undefined, undefined, undefined, clinicId);
        const budgets = await db.getBudgets(undefined, clinicId);
        const procedures = await db.getProcedures(undefined, clinicId);
        
        // Filtrar por período
        const periodAppointments = appointments.filter(a => {
          const date = new Date(a.date);
          return date >= startDate && date <= endDate;
        });
        
        const periodTransactions = transactions.filter(t => {
          const date = new Date(t.date);
          return date >= startDate && date <= endDate;
        });
        
        const periodBudgets = budgets.filter(b => {
          const date = new Date(b.createdAt);
          return date >= startDate && date <= endDate;
        });
        
        // Calcular métricas
        const income = periodTransactions
          .filter(t => t.type === "income")
          .reduce((sum, t) => sum + Number(t.value), 0);
        
        const expenses = periodTransactions
          .filter(t => t.type === "expense")
          .reduce((sum, t) => sum + Number(t.value), 0);
        
        const approvedBudgets = periodBudgets.filter(b => b.status === "approved" || b.status === "completed");
        const conversionRate = periodBudgets.length > 0 
          ? Math.round((approvedBudgets.length / periodBudgets.length) * 100) 
          : 0;
        
        // Procedimentos mais realizados
        const procedureCount: Record<string, number> = {};
        periodAppointments.forEach(a => {
          if (a.type) {
            procedureCount[a.type] = (procedureCount[a.type] || 0) + 1;
          }
        });
        const topProcedures = Object.entries(procedureCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));
        
        // Novos pacientes no período
        const newPatients = patients.filter(p => {
          const date = new Date(p.createdAt);
          return date >= startDate && date <= endDate;
        });
        
        return {
          period: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0],
            type: input.type,
          },
          summary: {
            totalAppointments: periodAppointments.length,
            completedAppointments: periodAppointments.filter(a => a.status === "completed").length,
            cancelledAppointments: periodAppointments.filter(a => a.status === "cancelled").length,
            newPatients: newPatients.length,
            totalBudgets: periodBudgets.length,
            approvedBudgets: approvedBudgets.length,
            conversionRate,
          },
          financial: {
            income,
            expenses,
            profit: income - expenses,
            avgTicket: periodAppointments.length > 0 ? Math.round(income / periodAppointments.length) : 0,
          },
          topProcedures,
          generatedAt: new Date().toISOString(),
        };
      }),

    // Encontrar próximo horário disponível
    findNextAvailableSlot: clinicProcedure
      .input(z.object({
        dentistId: z.number().optional(),
        duration: z.number().optional().default(30), // minutos
        preferredDate: z.string().optional(),
        preferredTime: z.string().optional(), // "morning", "afternoon", "evening"
      }))
      .mutation(async ({ input, ctx }) => {
        const clinicId = ctx.clinicId;
        const appointments = await db.getAppointments(undefined, undefined, input.dentistId, clinicId);
        const dentists = await db.getDentists(true, clinicId);
        
        const startDate = input.preferredDate ? new Date(input.preferredDate) : new Date();
        const workHours = {
          morning: { start: 8, end: 12 },
          afternoon: { start: 13, end: 18 },
          evening: { start: 18, end: 21 },
        };
        
        const availableSlots: Array<{ date: string; time: string; dentistId?: number; dentistName?: string }> = [];
        
        // Buscar nos próximos 30 dias
        for (let day = 0; day < 30 && availableSlots.length < 10; day++) {
          const checkDate = new Date(startDate);
          checkDate.setDate(checkDate.getDate() + day);
          
          // Pular fins de semana
          if (checkDate.getDay() === 0 || checkDate.getDay() === 6) continue;
          
          const dateStr = checkDate.toISOString().split('T')[0];
          const dayAppointments = appointments.filter(a => 
            new Date(a.date).toISOString().split('T')[0] === dateStr
          );
          
          // Verificar horários disponíveis
          const timeRange = input.preferredTime ? workHours[input.preferredTime as keyof typeof workHours] : { start: 8, end: 21 };
          
          for (let hour = timeRange.start; hour < timeRange.end && availableSlots.length < 10; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
              const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
              
              // Verificar se horário está ocupado
              const isOccupied = dayAppointments.some(a => {
                if (input.dentistId && a.dentistId !== input.dentistId) return false;
                return a.startTime === timeStr;
              });
              
              if (!isOccupied) {
                const slot: any = { date: dateStr, time: timeStr };
                
                // Se não especificou dentista, sugerir um disponível
                if (!input.dentistId && dentists.length > 0) {
                  const availableDentist = dentists.find(d => 
                    !dayAppointments.some(a => a.dentistId === d.id && a.startTime === timeStr)
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
          message: availableSlots.length > 0 
            ? `Encontrei ${availableSlots.length} horário(s) disponível(is)` 
            : "Não encontrei horários disponíveis nos próximos 30 dias",
        };
      }),

    // Agendamento inteligente por linguagem natural
    smartSchedule: clinicProcedure
      .input(z.object({
        request: z.string(), // Ex: "Agendar João para terça às 14h"
      }))
      .mutation(async ({ input, ctx }) => {
        const clinicId = ctx.clinicId;
        const request = input.request.toLowerCase();
        
        // Extrair nome do paciente
        let patientName = "";
        const namePatterns = [
          /(?:agendar|marcar|consulta\s+(?:para|do|da))\s+([a-záàâãéèêíïóôõöúçñ\s]+?)\s+(?:para|no|na|dia|às|as|amanhã|hoje|segunda|terça|quarta|quinta|sexta|sábado)/i,
          /paciente\s+([a-záàâãéèêíïóôõöúçñ\s]+?)\s+(?:para|no|na|dia|às|as)/i,
        ];
        for (const pattern of namePatterns) {
          const match = request.match(pattern);
          if (match) {
            patientName = match[1].trim();
            break;
          }
        }
        
        // Buscar paciente
        let patient = null;
        if (patientName) {
          const patients = await db.getPatients(patientName, clinicId);
          patient = patients[0];
        }
        
        // Extrair data
        let targetDate = new Date();
        if (request.includes("amanhã")) {
          targetDate.setDate(targetDate.getDate() + 1);
        } else if (request.includes("hoje")) {
          // já é hoje
        } else if (request.includes("segunda")) {
          const daysUntil = (1 - targetDate.getDay() + 7) % 7 || 7;
          targetDate.setDate(targetDate.getDate() + daysUntil);
        } else if (request.includes("terça")) {
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
        } else if (request.includes("sábado")) {
          const daysUntil = (6 - targetDate.getDay() + 7) % 7 || 7;
          targetDate.setDate(targetDate.getDate() + daysUntil);
        }
        
        // Extrair horário
        let startTime = "09:00";
        const timeMatch = request.match(/(\d{1,2})(?::|h|\s*horas?)(?:(\d{2}))?/i);
        if (timeMatch) {
          const hour = parseInt(timeMatch[1]);
          const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
          startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        }
        
        // Verificar se horário está disponível
        const appointments = await db.getAppointments(undefined, undefined, undefined, clinicId);
        const dateStr = targetDate.toISOString().split('T')[0];
        const isOccupied = appointments.some(a => 
          new Date(a.date).toISOString().split('T')[0] === dateStr && a.startTime === startTime
        );
        
        if (!patient) {
          return {
            success: false,
            message: `Não encontrei o paciente "${patientName}". Deseja cadastrá-lo primeiro?`,
            suggestion: "cadastrar_paciente",
          };
        }
        
        if (isOccupied) {
          return {
            success: false,
            message: `O horário ${startTime} do dia ${dateStr} já está ocupado. Deseja que eu encontre outro horário?`,
            suggestion: "encontrar_horario",
          };
        }
        
        // Criar agendamento
        try {
          const appointment = await db.createAppointment({
            clinicId,
            patientId: patient.id,
            date: targetDate,
            startTime,
            endTime: startTime, // Será calculado depois
            type: "Consulta",
            status: "scheduled",
          });
          
          return {
            success: true,
            message: `✅ Consulta agendada com sucesso!\n\n📅 Data: ${dateStr}\n⏰ Horário: ${startTime}\n👤 Paciente: ${patient.name}`,
            appointment: {
              id: appointment.id,
              date: dateStr,
              time: startTime,
              patientName: patient.name,
            },
          };
        } catch (error: any) {
          return {
            success: false,
            message: `Erro ao agendar: ${error.message}`,
          };
        }
      }),

    // Análise de dados e estatísticas
    getAnalytics: clinicProcedure
      .input(z.object({
        period: z.enum(["week", "month", "quarter", "year"]).optional().default("month"),
      }))
      .query(async ({ input, ctx }) => {
        const clinicId = ctx.clinicId;
        const today = new Date();
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
        
        const patients = await db.getPatients(undefined, clinicId);
        const appointments = await db.getAppointments(undefined, undefined, undefined, clinicId);
        const transactions = await db.getTransactions(undefined, undefined, undefined, clinicId);
        const budgets = await db.getBudgets(undefined, clinicId);
        
        // Filtrar por período
        const periodAppointments = appointments.filter(a => new Date(a.date) >= startDate);
        const periodTransactions = transactions.filter(t => new Date(t.date) >= startDate);
        const periodBudgets = budgets.filter(b => new Date(b.createdAt) >= startDate);
        const newPatients = patients.filter(p => new Date(p.createdAt) >= startDate);
        
        // Calcular métricas
        const income = periodTransactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.value), 0);
        const expenses = periodTransactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.value), 0);
        
        // Tendência por dia/semana
        const dailyData: Record<string, { appointments: number; income: number }> = {};
        periodAppointments.forEach(a => {
          const day = new Date(a.date).toISOString().split('T')[0];
          if (!dailyData[day]) dailyData[day] = { appointments: 0, income: 0 };
          dailyData[day].appointments++;
        });
        periodTransactions.filter(t => t.type === "income").forEach(t => {
          const day = new Date(t.date).toISOString().split('T')[0];
          if (!dailyData[day]) dailyData[day] = { appointments: 0, income: 0 };
          dailyData[day].income += Number(t.value);
        });
        
        const trend = Object.entries(dailyData)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, data]) => ({ date, ...data }));
        
        // Taxa de ocupação (assumindo 8h de trabalho, 30min por consulta = 16 slots/dia)
        const workDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const totalSlots = workDays * 16;
        const occupancyRate = totalSlots > 0 ? Math.round((periodAppointments.length / totalSlots) * 100) : 0;
        
        // Conversão de orçamentos
        const approvedBudgets = periodBudgets.filter(b => b.status === "approved" || b.status === "completed");
        const conversionRate = periodBudgets.length > 0 ? Math.round((approvedBudgets.length / periodBudgets.length) * 100) : 0;
        
        return {
          period: input.period,
          overview: {
            totalPatients: patients.length,
            newPatients: newPatients.length,
            totalAppointments: periodAppointments.length,
            completedAppointments: periodAppointments.filter(a => a.status === "completed").length,
            cancelledAppointments: periodAppointments.filter(a => a.status === "cancelled").length,
            occupancyRate,
          },
          financial: {
            income,
            expenses,
            profit: income - expenses,
            avgTicket: periodAppointments.length > 0 ? Math.round(income / periodAppointments.length) : 0,
          },
          budgets: {
            total: periodBudgets.length,
            approved: approvedBudgets.length,
            pending: periodBudgets.filter(b => b.status === "pending").length,
            rejected: periodBudgets.filter(b => b.status === "rejected").length,
            conversionRate,
            totalValue: approvedBudgets.reduce((s, b) => s + Number(b.finalValue || b.totalValue || 0), 0),
          },
          trend,
        };
      }),

    // Editar paciente via IA
    editPatient: clinicProcedure
      .input(z.object({
        patientId: z.number(),
        updates: z.object({
          name: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
          cpf: z.string().optional(),
          address: z.string().optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          await db.updatePatient(input.patientId, input.updates, ctx.clinicId);
          const updated = await db.getPatientById(input.patientId, ctx.clinicId);
          return {
            success: true,
            message: "Paciente atualizado com sucesso!",
            patient: updated,
          };
        } catch (error: any) {
          return {
            success: false,
            message: `Erro ao atualizar: ${error.message}`,
          };
        }
      }),

    // Excluir registros via IA
    deleteRecord: clinicProcedure
      .input(z.object({
        type: z.enum(["patient", "procedure", "appointment", "stockItem"]),
        id: z.number(),
        confirm: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!input.confirm) {
          return {
            success: false,
            message: "Por favor, confirme a exclusão definindo confirm: true",
            requiresConfirmation: true,
          };
        }
        
        try {
          switch (input.type) {
            case "patient":
              await db.deletePatient(input.id, ctx.clinicId);
              break;
            case "procedure":
              await db.deleteProcedure(input.id, ctx.clinicId);
              break;
            case "appointment":
              await db.deleteAppointment(input.id, ctx.clinicId);
              break;
            case "stockItem":
              await db.deleteStockItem(input.id, ctx.clinicId);
              break;
          }
          return {
            success: true,
            message: `${input.type} excluído com sucesso!`,
          };
        } catch (error: any) {
          return {
            success: false,
            message: `Erro ao excluir: ${error.message}`,
          };
        }
      }),

    // Enviar mensagem WhatsApp (preparar - requer integração)
    prepareWhatsAppMessage: clinicProcedure
      .input(z.object({
        patientId: z.number(),
        templateType: z.enum(["appointment_reminder", "return_reminder", "birthday", "custom"]),
        customMessage: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const patient = await db.getPatientById(input.patientId, ctx.clinicId);
        if (!patient) {
          return { success: false, message: "Paciente não encontrado" };
        }
        
        if (!patient.phone) {
          return { success: false, message: "Paciente não possui telefone cadastrado" };
        }
        
        let message = "";
        switch (input.templateType) {
          case "appointment_reminder":
            message = `Olá ${patient.name}! 👋\n\nLembramos que você tem uma consulta agendada conosco. Por favor, confirme sua presença respondendo esta mensagem.\n\nAtenciosamente,\nEquipe Dentrics`;
            break;
          case "return_reminder":
            message = `Olá ${patient.name}! 👋\n\nEstamos entrando em contato para lembrar que está na hora de agendar seu retorno. Sua saúde bucal é importante para nós!\n\nEntre em contato para agendar.\n\nAtenciosamente,\nEquipe Dentrics`;
            break;
          case "birthday":
            message = `Olá ${patient.name}! 🎂\n\nA equipe Dentrics deseja a você um Feliz Aniversário! Que este novo ano traga muitas alegrias e sorrisos.\n\nUm grande abraço!`;
            break;
          case "custom":
            message = input.customMessage || "";
            break;
        }
        
        // Formatar número para WhatsApp
        const phone = patient.phone.replace(/\D/g, "");
        const whatsappNumber = phone.startsWith("55") ? phone : `55${phone}`;
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        
        // Registrar tentativa de envio
        await db.createWhatsappNotification({
          clinicId: ctx.clinicId,
          patientId: patient.id,
          phone: patient.phone,
          type: input.templateType === "custom" ? "custom" : input.templateType as any,
          message,
          status: "pending",
        });
        
        return {
          success: true,
          message: "Mensagem preparada! Clique no link para enviar pelo WhatsApp.",
          whatsappUrl,
          phone: patient.phone,
          patientName: patient.name,
          messagePreview: message,
        };
      }),
  }),

  // Smile Design Studio
  smileDesign: router({
    generate: clinicProcedure
      .input(z.object({
        imageBase64: z.string(),
        treatmentType: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Descrições de tratamentos para o prompt de geração
        const treatmentPrompts: Record<string, string> = {
          clareamento: "Smile Design dental transformation: Edit this smile photo to show professional teeth whitening results. Make the teeth 4-6 shades whiter with a natural pearl-white color. Keep the exact same tooth shape, size, and alignment. Maintain realistic gum color and texture. The result should look like a professional in-office whitening treatment. Keep the person's face, lips, and all other features exactly the same.",
          facetas: "Smile Design dental transformation: Edit this smile photo to show porcelain veneer results. Create perfectly aligned, symmetrical teeth with ideal proportions. The teeth should be bright white but natural-looking, with subtle translucency at the edges. Each tooth should have a harmonious shape following the golden ratio. Keep natural gum contours and the person's face unchanged.",
          lentes: "Smile Design dental transformation: Edit this smile photo to show dental contact lens (ultra-thin veneer) results. Create a Hollywood-style perfect smile with brilliant white teeth. Teeth should be perfectly aligned, symmetrical, and have ideal size proportions. The smile should look glamorous but still natural. Maintain realistic lip and gum appearance.",
          implantes: "Smile Design dental transformation: Edit this smile photo to show dental implant results. Fill any missing tooth gaps with natural-looking replacement teeth that match the surrounding teeth in color, size, and shape. The new teeth should blend seamlessly with existing teeth. Maintain natural gum appearance around the implants.",
          ortodontia: "Smile Design dental transformation: Edit this smile photo to show orthodontic treatment results. Straighten all teeth to perfect alignment. Correct any crowding, spacing, or bite issues. Teeth should be evenly spaced with ideal arch form. Keep the natural tooth color and shape, only change the positioning. Maintain natural gum contours.",
          restauracao: "Smile Design dental transformation: Edit this smile photo to show dental restoration results. Repair any visible chips, cracks, or decay with natural-looking restorations. Match the color perfectly with surrounding teeth. Restore natural tooth anatomy and contours. The repairs should be invisible and blend seamlessly.",
          gengiva: "Smile Design dental transformation: Edit this smile photo to show gum contouring results. Create a harmonious, symmetrical gum line. Remove any excess gum tissue (gummy smile correction). The gum line should follow the natural curve of the upper lip. Teeth should appear longer and more proportional. Keep healthy pink gum color.",
          completo: "Smile Design dental transformation: Edit this smile photo to show full mouth rehabilitation results. Create a perfect Hollywood smile with: brilliant white teeth, perfect alignment, ideal proportions, symmetrical appearance, healthy pink gums, and harmonious gum line. The transformation should be dramatic but still look natural and achievable.",
        };

        const treatmentDescriptions: Record<string, string> = {
          clareamento: "dentes mais brancos e brilhantes, mantendo a forma natural",
          facetas: "dentes perfeitamente alinhados com facetas de porcelana, formato harmônico",
          lentes: "sorriso perfeito com lentes de contato dental, dentes brancos e alinhados",
          implantes: "dentes completos e naturais com implantes, sorriso restaurado",
          ortodontia: "dentes perfeitamente alinhados após tratamento ortodôntico",
          restauracao: "dentes restaurados com aparência natural e saudável",
          gengiva: "linha gengival harmônica e esteticamente equilibrada",
          completo: "reabilitação oral completa com sorriso perfeito e natural",
        };

        const prompt = treatmentPrompts[input.treatmentType] || "Edite esta foto de sorriso para mostrar um sorriso melhorado e mais bonito, com dentes mais brancos e alinhados.";
        const description = treatmentDescriptions[input.treatmentType] || "sorriso melhorado e mais bonito";
        
        try {
          // Extrair o base64 puro (remover o prefixo data:image/...;base64,)
          let base64Data = input.imageBase64;
          let mimeType = "image/jpeg";
          
          if (base64Data.startsWith("data:")) {
            const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
              mimeType = matches[1];
              base64Data = matches[2];
            }
          }

          // Gerar imagem editada usando IA
          const fullPrompt = input.notes 
            ? `${prompt} Observações adicionais: ${input.notes}`
            : prompt;

          const result = await generateImage({
            prompt: fullPrompt,
            originalImages: [{
              b64Json: base64Data,
              mimeType: mimeType,
            }],
          });

          // Gerar descrição do resultado
          const llmResponse = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "Você é um assistente de Smile Design odontológico. Descreva brevemente o resultado do tratamento simulado."
              },
              {
                role: "user",
                content: `Descreva em 2-3 frases como ficou o sorriso do paciente após a simulação de ${input.treatmentType}. ${input.notes ? `Observações: ${input.notes}` : ''}`
              }
            ],
          });

          return {
            simulatedImageUrl: result.url || input.imageBase64,
            description: llmResponse.choices[0]?.message?.content || description,
          };
        } catch (error) {
          console.error("Erro ao gerar simulação:", error);
          // Em caso de erro, tentar pelo menos gerar uma descrição
          try {
            const llmResponse = await invokeLLM({
              messages: [
                {
                  role: "system",
                  content: "Você é um assistente de Smile Design. Descreva como seria o resultado do tratamento."
                },
                {
                  role: "user",
                  content: `Descreva em 2-3 frases como ficaria o sorriso do paciente após o tratamento de ${input.treatmentType}.`
                }
              ],
            });
            return {
              simulatedImageUrl: input.imageBase64,
              description: llmResponse.choices[0]?.message?.content || description,
              error: "Não foi possível gerar a simulação visual. Mostrando imagem original.",
            };
          } catch {
            return {
              simulatedImageUrl: input.imageBase64,
              description: description,
              error: "Não foi possível gerar a simulação. Tente novamente.",
            };
          }
        }
      }),

    save: clinicProcedure
      .input(z.object({
        patientId: z.number(),
        originalImageUrl: z.string(),
        simulatedImageUrl: z.string(),
        treatmentType: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.createSmileDesign({
          clinicId: ctx.clinicId,
          patientId: input.patientId,
          originalImageUrl: input.originalImageUrl,
          simulatedImageUrl: input.simulatedImageUrl,
          treatmentType: input.treatmentType,
          notes: input.notes || null,
          createdBy: ctx.user.id,
        });
        return result;
      }),

    list: clinicProcedure.query(async ({ ctx }) => {
      const designs = await db.getSmileDesigns(ctx.clinicId);
      return designs;
    }),

    getByPatient: clinicProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ input, ctx }) => {
        const designs = await db.getSmileDesignsByPatient(ctx.clinicId, input.patientId);
        return designs;
      }),

    // Métricas de conversão do Smile Design
    getMetrics: clinicProcedure
      .input(z.object({ days: z.number().default(30) }))
      .query(async ({ input, ctx }) => {
        const metrics = await db.getSmileDesignMetrics(ctx.clinicId, input.days);
        return metrics;
      }),

    // Marcar como compartilhado via WhatsApp
    markShared: clinicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.markSmileDesignShared(ctx.clinicId, input.id);
        return { success: true };
      }),

    // Marcar como convertido (orçamento fechado)
    markConverted: clinicProcedure
      .input(z.object({ id: z.number(), budgetId: z.number().optional() }))
      .mutation(async ({ input, ctx }) => {
        await db.markSmileDesignConverted(ctx.clinicId, input.id, input.budgetId);
        return { success: true };
      }),
  }),

  // Alertas de Retorno
  returnAlerts: router({
    list: clinicProcedure.query(async ({ ctx }) => {
      const alerts = await db.getReturnAlerts(ctx.clinicId);
      return alerts;
    }),

    getPending: clinicProcedure.query(async ({ ctx }) => {
      const alerts = await db.getPendingReturnAlerts(ctx.clinicId);
      return alerts;
    }),

    create: clinicProcedure
      .input(z.object({
        patientId: z.number(),
        treatmentType: z.string().optional(),
        lastVisitDate: z.string(),
        returnDueDate: z.string(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const lastVisit = new Date(input.lastVisitDate);
        const returnDue = new Date(input.returnDueDate);
        const daysUntil = Math.ceil((returnDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        const result = await db.createReturnAlert({
          clinicId: ctx.clinicId,
          patientId: input.patientId,
          treatmentType: input.treatmentType || null,
          lastVisitDate: lastVisit,
          returnDueDate: returnDue,
          daysUntilReturn: daysUntil,
          priority: input.priority || "medium",
        });
        return result;
      }),

    updateStatus: clinicProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "contacted", "scheduled", "completed", "cancelled"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateReturnAlertStatus(input.id, input.status, input.notes);
        return { success: true };
      }),

    registerContact: clinicProcedure
      .input(z.object({
        id: z.number(),
        notes: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.registerReturnAlertContact(input.id, input.notes);
        return { success: true };
      }),

    // Configurações de período de retorno
    getSettings: clinicProcedure.query(async ({ ctx }) => {
      const settings = await db.getReturnPeriodSettings(ctx.clinicId);
      return settings;
    }),

    saveSettings: clinicProcedure
      .input(z.object({
        treatmentType: z.string(),
        returnPeriodDays: z.number(),
        reminderDaysBefore: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.saveReturnPeriodSetting({
          clinicId: ctx.clinicId,
          treatmentType: input.treatmentType,
          returnPeriodDays: input.returnPeriodDays,
          reminderDaysBefore: input.reminderDaysBefore || 7,
        });
        return { success: true };
      }),

    // Gerar alertas automáticos baseado nas consultas
    generateFromAppointments: clinicProcedure.mutation(async ({ ctx }) => {
      const appointments = await db.getAppointments(String(ctx.clinicId));
      const settings = await db.getReturnPeriodSettings(ctx.clinicId);
      
      let created = 0;
      const today = new Date();

      for (const apt of appointments) {
        if (apt.status !== "completed") continue;

        // Encontrar configuração de retorno para este tipo de tratamento
        const setting = settings.find(s => 
          apt.notes?.toLowerCase().includes(s.treatmentType.toLowerCase())
        );

        if (setting) {
          const aptDate = new Date(apt.date);
          const returnDate = new Date(aptDate);
          returnDate.setDate(returnDate.getDate() + setting.returnPeriodDays);

          // Só criar alerta se a data de retorno já passou ou está próxima
          const daysUntil = Math.ceil((returnDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntil <= (setting.reminderDaysBefore || 7)) {
            // Verificar se já existe alerta para este paciente
            const existingAlerts = await db.getReturnAlerts(ctx.clinicId);
            const exists = existingAlerts.some(a => 
              a.patientId === apt.patientId && 
              a.status === "pending"
            );

            if (!exists && apt.patientId) {
              await db.createReturnAlert({
                clinicId: ctx.clinicId,
                patientId: apt.patientId,
                treatmentType: setting.treatmentType,
                lastVisitDate: aptDate,
                returnDueDate: returnDate,
                daysUntilReturn: daysUntil,
                priority: daysUntil < 0 ? "urgent" : daysUntil <= 3 ? "high" : "medium",
              });
              created++;
            }
          }
        }
      }

      return { created };
    }),

    // Enviar lembrete via WhatsApp
    sendWhatsappReminder: clinicProcedure
      .input(z.object({
        alertId: z.number(),
        patientId: z.number(),
        phoneNumber: z.string(),
        templateName: z.string(),
        messageContent: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Registrar o envio no histórico
        await db.createWhatsappReminderHistory({
          clinicId: ctx.clinicId,
          returnAlertId: input.alertId,
          patientId: input.patientId,
          phoneNumber: input.phoneNumber,
          messageTemplate: input.templateName,
          messageContent: input.messageContent,
          sentBy: ctx.user?.id,
          status: "sent",
        });

        // Atualizar tentativas de contato no alerta
        await db.registerReturnAlertContact(input.alertId, `WhatsApp enviado: ${input.templateName}`);

        return { success: true };
      }),

    // Histórico de lembretes WhatsApp
    getWhatsappHistory: clinicProcedure
      .input(z.object({
        alertId: z.number().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        return db.getWhatsappReminderHistory(ctx.clinicId, input?.alertId);
      }),

    // Estatísticas de envio
    getWhatsappStats: clinicProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        const startDate = input?.startDate ? new Date(input.startDate) : undefined;
        const endDate = input?.endDate ? new Date(input.endDate) : undefined;
        return db.getWhatsappReminderStats(ctx.clinicId, startDate, endDate);
      }),
  }),

  // Templates de Lembrete
  reminderTemplates: router({
    list: clinicProcedure.query(async ({ ctx }) => {
      return db.getReminderTemplates(ctx.clinicId);
    }),

    create: clinicProcedure
      .input(z.object({
        name: z.string(),
        message: z.string(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createReminderTemplate({
          clinicId: ctx.clinicId,
          name: input.name,
          message: input.message,
          isDefault: input.isDefault || false,
        });
      }),

    update: clinicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        message: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateReminderTemplate(id, data);
        return { success: true };
      }),

    delete: clinicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteReminderTemplate(input.id);
        return { success: true };
      }),
  }),

  // ==================== MODELOS 3D ====================
  models3D: router({
    // Listar modelos 3D de um paciente
    getByPatient: clinicProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ input }) => {
        return db.getPatientModels3D(input.patientId);
      }),

    // Obter modelo 3D por ID
    getById: clinicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getPatientModel3DById(input.id);
      }),

    // Salvar modelo 3D no prontuário do paciente
    saveToPatient: clinicProcedure
      .input(z.object({
        patientId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        fileData: z.string(), // Base64 do arquivo
        fileName: z.string(),
        fileType: z.enum(['stl', 'obj', 'gltf', 'glb']),
        fileSize: z.number().optional(),
        category: z.enum(['escaneamento', 'planejamento', 'prótese', 'implante', 'ortodontia', 'outro']).optional(),
        addToLibrary: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Converter base64 para buffer
        const buffer = Buffer.from(input.fileData, 'base64');
        
        // Gerar key única para o S3
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileKey = `models3d/patient-${input.patientId}/${timestamp}-${randomSuffix}-${input.fileName}`;
        
        // Upload para S3
        const { url } = await storagePut(fileKey, buffer, `model/${input.fileType}`);
        
        // Salvar no banco de dados
        const result = await db.createPatientModel3D({
          clinicId: ctx.clinicId,
          patientId: input.patientId,
          name: input.name,
          description: input.description,
          fileUrl: url,
          fileKey: fileKey,
          fileType: input.fileType,
          fileSize: input.fileSize,
          category: input.category || 'escaneamento',
          isInLibrary: input.addToLibrary || false,
          createdBy: ctx.user.id,
        });

        // Se solicitado, adicionar à biblioteca também
        if (input.addToLibrary) {
          await db.createModel3DLibrary({
            clinicId: ctx.clinicId,
            name: input.name,
            description: input.description,
            fileUrl: url,
            fileKey: fileKey,
            fileType: input.fileType,
            fileSize: input.fileSize,
            category: 'escaneamento',
            sourcePatientModelId: result.id,
            createdBy: ctx.user.id,
          });
        }

        return { id: result.id, url };
      }),

    // Atualizar modelo 3D
    update: clinicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        category: z.enum(['escaneamento', 'planejamento', 'prótese', 'implante', 'ortodontia', 'outro']).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updatePatientModel3D(id, data);
        return { success: true };
      }),

    // Excluir modelo 3D
    delete: clinicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePatientModel3D(input.id);
        return { success: true };
      }),

    // Adicionar modelo existente à biblioteca
    addToLibrary: clinicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const model = await db.getPatientModel3DById(input.id);
        if (!model) throw new Error('Modelo não encontrado');

        // Marcar como na biblioteca
        await db.updatePatientModel3D(input.id, { isInLibrary: true });

        // Criar entrada na biblioteca
        await db.createModel3DLibrary({
          clinicId: ctx.clinicId,
          name: model.name,
          description: model.description,
          fileUrl: model.fileUrl,
          fileKey: model.fileKey,
          fileType: model.fileType,
          fileSize: model.fileSize,
          category: 'escaneamento',
          sourcePatientModelId: model.id,
          createdBy: ctx.user.id,
        });

        return { success: true };
      }),

    // Listar biblioteca de modelos 3D
    getLibrary: clinicProcedure
      .query(async ({ ctx }) => {
        return db.getModels3DLibrary(ctx.clinicId);
      }),

    // Excluir modelo da biblioteca
    deleteFromLibrary: clinicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteModel3DLibrary(input.id);
        return { success: true };
      }),
  }),

  // ==================== PROCEDIMENTOS DO TRATAMENTO ====================
  treatmentProcedures: router({
    // Criar procedimentos do tratamento (ao finalizar orçamento)
    create: clinicProcedure
      .input(z.object({
        patientId: z.number(),
        budgetId: z.number().optional(),
        queueEntryId: z.number().optional(),
        procedures: z.array(z.object({
          procedureId: z.number().optional(),
          procedureName: z.string(),
          toothNumber: z.string().optional(),
          faces: z.string().optional(),
          condition: z.string().optional(),
          price: z.number().optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const proceduresToCreate = input.procedures.map(p => ({
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
          status: "pending" as const,
        }));
        return db.createTreatmentProcedures(proceduresToCreate);
      }),

    // Listar procedimentos por entrada na fila
    getByQueueEntry: publicProcedure
      .input(z.object({ queueEntryId: z.number() }))
      .query(async ({ input }) => {
        return db.getTreatmentProceduresByQueueEntry(input.queueEntryId);
      }),

    // Listar procedimentos por paciente
    getByPatient: clinicProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getTreatmentProceduresByPatient(input.patientId, ctx.clinicId);
      }),

    // Listar procedimentos por orçamento
    getByBudget: publicProcedure
      .input(z.object({ budgetId: z.number() }))
      .query(async ({ input }) => {
        return db.getTreatmentProceduresByBudget(input.budgetId);
      }),

    // Listar procedimentos para especialista (sem valores)
    getForSpecialist: publicProcedure
      .input(z.object({ 
        queueEntryId: z.number(),
        patientId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return db.getTreatmentProceduresForSpecialist(input.queueEntryId, input.patientId);
      }),

    // Listar procedimentos pendentes do paciente
    getPending: clinicProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getPendingTreatmentProcedures(input.patientId, ctx.clinicId);
      }),

    // Atualizar status de um procedimento
    updateStatus: publicProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "in_progress", "completed"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const completedBy = ctx.user?.id;
        return db.updateTreatmentProcedureStatus(input.id, input.status, completedBy, input.notes);
      }),

    // Marcar múltiplos procedimentos como concluídos
    markMultipleCompleted: publicProcedure
      .input(z.object({
        ids: z.array(z.number()),
      }))
      .mutation(async ({ input, ctx }) => {
        const completedBy = ctx.user?.id || 0;
        return db.markMultipleProceduresCompleted(input.ids, completedBy);
      }),

    // Vincular procedimentos a uma nova entrada na fila (encaminhamento)
    linkToQueueEntry: publicProcedure
      .input(z.object({
        procedureIds: z.array(z.number()),
        newQueueEntryId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return db.linkProceduresToQueueEntry(input.procedureIds, input.newQueueEntryId);
      }),
  }),

  // ==================== MEDICAL DOCUMENTS (Prontuário) ====================
  medicalDocuments: router({
    // Listar documentos de um paciente
    list: clinicProcedure
      .input(z.object({
        patientId: z.number(),
        type: z.enum(["atestado", "receituario", "termo_consentimento", "contrato"]).optional(),
      }))
      .query(async ({ input, ctx }) => {
        const clinicId = ctx.user.clinicId ?? 1;
        return db.getMedicalDocumentsByPatient(input.patientId, clinicId);
      }),

    // Buscar documento por ID
    getById: clinicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const clinicId = ctx.user.clinicId ?? 1;
        return db.getMedicalDocumentById(input.id, clinicId);
      }),

    // Criar documento (Atestado)
    createAtestado: clinicProcedure
      .input(z.object({
        patientId: z.number(),
        dentistId: z.number(),
        attestationType: z.enum(["dias", "presenca"]),
        attestationDays: z.number().optional(),
        includeCid: z.boolean().optional(),
        cidCode: z.string().optional(),
        documentDate: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const clinicId = ctx.user.clinicId ?? 1;
        
        // Buscar dados da clínica
        const clinic = await db.getClinicById(clinicId);
        
        // Buscar dados do paciente
        const patient = await db.getPatientById(input.patientId);
        
        // Buscar dados do dentista
        const dentist = await db.getDentistById(input.dentistId);
        
        return db.createMedicalDocument({
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
          patientAddress: patient?.address,
        });
      }),

    // Criar documento (Receituário)
    createReceituario: clinicProcedure
      .input(z.object({
        patientId: z.number(),
        dentistId: z.number(),
        prescription: z.string().min(1),
        documentDate: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const clinicId = ctx.user.clinicId ?? 1;
        const clinic = await db.getClinicById(clinicId);
        const patient = await db.getPatientById(input.patientId);
        const dentist = await db.getDentistById(input.dentistId);
        
        return db.createMedicalDocument({
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
          patientAddress: patient?.address,
        });
      }),

    // Criar documento (Termo de Consentimento)
    createTermoConsentimento: clinicProcedure
      .input(z.object({
        patientId: z.number(),
        dentistId: z.number(),
        consentProcedure: z.string().optional(),
        customProcedure: z.string().optional(),
        documentDate: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const clinicId = ctx.user.clinicId ?? 1;
        const clinic = await db.getClinicById(clinicId);
        const patient = await db.getPatientById(input.patientId);
        const dentist = await db.getDentistById(input.dentistId);
        
        return db.createMedicalDocument({
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
          patientAddress: patient?.address,
        });
      }),

    // Criar documento (Contrato)
    createContrato: clinicProcedure
      .input(z.object({
        patientId: z.number(),
        dentistId: z.number(),
        contractProcedures: z.string().min(1),
        contractValue: z.number(),
        paymentMethod: z.string(),
        contractObservations: z.string().optional(),
        documentDate: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const clinicId = ctx.user.clinicId ?? 1;
        const clinic = await db.getClinicById(clinicId);
        const patient = await db.getPatientById(input.patientId);
        const dentist = await db.getDentistById(input.dentistId);
        
        return db.createMedicalDocument({
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
          patientAddress: patient?.address,
        });
      }),

    // Deletar documento
    delete: clinicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const clinicId = ctx.user.clinicId ?? 1;
        return db.deleteMedicalDocument(input.id, clinicId);
      }),

    // Atualizar URL do PDF
    updatePdfUrl: clinicProcedure
      .input(z.object({
        id: z.number(),
        pdfUrl: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const clinicId = ctx.user.clinicId ?? 1;
        return db.updateMedicalDocument(input.id, clinicId, { pdfUrl: input.pdfUrl });
      }),

    // Assinar documento (paciente ou profissional)
    signDocument: clinicProcedure
      .input(z.object({
        id: z.number(),
        signatureType: z.enum(["patient", "professional"]),
        signature: z.string(), // Base64 da assinatura ou texto
      }))
      .mutation(async ({ input, ctx }) => {
        const clinicId = ctx.user.clinicId ?? 1;
        const now = new Date();
        
        if (input.signatureType === "patient") {
          return db.updateMedicalDocument(input.id, clinicId, {
            patientSignature: input.signature,
            patientSignedAt: now,
          });
        } else {
          return db.updateMedicalDocument(input.id, clinicId, {
            professionalSignature: input.signature,
            professionalSignedAt: now,
          });
        }
      }),

    // Gerar link de validação
    generateValidationLink: clinicProcedure
      .input(z.object({
        id: z.number(),
        expirationDays: z.number().nullable(), // null = sem expiração, 7, 30, 90 dias
      }))
      .mutation(async ({ input, ctx }) => {
        const clinicId = ctx.user.clinicId ?? 1;
        
        // Gerar token único
        const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').substring(0, 32);
        
        // Calcular data de expiração
        let expiresAt: Date | null = null;
        if (input.expirationDays) {
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + input.expirationDays);
        }
        
        await db.updateMedicalDocument(input.id, clinicId, {
          validationToken: token,
          validationExpiresAt: expiresAt,
        });
        
        return { token, expiresAt };
      }),

    // Validar documento (rota pública - não requer autenticação)
    validateDocument: publicProcedure
      .input(z.object({
        token: z.string(),
      }))
      .query(async ({ input }) => {
        const document = await db.getMedicalDocumentByToken(input.token);
        
        if (!document) {
          return { valid: false, error: "Documento não encontrado" };
        }
        
        // Verificar expiração
        if (document.validationExpiresAt && new Date() > new Date(document.validationExpiresAt)) {
          return { valid: false, error: "Link de validação expirado" };
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
            paymentMethod: document.paymentMethod,
          },
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
