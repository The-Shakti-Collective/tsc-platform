const axios = require('axios');
const mongoose = require('mongoose');
const { Resend } = require('resend');
const { config } = require('../config');
const { isRedisAvailable } = require('./backgroundQueue');
const { getSharedRedis } = require('../utils/sharedRedis');
const { isRedisConfigured } = require('../utils/wslRedis');
const { pingSupabase, closeSupabaseClients } = require('./supabase/client');
const { isSupabaseConfigured, isSupabaseEnabled } = require('../config/supabase');
const { getQueueAdminSnapshot } = require('./queueAdminService');

const MONGO_LABELS = ['disconnected', 'connected', 'connecting', 'disconnecting'];

function serviceResult({ id, label, status, state, latencyMs = null, error = null, detail = null }) {
  return {
    id,
    label,
    status,
    state,
    latencyMs,
    error: error || null,
    detail: detail || null,
  };
}

async function withLatency(fn) {
  const start = Date.now();
  try {
    const value = await fn();
    return { value, latencyMs: Date.now() - start, error: null };
  } catch (err) {
    return { value: null, latencyMs: Date.now() - start, error: err.message };
  }
}

function resolveTscApiBase() {
  const raw = (
    process.env.TSC_API_URL ||
    process.env.VITE_TSC_API_URL ||
    (config.isDevelopment ? 'http://localhost:4000/api' : '')
  ).trim().replace(/\/$/, '');
  return raw || null;
}

function redisSkippedResult({ state, detail, error = null, latencyMs = null }) {
  return serviceResult({
    id: 'redis',
    label: 'Redis / BullMQ',
    status: 'skipped',
    state,
    latencyMs,
    detail,
    error: config.isProduction ? error : null,
  });
}

async function probeMongo() {
  const readyState = mongoose.connection.readyState;
  const state = MONGO_LABELS[readyState] || String(readyState);

  if (readyState !== 1) {
    return serviceResult({
      id: 'mongodb',
      label: 'MongoDB',
      status: 'down',
      state,
      error: `Database ${state}`,
    });
  }

  const { latencyMs, error } = await withLatency(() => mongoose.connection.db.admin().ping());
  if (error) {
    return serviceResult({
      id: 'mongodb',
      label: 'MongoDB',
      status: 'down',
      state,
      latencyMs,
      error,
    });
  }

  return serviceResult({
    id: 'mongodb',
    label: 'MongoDB',
    status: 'ok',
    state,
    latencyMs,
  });
}

async function probeCrmApi() {
  return serviceResult({
    id: 'crm-api',
    label: 'CoreKnot CRM API',
    status: 'ok',
    state: 'running',
    detail: `localhost:${config.PORT}`,
  });
}

async function probeTscApi() {
  const base = resolveTscApiBase();
  if (!base) {
    return serviceResult({
      id: 'tsc-api',
      label: 'TSC API',
      status: 'skipped',
      state: 'not_configured',
      detail: 'TSC_API_URL not set',
    });
  }

  const url = `${base}/health/live`;
  const { latencyMs, error } = await withLatency(async () => {
    const { status } = await axios.get(url, { timeout: 3000, validateStatus: () => true });
    if (status < 200 || status >= 300) {
      throw new Error(`HTTP ${status}`);
    }
  });

  if (error) {
    return serviceResult({
      id: 'tsc-api',
      label: 'TSC API',
      status: config.isProduction ? 'degraded' : 'skipped',
      state: 'unreachable',
      latencyMs,
      detail: config.isDevelopment ? 'Optional in local dev — start via start-stack.ps1' : null,
      error: config.isProduction ? error : null,
    });
  }

  return serviceResult({
    id: 'tsc-api',
    label: 'TSC API',
    status: 'ok',
    state: 'connected',
    latencyMs,
    detail: base,
  });
}

async function probeRedis() {
  if (!isRedisConfigured()) {
    return redisSkippedResult({
      state: 'not_configured',
      detail: 'Stub queue mode (REDIS_URL unset)',
    });
  }

  const available = isRedisAvailable();
  const redis = getSharedRedis();

  if (!redis) {
    return redisSkippedResult({
      state: 'not_configured',
      detail: 'Stub queue mode (REDIS_URL unset)',
    });
  }

  const { latencyMs, error } = await withLatency(async () => {
    const pong = await redis.ping();
    if (pong !== 'PONG') throw new Error(`Unexpected PING response: ${pong}`);
  });

  if (error || !available) {
    if (config.isProduction) {
      return serviceResult({
        id: 'redis',
        label: 'Redis / BullMQ',
        status: 'down',
        state: available ? 'error' : 'unavailable',
        latencyMs,
        error: error || 'Redis not connected',
      });
    }

    return redisSkippedResult({
      state: 'memory_fallback',
      latencyMs,
      detail: 'Optional in local dev — queues use in-memory fallback',
      error: error || 'Redis not running locally',
    });
  }

  return serviceResult({
    id: 'redis',
    label: 'Redis / BullMQ',
    status: 'ok',
    state: 'connected',
    latencyMs,
  });
}

