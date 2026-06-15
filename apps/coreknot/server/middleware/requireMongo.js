const mongoose = require('mongoose');
const { apiError } = require('../utils/apiResponse');
const {
  MONGO_UNAVAILABLE_CODE,
  PUBLIC_UNAVAILABLE_MESSAGE,
  isMongoReady,
  isMongoConnecting,
  connectMongo,
} = require('../services/mongoConnectionService');

/**
 * Reject DB-dependent routes when Mongo is not connected (avoids 10s buffer timeouts).
 */
async function requireMongo(req, res, next) {
  if (isMongoReady()) return next();

  if (isMongoConnecting()) {
    const deadline = Date.now() + 3000;
    while (Date.now() < deadline) {
      if (isMongoReady()) return next();
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  if (mongoose.connection.readyState === 0) {
    connectMongo({ reason: 'auth-route', maxAttempts: 1 }).catch(() => {});
  }

  return apiError(res, PUBLIC_UNAVAILABLE_MESSAGE, 503, { code: MONGO_UNAVAILABLE_CODE });
}

module.exports = requireMongo;
