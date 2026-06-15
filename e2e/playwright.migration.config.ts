import { defineConfig } from '@playwright/test';

/** API-only migration smoke — no browser, no frontend webServer. */
export default defineConfig({
  testDir: './migration',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:4000',
  },
});
