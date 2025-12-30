import alchemy from 'alchemy';
import { Exec } from 'alchemy/os';
import {
  KVNamespace,
  Worker,
  D1Database,
  R2Bucket,
  AccountId,
} from 'alchemy/cloudflare';

const accountId = await AccountId();
console.log('Your Cloudflare Account ID is:', accountId);

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
  adopt: true,
});

const hasR2Keys =
  !!process.env.R2_ACCESS_KEY_ID && !!process.env.R2_SECRET_ACCESS_KEY;

const bucketName = `${app.name}-bucket-${app.stage}`;

const BUCKET = await R2Bucket('BUCKET', {
  name: bucketName,
  locationHint: 'apac',
  devDomain: true,
  // To use the r2.dev domain during local development, you must use a deployed R2 bucket:
  dev: {
    remote: true,
  },
  cors: [
    {
      allowed: {
        origins: (process.env.CORS_ORIGIN || 'http://localhost:3000')
          .split(',')
          .map((o) => o.trim()),
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
        headers: ['*'],
      },
    },
  ],
  // do not delete the bucket when the stack is destroyed
  delete: false,
  empty: false,
  adopt: true,
});

if (hasR2Keys) {
  console.log('Your Bucket dev domain: ' + BUCKET.devDomain); // [random-id].r2.dev
}

export const server = await Worker('server', {
  entrypoint: 'src/index.ts',
  compatibility: 'node',
  compatibilityFlags: ['enable_request_signal'],
  bindings: {
    CORS_ORIGIN: process.env.CORS_ORIGIN || '',
    R2_PUBLIC_DOMAIN: BUCKET.devDomain || '',
    KV,
    DB,
    ...(hasR2Keys
      ? {
          BUCKET,
          R2_ACCOUNT_ID: accountId,
          R2_BUCKET_NAME: bucketName,
          R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
          R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
        }
      : {}),
  },
  dev: {
    port: 4000,
  },
});

console.log({ server: server.url });

await app.finalize();
