import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import type { Context as HonoContext } from 'hono';

export async function createContext(_c: HonoContext) {
  return {
    env: env,
    DB: drizzle(env.DB),
    // session: null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
