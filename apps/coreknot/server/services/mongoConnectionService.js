const {
  resolveMongoUri,
  assertSafeDbTarget,
  getMongooseConnectOptions,
} = require('../config/database');
const { isMongoRequired } = require('../infrastructure/postgres/prismaClient');

const MONGO_UNAVAILABLE_CODE = 'DATABASE_UNAVAILABLE';
const PUBLIC_UNAVAILABLE_MESSAGE =
  'Database temporarily unavailable. Check your connection and try again in a minute. ' +
  'If this persists, your admin may need to allow your IP in MongoDB Atlas.';

let connectPromise = null;
let reconnectTimer = null;
/** @type {typeof import('mongoose') | null} */
let mongooseModule = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getMongoose() {
  if (!mongooseModule) {
    // eslint-disable-next-line global-require
    mongooseModule = require('mongoose');
    mongooseModule.set('bufferCommands', false);
  }
  return mongooseModule;
}

function applyWindowsDnsPreference() {
  if (process.platform !== 'win32') return;
  try {
    require('dns').setDefaultResultOrder('ipv4first');
  } catch {
    /* Node < 17 */
  }
}

function applyMongooseDefaults() {
  if (!isMongoRequired()) return;
  getMongoose();
}

function isMongoReady() {
  if (!isMongoRequired()) return false;
  return getMongoose().connection.readyState === 1;
}

/** Safe to run Mongoose model queries (connected, or mongo still required and buffering). */
function canUseMongoModels() {
  if (!isMongoRequired()) return false;
  return isMongoReady();
}

function isMongoConnecting() {
  if (!isMongoRequired()) return false;
  return getMongoose().connection.readyState === 2;
}

function isMongoUnavailableError(err) {
  if (!err) return false;
  const name = String(err.name || '');
  const message = String(err.message || '');
  if (name === 'MongooseError' && message.includes('bufferCommands = false')) return true;
  if (name === 'MongooseError' && message.includes('buffering timed out')) return true;
  if (name === 'MongoServerSelectionError') return true;
  if (name === 'MongoNetworkError') return true;
  if (name === 'MongoTimeoutError') return true;
  if (message.includes('not connected')) return true;
  if (message.includes('Client must be connected')) return true;
  return false;
}

function mongoUnavailableMessage(err) {
  if (err?.message?.includes('IP whitelist') || err?.message?.includes('whitelist')) {
    return (
      'Database connection blocked. Add your current public IP to the MongoDB Atlas ' +
      'Network Access allowlist, then restart the CRM API.'
    );
  }
  return PUBLIC_UNAVAILABLE_MESSAGE;
}

function registerConnectionEventHandlers() {
  const mongoose = getMongoose();
  if (mongoose.connection.__tscHandlersRegistered) return;
  mongoose.connection.__tscHandlersRegistered = true;

  mongoose.connection.on('error', (err) => {
    console.error('[ERROR] Mongoose connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[WARN] Mongoose disconnected. Scheduling reconnect…');
    scheduleReconnect();
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[SUCCESS] Mongoose reconnected.');
  });
}

function scheduleReconnect(delayMs = 5000) {
  if (!isMongoRequired()) return;
  if (reconnectTimer || process.env.NODE_ENV === 'test') return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (isMongoReady() || isMongoConnecting()) return;
    connectMongo({ reason: 'reconnect' }).catch((err) => {
      console.warn('[WARN] MongoDB reconnect failed:', err.message);
      scheduleReconnect(Math.min(delayMs * 2, 60000));
    });
  }, delayMs);
  reconnectTimer.unref?.();
}

async function connectMongo({ reason = 'startup', maxAttempts = 5 } = {}) {
  if (!isMongoRequired()) {
    return null;
  }

  const mongoose = getMongoose();

  if (process.env.NODE_ENV === 'test') return mongoose.connection;

  if (isMongoReady()) return mongoose.connection;
  if (isMongoConnecting() && connectPromise) return connectPromise;

  const { dbUri, source } = resolveMongoUri();
  assertSafeDbTarget(dbUri, { source });

  registerConnectionEventHandlers();

  connectPromise = (async () => {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        if (isMongoReady()) return mongoose.connection;
        const conn = await mongoose.connect(dbUri, getMongooseConnectOptions());
        console.log(`[SUCCESS] MongoDB connected (${reason}, attempt ${attempt})`);
        return conn;
      } catch (err) {
        lastError = err;
        const waitMs = Math.min(1000 * (2 ** (attempt - 1)), 15000);
        console.error(
          `[ERROR] MongoDB connection failed (${reason}, attempt ${attempt}/${maxAttempts}): ${err.message}`,
        );
        if (attempt < maxAttempts) {
          console.log(`[SYSTEM] Retrying MongoDB in ${waitMs}ms…`);
          await sleep(waitMs);
        }
      }
    }
    console.error(
      '[SYSTEM] MongoDB unavailable — API stays up but auth/DB routes return 503 until connection succeeds.',
    );
    scheduleReconnect(10000);
    throw lastError;
  })();

  try {
    return await connectPromise;
  } finally {
    connectPromise = null;
  }
}

function bootstrapMongoSideEffects() {
  if (!isMongoRequired()) return;

  const { ensurePerformanceIndexes } = require('../scripts/ensureIndexes');
  ensurePerformanceIndexes().catch((err) => {
    console.warn('[INDEX] Performance index sync skipped:', err.message);
  });

  const { ensureDataHubBootstrap } = require('../utils/ensureDataHubBootstrap');
  ensureDataHubBootstrap().catch(() => {});

  const { ensureDevAdminUser } = require('../utils/ensureDevAdminUser');
  ensureDevAdminUser().catch((err) => {
    console.warn('[AUTH] Dev admin bootstrap skipped:', err.message);
  });

  const { loadPlatformSettings } = require('../services/platformSettingsService');
  loadPlatformSettings().catch((err) => {
    console.warn('[PLATFORM] Settings bootstrap skipped:', err.message);
  });

  const { isSupabaseEnabled } = require('../config/supabase');
  const { registerSupabaseMirrors } = require('../services/supabase/registerMirrors');
  if (isSupabaseEnabled()) {
    registerSupabaseMirrors();
  }

  const { printStartupBanner } = require('../app/startupBanner');
  printStartupBanner({});
}

module.exports = {
  MONGO_UNAVAILABLE_CODE,
  PUBLIC_UNAVAILABLE_MESSAGE,
  applyWindowsDnsPreference,
  applyMongooseDefaults,
  isMongoReady,
  canUseMongoModels,
  isMongoConnecting,
  isMongoUnavailableError,
  mongoUnavailableMessage,
  connectMongo,
  bootstrapMongoSideEffects,
  scheduleReconnect,
};
