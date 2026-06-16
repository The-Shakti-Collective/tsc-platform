/**
 * Optional uptime heartbeat — pings BETTERSTACK_HEARTBEAT_URL when set.
 * API: interval ping every 60s. Worker: ping on start, each successful cycle, and on fatal crash.
 */
const logger = require('./logger');

const HEARTBEAT_INTERVAL_MS = 60_000;
let timer = null;

function getBetterstackHeartbeatUrl() {
  return process.env.BETTERSTACK_HEARTBEAT_URL?.trim() || '';
}

async function pingBetterstackHeartbeat(context = {}) {
  const url = getBetterstackHeartbeatUrl();
  if (!url) return false;

  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      logger.warn('betterstack', 'Heartbeat non-OK response', { status: res.status, ...context });
      return false;
    }
    return true;
  } catch (err) {
    logger.warn('betterstack', 'Heartbeat failed', { error: err.message, ...context });
    return false;
  }
}

function pingBetterstackHeartbeatFireAndForget(context = {}) {
  pingBetterstackHeartbeat(context).catch(() => {});
}

function startBetterstackHeartbeat() {
  const url = getBetterstackHeartbeatUrl();
  if (!url || timer) return;

  pingBetterstackHeartbeatFireAndForget({ source: 'api-interval' });
  timer = setInterval(
    () => pingBetterstackHeartbeatFireAndForget({ source: 'api-interval' }),
    HEARTBEAT_INTERVAL_MS,
  );
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
  getBetterstackHeartbeatUrl,
  pingBetterstackHeartbeat,
  pingBetterstackHeartbeatFireAndForget,
  startBetterstackHeartbeat,
  stopBetterstackHeartbeat,
};
