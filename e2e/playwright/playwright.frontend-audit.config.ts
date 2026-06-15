import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*pages-audit.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  timeout: 60_000,
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'website',
      testMatch: 'website-pages-audit.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PLAYWRIGHT_WEBSITE_URL ?? 'http://localhost:3002',
      },
    },
    {
      name: 'community',
      testMatch: 'community-pages-audit.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PLAYWRIGHT_COMMUNITY_URL ?? 'http://localhost:3000',
      },
    },
  ],
});
