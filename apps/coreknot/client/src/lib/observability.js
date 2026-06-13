import * as Sentry from '@sentry/react';
import posthog from 'posthog-js';

let initialized = false;

export function initObservability() {
  if (initialized) return;

  const sentryDsn = import.meta.env.VITE_SENTRY_DSN?.trim();
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: import.meta.env.MODE ?? 'development',
      tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    });
  }

  const posthogKey = import.meta.env.VITE_POSTHOG_KEY?.trim();
  if (posthogKey) {
    posthog.init(posthogKey, {
      api_host: import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
      persistence: 'localStorage+cookie',
    });
  }

  initialized = true;
}
