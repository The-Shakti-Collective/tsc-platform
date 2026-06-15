const {
  isMongoUnavailableError,
  mongoUnavailableMessage,
  MONGO_UNAVAILABLE_CODE,
} = require('../services/mongoConnectionService');

describe('mongoConnectionService', () => {
  it('detects mongoose buffer timeout errors', () => {
    const err = new Error('Operation `users.findOne()` buffering timed out after 10000ms');
    err.name = 'MongooseError';
    expect(isMongoUnavailableError(err)).toBe(true);
  });

  it('detects MongoServerSelectionError', () => {
    const err = new Error('connect ETIMEDOUT');
    err.name = 'MongoServerSelectionError';
    expect(isMongoUnavailableError(err)).toBe(true);
  });

  it('maps Atlas IP whitelist failures to actionable copy', () => {
    const err = new Error('Could not connect to any servers. IP not in whitelist');
    expect(mongoUnavailableMessage(err)).toMatch(/Atlas/i);
  });

  it('exports stable unavailable code for clients', () => {
    expect(MONGO_UNAVAILABLE_CODE).toBe('DATABASE_UNAVAILABLE');
  });
});
