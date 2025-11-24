import { RouterClient } from '@orpc/server';
import { connection,kv } from './health-check';

export const appRouter = {
  healthCheck: {
    connection,
    kv,
  },
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
