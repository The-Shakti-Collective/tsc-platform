jest.mock('../utils/sharedRedis', () => ({
  getSharedRedis: jest.fn(),
}));

const { getSharedRedis } = require('../utils/sharedRedis');
const { getCache, setCache } = require('../services/cacheService');

describe('cacheService without Redis', () => {
  beforeEach(() => {
    getSharedRedis.mockReturnValue(null);
  });

  it('getCache returns null when Redis is not configured', async () => {
    await expect(getCache('dashboard:summary:v2:user1')).resolves.toBeNull();
  });

  it('setCache is a no-op when Redis is not configured', async () => {
    await expect(setCache('key', { ok: true }, 60)).resolves.toBeUndefined();
  });
});

describe('cacheService with Redis', () => {
  it('getCache returns null when Redis is not ready', async () => {
    getSharedRedis.mockReturnValue({ status: 'connecting', get: jest.fn() });
    await expect(getCache('key')).resolves.toBeNull();
  });
});
