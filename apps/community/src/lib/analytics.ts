'use client';

import posthog from 'posthog-js';
import { isPosthogReady } from '@/components/analytics/posthog-provider';

export function trackCommunityEvent(
  event: string,
  properties?: Record<string, string | number | boolean | null>,
): void {
  if (typeof window === 'undefined' || !isPosthogReady()) return;
  try {
    posthog.capture(event, properties);
  } catch {
    /* analytics optional */
  }
}
