/** Routes that use the logged-in app shell (no marketing header/footer). */
export const MEMBER_APP_PREFIXES = [
  '/dashboard',
  '/directory',
  '/collaborations',
  '/projects',
  '/events',
  '/learning-hub',
  '/opportunities',
  '/marketplace',
  '/feed',
  '/discover',
  '/messages',
  '/notifications',
  '/bookmarks',
  '/profile',
  '/settings',
  '/search',
  '/artists',
  '/reputation',
  '/ai-agents',
  '/creator-crm',
  '/u/',
] as const;

export function isMemberAppRoute(pathname: string): boolean {
  return MEMBER_APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isMarketingRoute(pathname: string): boolean {
  if (pathname === '/' || pathname === '/about') return true;
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) return true;
  if (pathname.startsWith('/onboarding')) return true;
  return false;
}
