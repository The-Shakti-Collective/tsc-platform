'use client';

import posthog from 'posthog-js';
import { useEffect } from 'react';

let initialized = false;

function isValidPosthogKey(key: string | undefined): boolean {
  if (!key?.trim()) return false;
  if (/REPLACE_ME|placeholder|xxx/i.test(key)) return false;
  return key.startsWith('phc_');
}

export function PosthogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
    if (!isValidPosthogKey(key) || initialized) return;

    posthog.init(key!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
      persistence: 'localStorage+cookie',
    });
    initialized = true;
  }, []);

  return <>{children}</>;
}
