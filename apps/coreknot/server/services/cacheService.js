const { getSharedRedis } = require('../utils/sharedRedis');

function getReadyRedis() {
  const redis = getSharedRedis();
  if (!redis || redis.status !== 'ready') return null;
  return redis;
}

async function getCache(key) {
  const redis = getReadyRedis();
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

async function setCache(key, value, ttlSeconds = 21600) {
  const redis = getReadyRedis();
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (e) {}
}

module.exports = { getCache, setCache, getReadyRedis };
