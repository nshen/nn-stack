import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	timeout: 30000,
	retries: 1,
	expect: { timeout: 10000 },
	use: {
		baseURL: 'http://localhost:3000',
		headless: true,
		video: 'retain-on-failure',
		trace: 'retain-on-failure',
	},
	projects: [
		{ name: 'chromium', use: { browserName: 'chromium' } },
	],
	webServer: {
		command: 'pnpm run dev',
		cwd: '../../',
		url: 'http://localhost:3000',
		reuseExistingServer: true,
		timeout: 60000,
	},
});
