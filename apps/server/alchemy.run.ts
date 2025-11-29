import alchemy from 'alchemy';
import { Exec } from 'alchemy/os';
import { KVNamespace, Worker, D1Database } from 'alchemy/cloudflare';

const app = await alchemy('nn-stack');

// Create a KV namespace
const KV = await KVNamespace('KV', {
  title: `${app.name}-kv-${app.stage}`,
});

await Exec('db-generate', {
  cwd: '../../packages/db',
  command: 'pnpm run db:generate',
});
// Create D1 database with migrations
const DB = await D1Database('DB', {
  name: `${app.name}-db-${app.stage}`,
  migrationsDir: '../../packages/db/migrations/',
  jurisdiction: 'default',
});

export const server = await Worker('server', {
  entrypoint: 'src/index.ts',
  compatibility: 'node',
  compatibilityFlags: ['enable_request_signal'],
  bindings: {
    CORS_ORIGIN: process.env.CORS_ORIGIN || '',
    KV,
    DB,
  },
  dev: {
    port: 4000,
  },
});

console.log({ url: server.url });

await app.finalize();
