import type { RouterClient } from '@orpc/server';
import { connection, db, kv } from './health-check';
import { usersApi } from './users';
import { todosApi } from './todos';
import { storageApi } from './storage';

export const appRouter = {
  healthCheck: {
    connection,
    kv,
    db,
  },
  users: usersApi,
  todos: todosApi,
  storage: storageApi,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
