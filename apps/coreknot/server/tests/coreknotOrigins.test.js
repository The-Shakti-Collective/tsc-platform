const {
  isCoreKnotVercelHost,
  isCoreKnotVercelOrigin,
} = require('../app/coreknotOrigins');

describe('coreknotOrigins', () => {
  it('matches production CoreKnot Vercel host', () => {
    expect(isCoreKnotVercelHost('tsc-coreknot.vercel.app')).toBe(true);
    expect(isCoreKnotVercelHost('TSC-COREKNOT.vercel.app')).toBe(true);
  });

  it('matches CoreKnot Vercel preview hosts', () => {
    const preview = 'tsc-coreknot-i6kyt0eav-raghavsobti37s-projects.vercel.app';
    expect(isCoreKnotVercelHost(preview)).toBe(true);
    expect(isCoreKnotVercelOrigin(`https://${preview}`)).toBe(true);
  });

  it('rejects unrelated vercel.app hosts', () => {
    expect(isCoreKnotVercelHost('taskmaster-sand.vercel.app')).toBe(false);
    expect(isCoreKnotVercelOrigin('https://other-app.vercel.app')).toBe(false);
  });
});

describe('coreknot CORS in production', () => {
  const savedEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...savedEnv };
    jest.resetModules();
  });

  const loadCorsInProduction = () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'test-jwt-secret-for-cors-unit-tests';
    delete process.env.CORS_ALLOW_VERCEL_PREVIEWS;
    let corsModule;
    jest.isolateModules(() => {
      corsModule = require('../app/cors');
    });
    return corsModule;
  };

  const assertOriginAllowed = (corsOptions, origin) =>
    new Promise((resolve, reject) => {
      corsOptions.origin(origin, (err, allowed) => {
        if (err) reject(err);
        else resolve(allowed);
      });
    });

  it('allows CoreKnot Vercel preview origin without CORS_ALLOW_VERCEL_PREVIEWS', async () => {
    const { corsOptions } = loadCorsInProduction();
    const origin = 'https://tsc-coreknot-i6kyt0eav-raghavsobti37s-projects.vercel.app';
    await expect(assertOriginAllowed(corsOptions, origin)).resolves.toBe(true);
  });

  it('allows tsc-coreknot.vercel.app production host', async () => {
    const { corsOptions } = loadCorsInProduction();
    await expect(assertOriginAllowed(corsOptions, 'https://tsc-coreknot.vercel.app')).resolves.toBe(true);
  });

  it('rejects unrelated vercel.app origin when previews not opted in', async () => {
    const { corsOptions } = loadCorsInProduction();
    await expect(assertOriginAllowed(corsOptions, 'https://random-app.vercel.app')).rejects.toThrow(
      'Not allowed by CORS',
    );
  });
});

describe('coreknot auth cookies on Vercel proxy', () => {
  const savedEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...savedEnv };
  });

  it('uses Lax cookies for CoreKnot Vercel X-Forwarded-Host', () => {
    process.env.NODE_ENV = 'production';
    const { isFirstPartyProxiedRequest, getCookieOptions } = require('../utils/authCookie');
    const previewHost = 'tsc-coreknot-i6kyt0eav-raghavsobti37s-projects.vercel.app';
    const req = { get: (h) => (h === 'x-forwarded-host' ? previewHost : undefined) };
    expect(isFirstPartyProxiedRequest(req)).toBe(true);
    expect(getCookieOptions(req).sameSite).toBe('lax');
    expect(getCookieOptions(req).partitioned).toBeUndefined();
  });

  it('detects CoreKnot Vercel via Origin on api.coreknot.in proxy', () => {
    process.env.NODE_ENV = 'production';
    const { isFirstPartyProxiedRequest } = require('../utils/authCookie');
    const preview = 'https://tsc-coreknot-i6kyt0eav-raghavsobti37s-projects.vercel.app';
    const req = {
      get: (h) => {
        if (h === 'host') return 'api.coreknot.in';
        if (h === 'origin') return preview;
        return undefined;
      },
    };
    expect(isFirstPartyProxiedRequest(req)).toBe(true);
  });
});
