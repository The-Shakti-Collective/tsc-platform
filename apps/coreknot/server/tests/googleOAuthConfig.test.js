const {
  isGoogleOAuthConfigured,
} = require('../utils/googleAuth');

describe('isGoogleOAuthConfigured', () => {
  const originalClientId = process.env.GOOGLE_CLIENT_ID;
  const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  afterEach(() => {
    if (originalClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = originalClientId;
    if (originalClientSecret === undefined) delete process.env.GOOGLE_CLIENT_SECRET;
    else process.env.GOOGLE_CLIENT_SECRET = originalClientSecret;
  });

  it('returns false when client id or secret missing', () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    expect(isGoogleOAuthConfigured()).toBe(false);

    process.env.GOOGLE_CLIENT_ID = 'id-only';
    delete process.env.GOOGLE_CLIENT_SECRET;
    expect(isGoogleOAuthConfigured()).toBe(false);

    delete process.env.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_SECRET = 'secret-only';
    expect(isGoogleOAuthConfigured()).toBe(false);
  });

  it('returns false for whitespace-only values', () => {
    process.env.GOOGLE_CLIENT_ID = '   ';
    process.env.GOOGLE_CLIENT_SECRET = 'secret';
    expect(isGoogleOAuthConfigured()).toBe(false);
  });

  it('returns true when both values are set', () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    expect(isGoogleOAuthConfigured()).toBe(true);
  });
});
