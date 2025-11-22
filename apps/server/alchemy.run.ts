import alchemy from 'alchemy';
import { Worker } from 'alchemy/cloudflare';

const app = await alchemy('nn-stack');

export const server = await Worker('server', {
  entrypoint: 'src/index.ts',
  compatibility: 'node',
  bindings: {
    CORS_ORIGIN: process.env.CORS_ORIGIN || '',
  },
  dev: {
    port: 4000,
  },
});

console.log({ url: server.url });

await app.finalize();
