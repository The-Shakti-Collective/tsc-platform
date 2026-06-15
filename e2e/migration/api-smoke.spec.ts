/**
 * Agent L8 — API smoke probes (local only, never production).
 *
 * Prerequisites:
 *   - API running: `pnpm dev:api` or stack on http://localhost:4000
 *   - Stub user seeded: `pnpm seed:dev-user`
 *   - Stub auth enabled (placeholder Clerk keys or TSC_AUTH_STUB=true)
 *
 * Allowed statuses: 200, 401, 403, 404 — never 500.
 */
import { test, expect, type APIRequestContext } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:4000';
const API_PREFIX = '/api';

const STUB_USER_ID = 'user_dev_stub';
const ORG_ID = 'seed_org_dev_stub';

const SAFE_STATUSES = new Set([200, 401, 403, 404]);

function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${API_PREFIX}${normalized}`;
}

function stubHeaders(): Record<string, string> {
  return { 'X-Stub-User-Id': STUB_USER_ID };
}

function expectNever500(status: number, label: string): void {
  expect(status, `${label}: must not return 500`).not.toBe(500);
}

function expectSafeStatus(status: number, label: string): void {
  expectNever500(status, label);
  expect(SAFE_STATUSES.has(status), `${label}: expected one of ${[...SAFE_STATUSES].join(', ')}, got ${status}`).toBeTruthy();
}

async function isApiReachable(request: APIRequestContext): Promise<boolean> {
  try {
    const res = await request.get(apiUrl('/health'), { timeout: 5_000 });
    return res.status() === 200;
  } catch {
    return false;
  }
}

test.describe('API migration smoke @local', () => {
  let apiUp = false;

  test.beforeAll(async ({ request }) => {
    apiUp = await isApiReachable(request);
    if (!apiUp) {
      console.warn(
        `[api-smoke] Skipping — API not reachable at ${API_BASE}. Start with pnpm dev:api`,
      );
    }
  });

  test.beforeEach(({ }, testInfo) => {
    test.skip(!apiUp, `API not reachable at ${API_BASE}`);
  });

  test.describe('health (no auth)', () => {
    test('GET /api/health returns 200', async ({ request }) => {
      const res = await request.get(apiUrl('/health'));
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.status).toBeDefined();
    });

    test('GET /api/health/live returns 200', async ({ request }) => {
      const res = await request.get(apiUrl('/health/live'));
      expect(res.status()).toBe(200);
    });

    test('GET /api/health/ready is not 500', async ({ request }) => {
      const res = await request.get(apiUrl('/health/ready'), { timeout: 15_000 });
      expectNever500(res.status(), 'health/ready');
      expect([200, 503]).toContain(res.status());
    });
  });

  test.describe('auth — unauthenticated protected routes', () => {
    const protectedPaths = [
      '/artists',
      '/projects',
      '/tasks',
      '/crm/leads',
      `/finance/summary?organizationId=${ORG_ID}`,
      '/communities/smoke-probe/members',
    ];

    for (const path of protectedPaths) {
      test(`GET ${path} returns 401 (not 500)`, async ({ request }) => {
        const res = await request.get(apiUrl(path));
        expectNever500(res.status(), path);
        expect(res.status()).toBe(401);
      });
    }
  });

  test.describe('domain probes — stub auth', () => {
    test('GET /api/artists with stub returns 200', async ({ request }) => {
      const res = await request.get(apiUrl('/artists'), { headers: stubHeaders() });
      expectSafeStatus(res.status(), 'artists (stub)');
      expect(res.status()).toBe(200);
    });

    test('GET /api/projects with stub is safe (200/403/404)', async ({ request }) => {
      const res = await request.get(apiUrl('/projects'), { headers: stubHeaders() });
      expectSafeStatus(res.status(), 'projects (stub)');
    });

    test('GET /api/tasks with stub is safe (200/403/404)', async ({ request }) => {
      const res = await request.get(apiUrl('/tasks'), { headers: stubHeaders() });
      expectSafeStatus(res.status(), 'tasks (stub)');
    });

    test('GET /api/crm/leads with stub + organizationId is safe', async ({ request }) => {
      const res = await request.get(apiUrl(`/crm/leads?organizationId=${ORG_ID}`), {
        headers: stubHeaders(),
      });
      expectSafeStatus(res.status(), 'crm/leads (stub)');
    });

    test('GET /api/finance/summary with stub + organizationId is safe', async ({ request }) => {
      const res = await request.get(
        apiUrl(`/finance/summary?organizationId=${ORG_ID}`),
        { headers: stubHeaders() },
      );
      expectSafeStatus(res.status(), 'finance/summary (stub)');
    });

    test('GET /api/communities/:id/members with stub is safe (404 ok)', async ({ request }) => {
      const res = await request.get(apiUrl('/communities/smoke-probe-id/members'), {
        headers: stubHeaders(),
      });
      expectSafeStatus(res.status(), 'communities/members (stub)');
    });
  });
});
