import type { Context as HonoContext } from 'hono';
import { env } from 'cloudflare:workers';

export async function createContext(c: HonoContext) {
  return {
    env: env,
    // session: null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
