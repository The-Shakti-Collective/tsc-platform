const { config } = require('../../config');
const { isRedisConfigured } = require('../../utils/wslRedis');

/**
 * Queue infrastructure — BullMQ via ioredis.
 * See jobs/registry.js for worker catalog.
 */
function getRedisUrl() {
  return config.redis.url?.trim() || null;
}

function isRedisConfiguredForQueue() {
  return isRedisConfigured();
}

module.exports = {
  getRedisUrl,
  isRedisConfigured: isRedisConfiguredForQueue,
};
