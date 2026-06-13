/** Load Sentry only when configured — avoids hard dependency on @sentry/node-core at boot. */
import { APP_FILTER } from '@nestjs/core';

export function bootstrapSentry(): void {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Sentry = require('@sentry/nestjs') as typeof import('@sentry/nestjs');

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
  });
}

export function getSentryGlobalFilterProvider(): {
  provide: typeof APP_FILTER;
  useClass: new (...args: never[]) => unknown;
} | null {
  if (!process.env.SENTRY_DSN) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { SentryGlobalFilter } = require('@sentry/nestjs/setup') as typeof import('@sentry/nestjs/setup');

  return {
    provide: APP_FILTER,
    useClass: SentryGlobalFilter,
  };
}
