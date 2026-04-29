import type { RouterClient } from '@orpc/server';
import { connection, db, kv, r2 } from './health-check';
import { planetApi } from './planet';
import { storageApi } from './storage';
import { todosApi } from './todos';
import { usersApi } from './users';

export const appRouter = {
  healthCheck: {
    connection,
    kv,
    db,
    r2,
  },
  users: usersApi,
  todos: todosApi,
  storage: storageApi,
  planet: planetApi,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
