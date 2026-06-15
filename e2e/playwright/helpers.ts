import { expect, type Page } from '@playwright/test';

export const COREKNOT_BASE_URL =
  process.env.PLAYWRIGHT_COREKNOT_URL ?? 'http://localhost:3001';

export const COREKNOT_E2E_EMAIL =
  process.env.COREKNOT_E2E_EMAIL ?? 'e2e-pw-gate@test.coreknot.local';

export const COREKNOT_E2E_PASSWORD =
  process.env.COREKNOT_E2E_PASSWORD ?? 'E2eGateTemp1!';

const ROUTE_ERROR_TEXT = 'Something went wrong';

export type CrashGuard = {
  errors: Error[];
  detach: () => void;
};

/** Collect uncaught page errors for the lifetime of the guard. */
export function attachCrashGuard(page: Page): CrashGuard {
  const errors: Error[] = [];
  const onPageError = (error: Error) => errors.push(error);
  page.on('pageerror', onPageError);
  return {
    errors,
    detach: () => page.off('pageerror', onPageError),
  };
}

export async function isCoreKnotReachable(baseURL: string): Promise<boolean> {
  try {
    const res = await fetch(baseURL, { signal: AbortSignal.timeout(5_000) });
    return res.status < 500;
  } catch {
    return false;
  }
}

export async function assertNoRuntimeCrash(
  page: Page,
  guard: CrashGuard,
  label: string,
): Promise<void> {
  await expect(
    page.getByRole('heading', { name: ROUTE_ERROR_TEXT }),
    `${label}: route error boundary must not render`,
  ).toHaveCount(0);

  await expect(page.locator('#root')).not.toBeEmpty();

  expect(
    guard.errors,
    `${label}: uncaught page errors — ${guard.errors.map((e) => e.message).join('; ')}`,
  ).toHaveLength(0);
}

/** Navigate and wait for SPA settle; assert no runtime crash. */
export async function visitWithoutCrash(
  page: Page,
  path: string,
  label: string,
): Promise<void> {
  const guard = attachCrashGuard(page);
  try {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response?.status() ?? 0, `${label}: HTTP status`).toBeLessThan(500);
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await assertNoRuntimeCrash(page, guard, label);
  } finally {
    guard.detach();
  }
}

/**
 * Dev login via /login form. Requires CoreKnot CRM server (:5000) and seeded E2E user.
 * Returns false when credentials rejected or API unreachable.
 */
async function waitPastLogin(page: Page): Promise<void> {
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), {
    timeout: 15_000,
  });
}

/**
 * Dev login: POST /api/auth/dev-bypass or form credentials (shares cookie jar with page).
 */
export async function tryDevLogin(page: Page): Promise<boolean> {
  const base = process.env.PLAYWRIGHT_COREKNOT_URL ?? COREKNOT_BASE_URL;

  const bypassRes = await page.request.post(`${base}/api/auth/dev-bypass`);
  if (bypassRes.ok()) {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    try {
      await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
      return true;
    } catch {
      // fall through to form login
    }
  }

  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  const bypass = page.getByRole('button', { name: 'Dev admin bypass' });
  if (await bypass.isVisible().catch(() => false)) {
    await bypass.click();
    try {
      await waitPastLogin(page);
      return true;
    } catch {
      // fall through to form login
    }
  }

  await page.getByPlaceholder('Email, Phone, or Name').fill(COREKNOT_E2E_EMAIL);
  await page.locator('input[type="password"]').first().fill(COREKNOT_E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();

  try {
    await waitPastLogin(page);
    return true;
  } catch {
    // dev-admin seed account (postgres auth bootstrap)
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByPlaceholder('Email, Phone, or Name').fill('dev-admin@example.com');
    await page.locator('input[type="password"]').first().fill('Raghav143#');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    try {
      await waitPastLogin(page);
      return true;
    } catch {
      return false;
    }
  }
}
