const mongoose = require('mongoose');
const { config } = require('../config');
const { connectMongo, isMongoReady } = require('./mongoConnectionService');
const { isMongoRequired, pingPostgres, isPostgresConfigured } = require('../infrastructure/postgres/prismaClient');
const { areAllP0StoresOnPostgres } = require('../infrastructure/postgres/migrationProfile');

let systemStatus = 'STARTING';
let failReason = null;
let lastPostgresPing = { ok: false, reason: 'not checked' };

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

      const { redisAvailable } = require('./backgroundQueue');
      if (redisAvailable === false) {
        // Just a warning, not fatal for this system, but could be logged
      }

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
    let redisStatus = 'unknown';
    try {
      const { redisAvailable } = require('./backgroundQueue');
      redisStatus = redisAvailable ? 'connected' : 'unavailable';
    } catch {
      redisStatus = 'unavailable';
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
          ok: redisStatus === 'connected',
          state: redisStatus,
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
  setInterval(SystemHealthService.checkDependencies, 15000);
}

module.exports = SystemHealthService;
