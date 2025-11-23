import alchemy from 'alchemy';
import { KVNamespace, Worker } from 'alchemy/cloudflare';

const app = await alchemy('nn-stack');

// Create a KV namespace
const KV = await KVNamespace('KV', {
  title: 'nn-stack-server-kv',
});

export const server = await Worker('server', {
  entrypoint: 'src/index.ts',
  compatibility: 'node',
  bindings: {
    CORS_ORIGIN: process.env.CORS_ORIGIN || '',
    KV,
  },
  dev: {
    port: 4000,
  },
});

console.log({ url: server.url });

await app.finalize();
