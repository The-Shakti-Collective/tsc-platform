import { test, expect } from '@playwright/test';

test.describe('TSC Platform smoke', () => {
  test('community home responds', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(500);
  });

  test('API feed health reachable when API up', async ({ request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:4000';
    const res = await request.get(`${apiBase}/api/feed/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBeDefined();
  });
});
