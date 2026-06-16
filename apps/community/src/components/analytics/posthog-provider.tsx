'use client';

import posthog from 'posthog-js';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

let initialized = false;

function isValidPosthogKey(key: string | undefined): boolean {
  if (!key?.trim()) return false;
  if (/REPLACE_ME|placeholder|xxx/i.test(key)) return false;
  return key.startsWith('phc_');
}

function resolvePosthogHost(): string {
  const configured = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim();
  if (!configured) return 'https://us.i.posthog.com';

  try {
    const url = new URL(configured);
    // Ingest host must be *.i.posthog.com — UI host (us.posthog.com) breaks SDK script loads.
    if (!/\.i\.posthog\.com$/i.test(url.hostname)) return 'https://us.i.posthog.com';
    return url.origin;
  } catch {
    return 'https://us.i.posthog.com';
  }
}

function PosthogPageViewInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!initialized || !pathname) return;

    const query = searchParams?.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    posthog.capture('$pageview', { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

export function PosthogProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(initialized);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
    if (!isValidPosthogKey(key) || initialized) {
      if (initialized) setReady(true);
      return;
    }

    posthog.init(key!, {
      api_host: resolvePosthogHost(),
      capture_pageview: false,
      capture_pageleave: true,
      persistence: 'localStorage+cookie',
    });
    initialized = true;
    setReady(true);
  }, []);

  return (
    <>
      {ready ? (
        <Suspense fallback={null}>
          <PosthogPageViewInner />
        </Suspense>
      ) : null}
      {children}
    </>
  );
}

export function isPosthogReady(): boolean {
  return initialized && Boolean((posthog as { __loaded?: boolean }).__loaded);
}
