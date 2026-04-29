import { env } from 'cloudflare:workers';
import { applyD1Migrations } from 'cloudflare:test';

declare module 'cloudflare:workers' {
	namespace Cloudflare {
		interface Env {
			TEST_MIGRATIONS: Parameters<typeof applyD1Migrations>[1];
		}
	}
}

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
