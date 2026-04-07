import { env } from 'cloudflare:workers';
import { applyD1Migrations } from 'cloudflare:test';

declare global {
	namespace Cloudflare {
		interface Env {
			DB: D1Database;
			KV: KVNamespace;
			CORS_ORIGIN: string;
			TEST_MIGRATIONS: unknown[];
		}
	}
}

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS as Parameters<typeof applyD1Migrations>[1]);
