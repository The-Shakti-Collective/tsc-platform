/**
 * Website page audit — all public routes on localhost:3002.
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_WEBSITE_URL ?? 'http://localhost:3002';

const ROUTES = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About' },
  { path: '/programs', label: 'Programs' },
  { path: '/discover', label: 'Discover' },
  { path: '/blog', label: 'Blog index' },
  { path: '/blog/why-we-built-the-shakti-collective', label: 'Blog post 1' },
  { path: '/blog/community-first-growth', label: 'Blog post 2' },
  { path: '/blog/events-with-signal-not-noise', label: 'Blog post 3' },
  { path: '/contact', label: 'Contact' },
  { path: '/sign-in', label: 'Sign in' },
  { path: '/sign-up', label: 'Sign up' },
  { path: '/api/health', label: 'Health API' },
] as const;

async function isReachable(): Promise<boolean> {
  try {
    const res = await fetch(BASE_URL, { signal: AbortSignal.timeout(5_000) });
    return res.status < 500;
  } catch {
    return false;
  }
}

test.describe('Website page audit @local', () => {
  let up = false;

  test.beforeAll(async () => {
    up = await isReachable();
  });

  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(!up, `Website not reachable at ${BASE_URL}`);
    testInfo.annotations.push({ type: 'environment', description: 'local-only' });
  });

  for (const { path, label } of ROUTES) {
    test(`${label} (${path})`, async ({ page }) => {
      const errors: Error[] = [];
      page.on('pageerror', (e) => errors.push(e));
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(response?.status() ?? 0, `${label}: HTTP`).toBeLessThan(500);
      await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
      expect(errors, `${label}: page errors`).toHaveLength(0);
    });
  }
});
