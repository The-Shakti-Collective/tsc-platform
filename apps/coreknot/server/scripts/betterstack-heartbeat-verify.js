#!/usr/bin/env node
/** Ping BETTERSTACK_HEARTBEAT_URL once (worker start simulation). */
require('dotenv').config();

const { getBetterstackHeartbeatUrl, pingBetterstackHeartbeat } = require('../utils/betterstackHeartbeat');

(async () => {
  if (!getBetterstackHeartbeatUrl()) {
    console.error('BETTERSTACK_SKIP: BETTERSTACK_HEARTBEAT_URL not set');
    process.exit(1);
  }

  const ok = await pingBetterstackHeartbeat({ source: 'verify-script' });
  console.log(JSON.stringify({ ok, timestamp: new Date().toISOString() }));
  process.exit(ok ? 0 : 1);
})();
