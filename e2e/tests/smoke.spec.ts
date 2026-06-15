import { test, expect } from '@playwright/test';

test.describe('TSC Platform smoke', () => {
  test('community home responds', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(500);
  });

  test('API readiness reachable when API up', async ({ request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:4000';
    let ready;
    try {
      ready = await request.get(`${apiBase}/api/health/ready`, { timeout: 5_000 });
    } catch {
      test.skip(true, 'Platform API not running on :4000');
      return;
    }
    if (ready.ok()) {
      const body = await ready.json();
      expect(body.status).toBeDefined();
      return;
    }
    const feed = await request.get(`${apiBase}/api/feed/health`);
    expect(feed.ok()).toBeTruthy();
  });
});
