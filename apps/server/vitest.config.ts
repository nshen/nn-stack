import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(async () => {
	const migrationsPath = path.resolve(
		__dirname,
		'../../packages/db/migrations',
	);
	const migrations = await readD1Migrations(migrationsPath);

	return {
		plugins: [
			cloudflareTest({
				main: './src/index.ts',
				miniflare: {
					compatibilityDate: '2025-01-01',
					compatibilityFlags: ['nodejs_compat'],
					bindings: {
						CORS_ORIGIN: 'http://localhost:3000',
						TEST_MIGRATIONS: migrations,
					},
					d1Databases: {
						DB: {
							id: 'test-db',
						},
					},
					kvNamespaces: {
						KV: {
							id: 'test-kv',
						},
					},
				},
			}),
		],
		test: {
			setupFiles: ['./tests/setup.ts'],
		},
	};
});
