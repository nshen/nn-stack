import { RouterClient } from '@orpc/server';
import { connection,db,kv } from './health-check';

export const appRouter = {
  healthCheck: {
    connection,
    kv,
    db
  },
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
