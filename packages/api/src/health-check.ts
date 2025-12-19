import { os } from '@orpc/server';
import type { Context } from './context';

export const o = os.$context<Context>();

export const connection = o.handler(({ context }) => {
  console.log('Env: ', context.env);
  return 'OK';
});

export const kv = o.handler(({ context }) => {
  if (!context.env.KV) {
    throw new Error('KV not found');
  }
  return 'OK';
});

export const db = o.handler(({ context }) => {
  if (!context.env.DB) {
    throw new Error('DB not found');
  }
  return 'OK';
});
