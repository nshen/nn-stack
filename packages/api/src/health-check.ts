import { os } from '@orpc/server';
import type { Context } from './context';

export const o = os.$context<Context>();

export const connection = o.handler(({ context }) => {
  console.log('Env: ', context.env);
  return 'OK';
});

export const kv = o.handler(({ context }) => {
  return context.env.KV || null;
});

export const db = o.handler(({ context }) => {
  return context.env.DB || null;
});
