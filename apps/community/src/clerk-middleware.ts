import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAppUrl } from '@/lib/app-urls';
import { normalizePathname } from '@/lib/request-pathname';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding',
  '/dashboard',
  '/u/(.*)',
  '/artists',
  '/communities',
  '/events',
  '/collaborations',
  '/opportunities',
  '/search',
  '/about',
  '/directory',
  '/projects(.*)',
  '/learning-hub',
  '/marketplace',
  '/feed',
  '/discover',
  '/messages',
  '/notifications',
  '/bookmarks',
  '/profile',
  '/settings',
  '/reputation',
  '/ai-agents',
  '/creator-crm',
  '/community/(.*)',
  '/event/(.*)',
  '/api/health',
]);

function nextWithPathname(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', normalizePathname(request.nextUrl.pathname));
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export default clerkMiddleware(async (auth, request) => {
  const pathname = normalizePathname(request.nextUrl.pathname);

  if (pathname === '/') {
    const { userId } = await auth();
    if (userId) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return nextWithPathname(request);
  }

  if (isPublicRoute(request)) {
    return nextWithPathname(request);
  }

  const { userId, redirectToSignIn } = await auth();
  if (!userId) {
    const returnBackUrl = `${getAppUrl()}${request.nextUrl.pathname}${request.nextUrl.search}`;
    return redirectToSignIn({ returnBackUrl });
  }

  return nextWithPathname(request);
});
