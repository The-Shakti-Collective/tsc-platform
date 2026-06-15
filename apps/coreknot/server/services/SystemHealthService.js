const mongoose = require('mongoose');
const { config } = require('../config');
const { connectMongo, isMongoReady } = require('./mongoConnectionService');
const { isMongoRequired, pingPostgres, isPostgresConfigured } = require('../infrastructure/postgres/prismaClient');
const { areAllP0StoresOnPostgres } = require('../infrastructure/postgres/migrationProfile');

let systemStatus = 'STARTING';
let failReason = null;
let lastPostgresPing = { ok: false, reason: 'not checked' };
let lastRedisHealth = { ok: false, state: 'unknown' };

async function refreshRedisHealth() {
  const { isRedisConfigured } = require('../utils/wslRedis');
  if (!isRedisConfigured()) {
    lastRedisHealth = { ok: true, state: 'not_configured' };
    return;
  }

  try {
    const { getSharedRedis } = require('../utils/sharedRedis');
    const redis = getSharedRedis();
    if (!redis) {
      lastRedisHealth = { ok: false, state: 'unavailable' };
      return;
    }
    const pong = await redis.ping();
    lastRedisHealth = pong === 'PONG'
      ? { ok: true, state: 'connected' }
      : { ok: false, state: 'error' };
  } catch {
    const { getRedisHealthSnapshot } = require('./backgroundQueue');
    lastRedisHealth = getRedisHealthSnapshot();
  }
}

class SystemHealthService {
  static async checkDependencies() {
    try {
      const mongoRequired = isMongoRequired();
      const postgresRequired = isPostgresConfigured() && (
        !mongoRequired || areAllP0StoresOnPostgres()
      );

      if (postgresRequired) {
        lastPostgresPing = await pingPostgres();
        if (!lastPostgresPing.ok) {
          throw new Error(`Postgres unavailable: ${lastPostgresPing.reason}`);
        }
      }

      if (mongoRequired) {
        // readyState 1 = connected, 2 = connecting
        if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2) {
          throw new Error('Database disconnected or connecting failed (readyState: ' + mongoose.connection.readyState + ')');
        }
      }

      await refreshRedisHealth();

      systemStatus = 'HEALTHY';
      failReason = null;
      return true;
    } catch (err) {
      systemStatus = config.isProduction ? 'FAIL' : 'DEGRADED';
      failReason = err.message;
      if (isMongoRequired() && !isMongoReady() && mongoose.connection.readyState === 0) {
        connectMongo({ reason: 'health-check', maxAttempts: 1 }).catch(() => {});
      }
      return false;
    }
  }

  static getDetailedStatus() {
    const mongoState = mongoose.connection.readyState;
    const mongoLabels = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    let redisHealth = lastRedisHealth;
    if (redisHealth.state === 'unknown') {
      try {
        const { getRedisHealthSnapshot } = require('./backgroundQueue');
        redisHealth = getRedisHealthSnapshot();
      } catch {
        redisHealth = { ok: false, state: 'unavailable' };
      }
    }

    let supabaseStatus = 'disabled';
    try {
      const { isSupabaseEnabled, isSupabaseConfigured } = require('../config/supabase');
      if (!isSupabaseConfigured()) {
        supabaseStatus = 'not_configured';
      } else if (!isSupabaseEnabled()) {
        supabaseStatus = 'disabled';
      } else {
        supabaseStatus = 'enabled';
      }
    } catch {
      supabaseStatus = 'unknown';
    }

    const postgresOk = lastPostgresPing.ok;
    const mongoRequired = isMongoRequired();
    const mongoOk = !mongoRequired || mongoState === 1 || mongoState === 2;

    return {
      status: systemStatus,
      reason: failReason,
      dependencies: {
        postgres: {
          ok: postgresOk,
          state: postgresOk ? 'connected' : (lastPostgresPing.reason || 'disconnected'),
          required: isPostgresConfigured(),
        },
        mongodb: {
          ok: mongoOk,
          state: mongoRequired ? (mongoLabels[mongoState] || String(mongoState)) : 'optional',
          required: mongoRequired,
        },
        redis: {
          ok: redisHealth.ok,
          state: redisHealth.state,
        },
        supabase: {
          ok: supabaseStatus === 'enabled',
          state: supabaseStatus,
        },
      },
      migration: require('../infrastructure/postgres/migrationProfile').getMigrationProfile(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  static getStatus() {
    return { status: systemStatus, reason: failReason };
  }

  static middleware(req, res, next) {
    if (systemStatus === 'FAIL' && config.isProduction) {
      return res.status(503).json({
        success: false,
        message: '503 Service Unavailable: Maintenance Mode',
        reason: failReason
      });
    }
    next();
  }
}

// Periodic checks — skip in Jest (setup.js syncs health after in-memory Mongo connects).
if (process.env.NODE_ENV !== 'test') {
  refreshRedisHealth().catch(() => {});
  SystemHealthService.checkDependencies().catch(() => {});
  setInterval(() => {
    SystemHealthService.checkDependencies().catch(() => {});
  }, 15000);
}

module.exports = SystemHealthService;
