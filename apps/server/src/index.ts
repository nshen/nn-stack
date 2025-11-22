import { env } from 'cloudflare:workers';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
// orpc
import { RPCHandler } from '@orpc/server/fetch';
import { onError } from '@orpc/server';
// routes
import { appRouter } from '@nn-stack/api';

const app = new Hono();
app.use(logger());

app.use(
  '/*',
  cors({
    origin: env.CORS_ORIGIN
      ? env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
      : [],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
  }),
);

// orpc
export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error: unknown) => {
      console.error(error);
    }),
  ],
});

app.use('/rpc/*', async (c, next) => {
  const { matched, response } = await rpcHandler.handle(c.req.raw, {
    prefix: '/rpc',
    context: {}, // Provide initial context if needed
  });

  if (matched) {
    return c.newResponse(response.body, response);
  }

  await next();
});

app.get('/', (c) => {
  return c.text('Hello nn stack!');
});

export default app;
