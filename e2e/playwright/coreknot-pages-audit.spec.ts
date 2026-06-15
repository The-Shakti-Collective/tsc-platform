/**
 * CoreKnot full page audit — visits every routed page after dev login.
 * Run: pnpm test:e2e:coreknot:audit (or playwright -c playwright.coreknot.config.ts coreknot-pages-audit)
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

const PUBLIC_ROUTES = [
  { path: '/', label: 'Landing' },
  { path: '/login', label: 'Login' },
  { path: '/register', label: 'Register' },
  { path: '/forgot-password', label: 'Forgot password' },
  { path: '/privacy', label: 'Privacy' },
  { path: '/userdata', label: 'User data deletion' },
] as const;

const AUTHENTICATED_ROUTES = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/projects', label: 'Projects' },
  { path: '/calendar', label: 'Calendar' },
  { path: '/settings', label: 'Settings' },
  { path: '/logs', label: 'Daily logs' },
  { path: '/attendance', label: 'Attendance' },
  { path: '/schedule', label: 'Schedule' },
  { path: '/inbox', label: 'Inbox' },
  { path: '/todo', label: 'Todo' },
  { path: '/notes', label: 'Notes' },
  { path: '/crm', label: 'CRM hub' },
  { path: '/office', label: 'Office hub' },
  { path: '/management', label: 'Management hub' },
  { path: '/admin/console', label: 'Admin console' },
  { path: '/assets', label: 'Assets' },
  { path: '/office-assets', label: 'Office assets' },
  { path: '/features', label: 'Features' },
  { path: '/workflows', label: 'Workflows' },
  { path: '/emails', label: 'Emails overview' },
  { path: '/emails/campaigns', label: 'Email campaigns' },
  { path: '/emails/templates', label: 'Email templates' },
  { path: '/emails/profiles', label: 'Email profiles' },
  { path: '/emails/analytics', label: 'Email analytics' },
  { path: '/artists/portfolio', label: 'Artist portfolio' },
  { path: '/admin/users', label: 'Admin users' },
  { path: '/admin/teams', label: 'Admin teams' },
  { path: '/admin/roles', label: 'Admin roles' },
  { path: '/admin/gamification', label: 'Admin gamification' },
  { path: '/admin/project-analytics', label: 'Admin project analytics' },
  { path: '/admin/artist-path', label: 'Admin artist path' },
  { path: '/admin/control', label: 'Admin control' },
  { path: '/admin/qa', label: 'Admin QA' },
] as const;

test.describe('CoreKnot page audit @local', () => {
  let clientUp = false;
  let loggedIn = false;

  test.beforeAll(async () => {
    clientUp = await isCoreKnotReachable(COREKNOT_BASE_URL);
  });

  test.beforeEach(({ page }, testInfo) => {
    test.skip(!clientUp, `CoreKnot client not reachable at ${COREKNOT_BASE_URL}`);
    testInfo.annotations.push({ type: 'environment', description: 'local-only' });
  });

  for (const { path, label } of PUBLIC_ROUTES) {
    test(`public: ${label} (${path})`, async ({ page }) => {
      await visitWithoutCrash(page, path, label);
    });
  }

  test.describe('authenticated pages', () => {
    test.beforeAll(async ({ browser }) => {
      if (!clientUp) return;
      const context = await browser.newContext();
      const page = await context.newPage();
      loggedIn = await tryDevLogin(page);
      await context.close();
    });

    test.beforeEach(async ({ page }) => {
      test.skip(!loggedIn, 'Dev login unavailable');
      const ok = await tryDevLogin(page);
      test.skip(!ok, 'Dev login session could not be established');
    });

    for (const { path, label } of AUTHENTICATED_ROUTES) {
      test(`auth: ${label} (${path})`, async ({ page }) => {
        const guard = attachCrashGuard(page);
        try {
          const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
          expect(response?.status() ?? 0, `${label}: HTTP status`).toBeLessThan(500);
          await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
          // Allow redirect to login if permissions block — not a crash
          if (page.url().includes('/login')) {
            test.info().annotations.push({
              type: 'permission-redirect',
              description: `${path} redirected to login (page permission)`,
            });
            return;
          }
          await assertNoRuntimeCrash(page, guard, label);
        } finally {
          guard.detach();
        }
      });
    }
  });
});
