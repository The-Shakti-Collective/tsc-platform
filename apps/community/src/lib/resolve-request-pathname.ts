import { headers } from 'next/headers';
import { normalizePathname } from '@/lib/request-pathname';

/** Server-only pathname for layout chrome (set by middleware). */
export async function resolveRequestPathname(): Promise<string> {
  const headerStore = await headers();
  const fromMiddleware = headerStore.get('x-pathname');
  if (fromMiddleware) return normalizePathname(fromMiddleware);

  const nextUrl = headerStore.get('next-url');
  if (nextUrl) return normalizePathname(nextUrl);

  return '/';
}
