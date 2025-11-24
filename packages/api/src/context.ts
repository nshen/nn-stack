import type { Context as HonoContext } from 'hono';
import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';

export async function createContext(c: HonoContext) {
  return {
    env: env,
    DB: drizzle(env.DB),
    // session: null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
