const COREKNOT_VERCEL_HOST = 'tsc-coreknot.vercel.app';

const isCoreKnotVercelHost = (host) => {
  const normalized = String(host || '').trim().toLowerCase().replace(/:\d+$/, '');
  if (!normalized) return false;
  if (normalized === COREKNOT_VERCEL_HOST) return true;
  return normalized.startsWith('tsc-coreknot-') && normalized.endsWith('.vercel.app');
};

const isCoreKnotVercelOrigin = (origin) => {
  const trimmed = String(origin || '').trim();
  if (!trimmed) return false;
  try {
    return isCoreKnotVercelHost(new URL(trimmed).hostname);
  } catch {
    return false;
  }
};

module.exports = {
  COREKNOT_VERCEL_HOST,
  isCoreKnotVercelHost,
  isCoreKnotVercelOrigin,
};
