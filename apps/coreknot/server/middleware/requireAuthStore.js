const { apiError } = require('../utils/apiResponse');
const {
  MONGO_UNAVAILABLE_CODE,
  PUBLIC_UNAVAILABLE_MESSAGE,
} = require('../services/mongoConnectionService');
const { isPostgresAuthEnabled, pingPostgres } = require('../infrastructure/postgres/prismaClient');
const requireMongo = require('./requireMongo');

/**
 * Auth routes need Mongo OR Postgres auth store — not Mongo alone when COREKNOT_AUTH_STORE=postgres.
 */
function authStoreUnavailableMessage(ping) {
  const reason = String(ping?.reason || '');
  if (reason.includes('DATABASE_URL not set')) {
    return 'Auth database unavailable. Set DATABASE_URL in apps/coreknot/server/.env (or repo root .env).';
  }
  if (
    reason.includes('.prisma/client')
    || reason.includes('@prisma/client')
    || reason.includes('Cannot find module')
  ) {
    return 'Auth database unavailable. Run pnpm db:generate, then restart the CoreKnot server.';
  }
  return 'Auth database temporarily unavailable. Check DATABASE_URL and Neon connectivity.';
}

async function requireAuthStore(req, res, next) {
  if (isPostgresAuthEnabled()) {
    const ping = await pingPostgres();
    if (ping.ok) return next();
    return apiError(res, authStoreUnavailableMessage(ping), 503, {
      code: MONGO_UNAVAILABLE_CODE,
    });
  }
  return requireMongo(req, res, next);
}

module.exports = requireAuthStore;
