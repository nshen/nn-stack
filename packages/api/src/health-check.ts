import { o } from './index';

export const connection = o.handler(({ context }) => {
  console.log('Env: ', context.env);
  return 'OK';
});

export const kv = o.handler(({ context }) => {
  return context.env.KV || null;
});

