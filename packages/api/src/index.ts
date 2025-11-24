import { Context } from './context';
import { RouterClient, os } from '@orpc/server';
import { connection,kv } from './health-check';

export const o = os.$context<Context>();

export const appRouter = {
  healthCheck: {
    connection,
    kv,
  },
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
