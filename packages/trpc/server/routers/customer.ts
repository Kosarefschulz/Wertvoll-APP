import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const customerRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const customers = await ctx.prisma.customer.findMany({
        where: { companyId: input.companyId },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          offers: {
            select: {
              id: true,
              status: true,
            },
          },
          _count: {
            select: {
              offers: true,
              files: true,
            },
          },
        },
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (customers.length > input.limit) {
        const nextItem = customers.pop();
        nextCursor = nextItem!.id;
      }

      return {
        customers,
        nextCursor,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        name: z.string().min(1),
        email: z.string().email(),
        address: z.string().min(1),
        phone: z.string().optional(),
        sqm: z.number().positive().optional(),
        cbm: z.number().positive().optional(),
        type: z.enum(['PRIVATE', 'BUSINESS']).default('PRIVATE'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const customer = await ctx.prisma.customer.create({
        data: input,
      });

      return customer;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        address: z.string().min(1).optional(),
        phone: z.string().optional(),
        sqm: z.number().positive().optional(),
        cbm: z.number().positive().optional(),
        type: z.enum(['PRIVATE', 'BUSINESS']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      
      const customer = await ctx.prisma.customer.update({
        where: { id },
        data,
      });

      return customer;
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const customer = await ctx.prisma.customer.findUnique({
        where: { id: input },
        include: {
          offers: {
            include: {
              jobs: {
                include: {
                  invoice: true,
                },
              },
            },
          },
          files: true,
        },
      });

      if (!customer) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Customer not found',
        });
      }

      return customer;
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.customer.delete({
        where: { id: input },
      });

      return { success: true };
    }),
});