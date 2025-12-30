import type { RouterClient } from '@orpc/server';
import { connection, db, kv, r2 } from './health-check';
import { usersApi } from './users';
import { todosApi } from './todos';
import { storageApi } from './storage';
import { planetApi } from './planet';

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
