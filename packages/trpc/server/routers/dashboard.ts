import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

export const dashboardRouter = createTRPCRouter({
  getStats: protectedProcedure
    .input(z.object({
      companyId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      // Get open leads (customers without offers)
      const openLeads = await ctx.prisma.customer.count({
        where: {
          companyId: input.companyId,
          offers: {
            none: {},
          },
        },
      });

      // Get offer statistics
      const offerStats = await ctx.prisma.offer.groupBy({
        by: ['status'],
        where: {
          customer: {
            companyId: input.companyId,
          },
        },
        _count: true,
      });

      // Get overdue invoices
      const overdueInvoices = await ctx.prisma.invoice.findMany({
        where: {
          job: {
            offer: {
              customer: {
                companyId: input.companyId,
              },
            },
          },
          dueDate: {
            lt: now,
          },
          status: {
            in: ['OPEN', 'OVERDUE_1', 'OVERDUE_2', 'OVERDUE_3'],
          },
        },
        include: {
          job: {
            include: {
              offer: {
                include: {
                  customer: true,
                },
              },
            },
          },
        },
      });

      // Get jobs for the current month
      const monthlyJobs = await ctx.prisma.job.findMany({
        where: {
          offer: {
            customer: {
              companyId: input.companyId,
            },
          },
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        include: {
          vehicle: true,
          team: {
            include: {
              members: {
                include: {
                  employee: true,
                },
              },
            },
          },
        },
      });

      return {
        openLeads,
        offerStats: offerStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count;
          return acc;
        }, {} as Record<string, number>),
        overdueInvoices,
        monthlyJobs,
      };
    }),

  getDispoCalendar: protectedProcedure
    .input(z.object({
      companyId: z.string(),
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      const jobs = await ctx.prisma.job.findMany({
        where: {
          offer: {
            customer: {
              companyId: input.companyId,
            },
          },
          date: {
            gte: input.startDate,
            lte: input.endDate,
          },
        },
        include: {
          offer: {
            include: {
              customer: true,
            },
          },
          vehicle: true,
          team: {
            include: {
              members: {
                include: {
                  employee: true,
                },
              },
            },
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      // Group jobs by date for calendar view
      const jobsByDate = jobs.reduce((acc, job) => {
        const dateKey = job.date.toISOString().split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(job);
        return acc;
      }, {} as Record<string, typeof jobs>);

      return jobsByDate;
    }),
});