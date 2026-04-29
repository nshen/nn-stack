import { defineConfig } from '@playwright/test';

// PLAYWRIGHT_BASE_URL is set in CI to the deployed stage URL.
// When unset (local dev), playwright auto-starts the dev server.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const isRemote = !!process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 1,
  expect: { timeout: 10000 },
  use: {
    baseURL,
    headless: true,
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: isRemote
    ? undefined
    : {
        command: 'pnpm run dev',
        cwd: '../../',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 60000,
      },
});
