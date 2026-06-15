const COREKNOT_API_HOST_SUFFIX = 'coreknot.in';

function isForbiddenApiHost(hostname: string, port: string): boolean {
  if (hostname.endsWith(COREKNOT_API_HOST_SUFFIX)) return true;
  if ((hostname === 'localhost' || hostname === '127.0.0.1') && port === '5000') {
    return true;
  }
  return false;
}

/**
 * Validates that a public API URL targets Platform API, not CoreKnot.
 * @see docs/architecture/API-BOUNDARY.md
 */
export function assertPlatformApiUrl(raw: string): string {
  const url = raw.trim().replace(/\/$/, '');
  if (!url) {
    throw new Error('NEXT_PUBLIC_API_URL is required');
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid Platform API URL: ${url}`);
  }

  if (isForbiddenApiHost(parsed.hostname, parsed.port)) {
    throw new Error(
      `Website must not call CoreKnot API (${parsed.host}). Set NEXT_PUBLIC_API_URL to api.theshakticollective.in`,
    );
  }

  return url;
}
