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
async function requireAuthStore(req, res, next) {
  if (isPostgresAuthEnabled()) {
    const ping = await pingPostgres();
    if (ping.ok) return next();
    return apiError(res, 'Auth database temporarily unavailable. Check DATABASE_URL.', 503, {
      code: MONGO_UNAVAILABLE_CODE,
    });
  }
  return requireMongo(req, res, next);
}

module.exports = requireAuthStore;
