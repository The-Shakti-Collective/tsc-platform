#!/usr/bin/env node
/** Send SENTRY_TEST event directly via SDK (no HTTP server required). */
require('dotenv').config();

const { initSentry } = require('../utils/sentry');

if (!initSentry()) {
  console.error('SENTRY_SKIP: SENTRY_DSN not set');
  process.exit(1);
}

const Sentry = require('@sentry/node');
const eventId = Sentry.captureException(new Error('SENTRY_TEST'));
Sentry.logger.info('User triggered test log', { action: 'test_log' });

Sentry.flush(5000).then(() => {
  console.log('SENTRY_SENT', JSON.stringify({ eventId, timestamp: new Date().toISOString() }));
  process.exit(eventId ? 0 : 1);
});
