/**
 * Community page audit — all routes on localhost:3000.
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_COMMUNITY_URL ?? 'http://localhost:3000';

const PUBLIC_ROUTES = [
  { path: '/', label: 'Landing' },
  { path: '/about', label: 'About' },
  { path: '/sign-in', label: 'Sign in' },
  { path: '/sign-up', label: 'Sign up' },
  { path: '/onboarding', label: 'Onboarding' },
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/opportunities', label: 'Opportunities' },
  { path: '/feed', label: 'Feed scaffold' },
  { path: '/events', label: 'Events scaffold' },
  { path: '/collaborations', label: 'Collaborations scaffold' },
  { path: '/projects', label: 'Projects scaffold' },
  { path: '/directory', label: 'Directory scaffold' },
  { path: '/learning-hub', label: 'Learning hub scaffold' },
  { path: '/artists', label: 'Artists placeholder' },
  { path: '/communities', label: 'Communities placeholder' },
  { path: '/discover', label: 'Discover placeholder' },
  { path: '/search', label: 'Search' },
  { path: '/api/health', label: 'Health API' },
] as const;

const PROTECTED_ROUTES = [
  { path: '/profile', label: 'Profile' },
  { path: '/settings', label: 'Settings' },
  { path: '/bookmarks', label: 'Bookmarks' },
  { path: '/notifications', label: 'Notifications' },
  { path: '/messages', label: 'Messages' },
] as const;

async function isReachable(): Promise<boolean> {
  try {
    const res = await fetch(BASE_URL, { signal: AbortSignal.timeout(5_000) });
    return res.status < 500;
  } catch {
    return false;
  }
}

test.describe('Community page audit @local', () => {
  let up = false;

  test.beforeAll(async () => {
    up = await isReachable();
  });

  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(!up, `Community not reachable at ${BASE_URL}`);
    testInfo.annotations.push({ type: 'environment', description: 'local-only' });
  });

  for (const { path, label } of PUBLIC_ROUTES) {
    test(`public: ${label} (${path})`, async ({ page }) => {
      const errors: Error[] = [];
      page.on('pageerror', (e) => errors.push(e));
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(response?.status() ?? 0, `${label}: HTTP`).toBeLessThan(500);
      await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
      expect(errors, `${label}: page errors`).toHaveLength(0);
    });
  }

  for (const { path, label } of PROTECTED_ROUTES) {
    test(`protected: ${label} (${path})`, async ({ page }) => {
      const errors: Error[] = [];
      page.on('pageerror', (e) => errors.push(e));
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(response?.status() ?? 0, `${label}: HTTP`).toBeLessThan(500);
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
      // Redirect to sign-in is OK for protected routes without auth
      if (!page.url().includes('/sign-in')) {
        expect(errors, `${label}: page errors`).toHaveLength(0);
      }
    });
  }
});
