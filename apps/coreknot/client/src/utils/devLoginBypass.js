/** Dev-only admin bypass on /login — never enabled in production builds. */
export function isDevLoginBypassEnabled() {
  if (import.meta.env.PROD) return false;

  const raw = import.meta.env.VITE_ENABLE_DEV_BYPASS?.trim().toLowerCase();
  if (raw === 'false' || raw === '0' || raw === 'no') return false;
  if (raw === 'true' || raw === '1' || raw === 'yes') return true;

  return import.meta.env.DEV;
}
