import { z } from "zod";
import { clinicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

export const earningsRouter = router({
  // Gerenciar comissões de dentistas
  commissions: router({
    // Listar comissões de um dentista
    list: clinicProcedure
      .input(z.object({
        dentistId: z.number().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        return db.getDentistCommissions(ctx.clinicId, input?.dentistId);
      }),

    // Criar comissão para um dentista
    create: clinicProcedure
      .input(z.object({
        dentistId: z.number(),
        procedureId: z.number(),
        commissionPercentage: z.number().min(0).max(100),
      }))
      .mutation(async ({ input, ctx }) => {
        // Validar que o dentista pertence à clínica
        const dentist = await db.getDentistById(input.dentistId, ctx.clinicId);
        if (!dentist) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Dentista não encontrado' });
        }

        // Validar que o procedimento pertence à clínica
        const procedure = await db.getProcedureById(input.procedureId, ctx.clinicId);
        if (!procedure) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Procedimento não encontrado' });
        }

        return db.createDentistCommission({
          clinicId: ctx.clinicId,
          dentistId: input.dentistId,
          procedureId: input.procedureId,
          commissionPercentage: input.commissionPercentage.toString(),
          isActive: true,
        });
      }),

    // Atualizar comissão
    update: clinicProcedure
      .input(z.object({
        id: z.number(),
        commissionPercentage: z.number().min(0).max(100).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const commission = await db.getDentistCommissionById(input.id);
        if (!commission || commission.clinicId !== ctx.clinicId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }

        const updateData: any = {};
        if (input.commissionPercentage !== undefined) {
          updateData.commissionPercentage = input.commissionPercentage.toString();
        }
        if (input.isActive !== undefined) {
          updateData.isActive = input.isActive;
        }

        await db.updateDentistCommission(input.id, updateData);
        return { success: true };
      }),
  }),

  // Registrar atendimentos realizados
  appointments: router({
    // Registrar conclusão de atendimento
    complete: clinicProcedure
      .input(z.object({
        dentistId: z.number(),
        patientId: z.number(),
        procedureId: z.number(),
        appointmentId: z.number().optional(),
        completedAt: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Validar dentista
        const dentist = await db.getDentistById(input.dentistId, ctx.clinicId);
        if (!dentist) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Dentista não encontrado' });
        }

        // Validar paciente
        const patient = await db.getPatientById(input.patientId, ctx.clinicId);
        if (!patient) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Paciente não encontrado' });
        }

        // Validar procedimento
        const procedure = await db.getProcedureById(input.procedureId, ctx.clinicId);
        if (!procedure) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Procedimento não encontrado' });
        }

        // Buscar comissão do dentista para este procedimento
        const commission = await db.getDentistCommissionByProcedure(
          ctx.clinicId,
          input.dentistId,
          input.procedureId
        );

        if (!commission) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Comissão não configurada para este dentista e procedimento',
          });
        }

        // Calcular valor da comissão
        const procedurePrice = parseFloat(procedure.pricePerTooth?.toString() || '0');
        const commissionPercentage = parseFloat(commission.commissionPercentage.toString());
        const commissionAmount = (procedurePrice * commissionPercentage) / 100;

        // Registrar atendimento
        const result = await db.createCompletedAppointment({
          clinicId: ctx.clinicId,
          appointmentId: input.appointmentId,
          dentistId: input.dentistId,
          patientId: input.patientId,
          procedureId: input.procedureId,
          procedureName: procedure.name,
          procedurePrice: procedurePrice.toString(),
          commissionPercentage: commissionPercentage.toString(),
          commissionAmount: commissionAmount.toString(),
          completedAt: input.completedAt || new Date(),
          paymentStatus: 'pending',
        });

        // Atualizar resumo diário
        const dateStr = (input.completedAt || new Date()).toISOString().split('T')[0];
        await db.createOrUpdateDailyEarningsSummary(ctx.clinicId, input.dentistId, dateStr);

        return result;
      }),

    // Listar atendimentos do dia
    listToday: clinicProcedure
      .query(async ({ ctx }) => {
        const today = new Date().toISOString().split('T')[0];
        return db.getCompletedAppointmentsByClinic(ctx.clinicId, today);
      }),

    // Listar atendimentos de um dentista no dia
    listByDentistToday: clinicProcedure
      .input(z.object({
        dentistId: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        const today = new Date().toISOString().split('T')[0];
        return db.getCompletedAppointmentsByDentist(ctx.clinicId, input.dentistId, today);
      }),
  }),

  // Mapa de Ganho
  map: router({
    // Obter resumo de ganhos do dia
    today: clinicProcedure
      .query(async ({ ctx }) => {
        const today = new Date().toISOString().split('T')[0];
        return db.getDailyEarningsSummaryByClinic(ctx.clinicId, today);
      }),

    // Obter resumo de ganhos de um dentista no dia
    dentistToday: clinicProcedure
      .input(z.object({
        dentistId: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        const today = new Date().toISOString().split('T')[0];
        return db.getDailyEarningsSummary(ctx.clinicId, input.dentistId, today);
      }),

    // Obter resumo de ganhos por data
    byDate: clinicProcedure
      .input(z.object({
        date: z.string(), // formato: YYYY-MM-DD
      }))
      .query(async ({ input, ctx }) => {
        return db.getDailyEarningsSummaryByClinic(ctx.clinicId, input.date);
      }),

    // Finalizar resumo do dia (bloquear edições)
    finalize: clinicProcedure
      .input(z.object({
        summaryId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Validar que o resumo pertence à clínica
        const summary = await db.getDailyEarningsSummary(ctx.clinicId, 0, '');
        if (!summary) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Resumo não encontrado' });
        }

        await db.finalizeDailyEarningsSummary(input.summaryId);
        return { success: true };
      }),

    // Marcar como pago
    markAsPaid: clinicProcedure
      .input(z.object({
        summaryId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.markDailyEarningsSummaryAsPaid(input.summaryId);
        return { success: true };
      }),
  }),

  // Routers para página de configuração de comissões
  getCommissions: clinicProcedure
    .input(z.object({
      clinicId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      return db.getDentistCommissions(input.clinicId);
    }),

  getDentistsForClinic: clinicProcedure
    .input(z.object({}).optional())
    .query(async ({ ctx }) => {
      return db.getDentistsByClinic(ctx.clinicId);
    }),

  updateCommission: clinicProcedure
    .input(z.object({
      id: z.number(),
      commissionPercentage: z.number().min(0).max(100),
    }))
    .mutation(async ({ input, ctx }) => {
      await db.updateDentistCommission(input.id, {
        commissionPercentage: input.commissionPercentage.toString(),
      });
      return { success: true };
    }),

  createCommission: clinicProcedure
    .input(z.object({
      clinicId: z.number(),
      dentistId: z.number(),
      commissionPercentage: z.number().min(0).max(100),
    }))
    .mutation(async ({ input, ctx }) => {
      return db.createDentistCommission({
        clinicId: input.clinicId,
        dentistId: input.dentistId,
        procedureId: 0, // Usar 0 para comissão geral
        commissionPercentage: input.commissionPercentage.toString(),
        isActive: true,
      });
    }),

  deleteCommission: clinicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      await db.deleteDentistCommission(input.id);
      return { success: true };
    }),
});
