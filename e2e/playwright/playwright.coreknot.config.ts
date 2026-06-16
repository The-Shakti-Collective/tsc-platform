import { defineConfig, devices } from '@playwright/test';

/**
 * CoreKnot client smoke — local only (http://localhost:3001).
 * Does not start webServer; run client + CRM server manually before tests.
 */
export default defineConfig({
  testDir: '.',
  testMatch: '**/coreknot-*.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  timeout: 60_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_COREKNOT_URL ?? 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
