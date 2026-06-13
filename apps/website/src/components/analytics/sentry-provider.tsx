'use client';

import * as Sentry from '@sentry/react';
import { useEffect } from 'react';

let initialized = false;

export function SentryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
    if (!dsn || initialized) return;

    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? 'development',
      tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    });
    initialized = true;
  }, []);

  return <>{children}</>;
}
