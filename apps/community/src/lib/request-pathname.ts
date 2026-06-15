import { getBasePath } from '@/lib/app-urls';

/** Strip Next.js basePath so route helpers match app paths like `/dashboard`. */
export function normalizePathname(pathname: string): string {
  const base = getBasePath();
  const path = pathname || '/';

  if (!base) return path;

  if (path === base || path === `${base}/`) return '/';
  if (path.startsWith(`${base}/`)) {
    const stripped = path.slice(base.length);
    return stripped || '/';
  }

  return path;
}

export function pathnameFromRequestUrl(url: string): string {
  try {
    return normalizePathname(new URL(url).pathname);
  } catch {
    return '/';
  }
}
