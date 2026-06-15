/**
 * WSL Redis URL resolver.
 * Empty REDIS_URL = stub queue mode (no Redis connection attempts).
 * On Windows, maps localhost REDIS_URL to WSL IP when Docker Redis runs in WSL.
 */
function isRedisConfigured() {
  return Boolean((process.env.REDIS_URL || '').trim());
}

const getRedisUrl = () => {
  const configured = (process.env.REDIS_URL || '').trim();
  if (!configured) return null;

  let redisUrl = configured;

  if (
    process.platform === 'win32' &&
    (configured.includes('127.0.0.1') || configured.includes('localhost'))
  ) {
    try {
      const { execSync } = require('child_process');
      const wslIps = execSync('wsl hostname -I', { stdio: 'pipe' }).toString();
      const firstIp = wslIps.split(' ')[0].trim();
      if (firstIp) {
        redisUrl = `redis://${firstIp}:6379`;
      }
    } catch (err) {
      // Silent fallback to configured URL
    }
  }

  return redisUrl;
};

module.exports = { getRedisUrl, isRedisConfigured };
