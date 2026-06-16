const { isMongoReady } = require('../services/mongoConnectionService');

/** Prefer Neon/Prisma repo when store flag is on or Mongo is unavailable. */
function preferRepository(storeEnabled) {
  return storeEnabled() || !isMongoReady();
}

module.exports = { preferRepository };
