import { NextResponse, NextRequest } from 'next/server';
import type { NextFetchEvent } from 'next/server';
import { isAuthStubEnabled, isPlaceholderClerkKey } from '@/lib/clerk-env';
import { normalizePathname } from '@/lib/request-pathname';

function nextWithPathname(request: NextRequest): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', normalizePathname(request.nextUrl.pathname));
  return NextResponse.next({ request: { headers: requestHeaders } });
}

function shouldUseClerkMiddleware(): boolean {
  if (isAuthStubEnabled()) return false;
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey?.trim() || isPlaceholderClerkKey(publishableKey)) return false;
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey?.trim() || isPlaceholderClerkKey(secretKey)) return false;
  return true;
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!shouldUseClerkMiddleware()) {
    return nextWithPathname(request);
  }

  const { default: clerkMiddleware } = await import('./clerk-middleware');
  return clerkMiddleware(request, event);
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
