import { z } from "zod";
import { clinicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  upsertDentistCommission,
  getClinicCommissions,
  getDentistCommission,
  deleteDentistCommission,
} from "../commissionService";
import * as db from "../db";

export const earningsRouter = router({
  // Comissões
  commissions: router({
    // Listar comissões da clínica
    list: clinicProcedure.query(async ({ ctx }) => {
      try {
        const commissions = await getClinicCommissions(ctx.clinicId);
        return commissions;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

    // Criar ou atualizar comissão
    upsert: clinicProcedure
      .input(
        z.object({
          dentistId: z.number(),
          commissionPercentage: z.number().min(0).max(100),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const result = await upsertDentistCommission(
            ctx.clinicId,
            input.dentistId,
            input.commissionPercentage
          );
          return result;
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }
      }),

    // Deletar comissão
    delete: clinicProcedure
      .input(z.object({ dentistId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        try {
          const result = await deleteDentistCommission(input.dentistId);
          return result;
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }
      }),
  }),

  // Dentistas para comissão
  dentists: router({
    // Listar dentistas da clínica
    list: clinicProcedure.query(async ({ ctx }) => {
      try {
        return await db.getDentistsByClinic(ctx.clinicId);
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),
  }),

  // Mapa de Ganho - Resumo de ganhos
  map: router({
    // Ganhos do dia por data
    byDate: clinicProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ input, ctx }) => {
        try {
          return await db.getDailyEarningsSummaryByDate(ctx.clinicId, input.date);
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }
      }),
  }),

  // Atendimentos realizados
  appointments: router({
    // Listar atendimentos do dia
    listByDate: clinicProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ input, ctx }) => {
        try {
          return await db.getCompletedAppointmentsByDate(ctx.clinicId, input.date);
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }
      }),

    // Listar atendimentos por dentista
    listByDentist: clinicProcedure
      .input(z.object({ dentistId: z.number(), date: z.string() }))
      .query(async ({ input, ctx }) => {
        try {
          return await db.getCompletedAppointmentsByDentistAndDate(
            ctx.clinicId,
            input.dentistId,
            input.date
          );
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }
      }),
  }),
});
