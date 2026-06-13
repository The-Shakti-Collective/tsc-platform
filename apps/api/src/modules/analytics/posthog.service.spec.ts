import { describe, expect, it } from 'vitest';

import { PosthogService } from './posthog.service';

describe('PosthogService', () => {
  it('no-ops capture and identify when no token is configured', () => {
    const originalToken = process.env.POSTHOG_PROJECT_TOKEN;
    const originalApiKey = process.env.POSTHOG_API_KEY;

    delete process.env.POSTHOG_PROJECT_TOKEN;
    delete process.env.POSTHOG_API_KEY;

    const service = new PosthogService();

    expect(() => {
      service.capture({ distinctId: 'user-1', event: 'test_event' });
      service.identify({ distinctId: 'user-1', properties: { plan: 'free' } });
    }).not.toThrow();

    process.env.POSTHOG_PROJECT_TOKEN = originalToken;
    process.env.POSTHOG_API_KEY = originalApiKey;
  });
});
