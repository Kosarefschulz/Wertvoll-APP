import { createTRPCRouter } from '../trpc';
import { customerRouter } from './customer';
import { dashboardRouter } from './dashboard';
import { copilotRouter } from './copilot';

export const appRouter = createTRPCRouter({
  customer: customerRouter,
  dashboard: dashboardRouter,
  copilot: copilotRouter,
});

export type AppRouter = typeof appRouter;