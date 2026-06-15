/**
 * Agent L9 — CoreKnot client smoke (local only, never production).
 *
 * Prerequisites:
 *   - Client: `pnpm dev:coreknot` → http://localhost:3001
 *   - CRM API (optional, for login): `pnpm dev:coreknot:server` → :5000
 *   - E2E user (optional): `node apps/coreknot/server/scripts/seedE2eUsers.js`
 *
 * Skips entire suite when client is not reachable.
 * Authenticated route tests skip when dev login fails (server down / user not seeded).
 */
import { test, expect } from '@playwright/test';
import {
  attachCrashGuard,
  assertNoRuntimeCrash,
  COREKNOT_BASE_URL,
  isCoreKnotReachable,
  tryDevLogin,
  visitWithoutCrash,
} from './helpers';

const PROTECTED_ROUTES = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/projects', label: 'Projects' },
  { path: '/todo', label: 'Tasks' },
  { path: '/artists', label: 'Artists' },
  { path: '/finance', label: 'Finance' },
] as const;

test.describe('CoreKnot client smoke @local', () => {
  let clientUp = false;
  let loggedIn = false;

  test.beforeAll(async () => {
    clientUp = await isCoreKnotReachable(COREKNOT_BASE_URL);
    if (!clientUp) {
      console.warn(
        `[coreknot-smoke] Skipping — client not reachable at ${COREKNOT_BASE_URL}. ` +
          'Start with: pnpm dev:coreknot',
      );
    }
  });

  test.beforeEach(({ page }, testInfo) => {
    test.skip(!clientUp, `CoreKnot client not reachable at ${COREKNOT_BASE_URL}`);
    testInfo.annotations.push({ type: 'environment', description: 'local-only' });
  });

  test('login page loads without runtime crash', async ({ page }) => {
    const guard = attachCrashGuard(page);
    try {
      const response = await page.goto('/login', { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBeLessThan(500);
      await expect(page.getByRole('heading', { name: 'Coreknot' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
      await assertNoRuntimeCrash(page, guard, 'login page');
    } finally {
      guard.detach();
    }
  });

  test('unauthenticated protected route redirects to login without crash', async ({ page }) => {
    const guard = attachCrashGuard(page);
    try {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await page.waitForURL(/\/login/, { timeout: 10_000 });
      await assertNoRuntimeCrash(page, guard, 'dashboard redirect to login');
    } finally {
      guard.detach();
    }
  });

  test.describe('authenticated routes', () => {
    test.beforeAll(async ({ browser }) => {
      if (!clientUp) return;

      const context = await browser.newContext();
      const page = await context.newPage();
      try {
        loggedIn = await tryDevLogin(page);
      } catch {
        loggedIn = false;
      }
      await context.close();

      if (!loggedIn) {
        console.warn(
          '[coreknot-smoke] Dev login failed — authenticated tests will skip. ' +
            'Ensure CRM server on :5000 with DEBUG_BYPASS=true (Dev admin bypass) or seeded E2E user',
        );
      }
    });

    test.beforeEach(async ({ page }) => {
      test.skip(!loggedIn, 'Dev login unavailable (CRM server / DEBUG_BYPASS or E2E user not seeded)');
      const ok = await tryDevLogin(page);
      test.skip(!ok, 'Dev login session could not be established');
    });

    test('dashboard / home loads after dev login', async ({ page }) => {
      await visitWithoutCrash(page, '/dashboard', 'dashboard');
      await expect(page).toHaveURL(/\/dashboard/);
    });

    for (const { path, label } of PROTECTED_ROUTES.filter((r) => r.path !== '/dashboard')) {
      test(`${label} page (${path}) loads without runtime crash`, async ({ page }) => {
        await visitWithoutCrash(page, path, label);
        expect(page.url()).toMatch(new RegExp(path.replace('/', '\\/') + '|/management|/dashboard'));
      });
    }
  });
});
