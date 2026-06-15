/**
 * Optional uptime heartbeat — pings BETTERSTACK_HEARTBEAT_URL every 60s when set.
 * Ported from apps/api observability scaffold (Nest BetterstackHeartbeatService).
 */
const logger = require('./logger');

const HEARTBEAT_INTERVAL_MS = 60_000;
let timer = null;

function pingHeartbeat(url) {
  fetch(url, { method: 'GET' }).catch((err) => {
    logger.warn('betterstack', 'Heartbeat failed', { error: err.message });
  });
}

function startBetterstackHeartbeat() {
  const url = process.env.BETTERSTACK_HEARTBEAT_URL?.trim();
  if (!url || timer) return;

  pingHeartbeat(url);
  timer = setInterval(() => pingHeartbeat(url), HEARTBEAT_INTERVAL_MS);
  if (typeof timer.unref === 'function') timer.unref();
  logger.info('betterstack', 'Heartbeat enabled');
}

function stopBetterstackHeartbeat() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

module.exports = {
  startBetterstackHeartbeat,
  stopBetterstackHeartbeat,
};
