import type { RouterClient } from '@orpc/server';
import { connection,db,kv } from './health-check';
import { usersApi } from './users';

export const appRouter = {
  healthCheck: {
    connection,
    kv,
    db
  },
  users: usersApi,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