async function probeSupabase() {
  if (!isSupabaseConfigured()) {
    return serviceResult({
      id: 'supabase',
      label: 'Supabase',
      status: 'skipped',
      state: 'not_configured',
      detail: 'Secondary store not configured',
    });
  }

  if (!isSupabaseEnabled()) {
    return serviceResult({
      id: 'supabase',
      label: 'Supabase',
      status: 'skipped',
      state: 'disabled',
      detail: 'Configured but disabled',
    });
  }

  const { latencyMs, value: ping, error } = await withLatency(() => pingSupabase());
  await closeSupabaseClients();

  if (error) {
    return serviceResult({
      id: 'supabase',
      label: 'Supabase',
      status: config.isProduction ? 'degraded' : 'skipped',
      state: 'error',
      latencyMs,
      error,
    });
  }

  const checks = ping?.checks || {};
  const restOk = checks.rest?.ok;
  const storageOk = checks.storage?.ok;
  const pgOk = checks.postgres?.ok;
  const allOk = Boolean(ping?.ok && restOk && storageOk && (pgOk !== false));

  return serviceResult({
    id: 'supabase',
    label: 'Supabase',
    status: allOk ? 'ok' : 'degraded',
    state: allOk ? 'connected' : 'partial',
    latencyMs,
    error: allOk ? null : [checks.rest, checks.storage, checks.postgres]
      .filter((c) => c && !c.ok)
      .map((c) => c.message)
      .filter(Boolean)
      .join('; ') || ping?.message || null,
    detail: restOk && storageOk ? 'REST + storage reachable' : null,
  });
}

async function probeResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 'mock_resend_api_key') {
    return serviceResult({
      id: 'resend',
      label: 'Resend Email',
      status: 'skipped',
      state: 'not_configured',
      detail: 'RESEND_API_KEY not set',
    });
  }

  const resend = new Resend(apiKey);
  const { latencyMs, error } = await withLatency(async () => {
    const { error: apiError } = await resend.domains.list();
    if (apiError) throw new Error(apiError.message || 'Resend API error');
  });

  if (error) {
    return serviceResult({
      id: 'resend',
      label: 'Resend Email',
      status: config.isProduction ? 'degraded' : 'skipped',
      state: 'api_error',
      latencyMs,
      error,
    });
  }

  return serviceResult({
    id: 'resend',
    label: 'Resend Email',
    status: 'ok',
    state: 'connected',
    latencyMs,
  });
}

async function probeBullmq() {
  if (!isRedisConfigured() || !isRedisAvailable()) {
    return serviceResult({
      id: 'bullmq',
      label: 'Job Queues',
      status: 'skipped',
      state: 'redis_unavailable',
      detail: 'Requires Redis',
    });
  }

  const { latencyMs, value: snapshot, error } = await withLatency(() => getQueueAdminSnapshot());
  if (error) {
    return serviceResult({
      id: 'bullmq',
      label: 'Job Queues',
      status: 'degraded',
      state: 'error',
      latencyMs,
      error,
    });
  }

  const queues = snapshot?.queues || [];
  const totalFailed = queues.reduce((sum, q) => sum + (q.failed || 0), 0);
  const totalActive = queues.reduce((sum, q) => sum + (q.active || 0), 0);

  return serviceResult({
    id: 'bullmq',
    label: 'Job Queues',
    status: totalFailed > 0 ? 'degraded' : 'ok',
    state: `${queues.length} queues`,
    latencyMs,
    detail: `${totalActive} active, ${totalFailed} failed`,
    error: totalFailed > 0 ? `${totalFailed} failed jobs across queues` : null,
  });
}

function aggregateStatus(services) {
  const counted = (services || []).filter((s) => s && s.status !== 'skipped');
  if (counted.some((s) => s.id === 'mongodb' && s.status === 'down')) return 'down';
  if (counted.some((s) => s.status === 'down')) return 'degraded';
  if (counted.some((s) => s.status === 'degraded')) return 'degraded';
  return 'ok';
}

function filterVisibleServices(services) {
  return (services || []).filter((service) => {
    if (!service) return false;
    if (service.id === 'supabase' && service.status === 'skipped') return false;
    if (service.id === 'bullmq' && service.status === 'skipped') return false;
    return true;
  });
}

async function getAdminSystemHealth() {
  const services = filterVisibleServices(await Promise.all([
    probeMongo(),
    probeCrmApi(),
    probeTscApi(),
    probeRedis(),
    probeResend(),
    probeSupabase(),
    probeBullmq(),
  ]));

  const status = aggregateStatus(services);
  const checkedAt = new Date().toISOString();

  return {
    status,
    ok: status === 'ok',
    checkedAt,
    uptimeSeconds: Math.floor(process.uptime()),
    environment: config.NODE_ENV,
    services,
  };
}

module.exports = {
  getAdminSystemHealth,
  aggregateStatus,
};
