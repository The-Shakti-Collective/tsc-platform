import { NextResponse } from 'next/server';
import type { NextFetchEvent, NextRequest } from 'next/server';
import { isAuthStubEnabled } from '@/lib/clerk-env';

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  if (isAuthStubEnabled()) {
    return NextResponse.next();
  }

  const { default: clerkMiddleware } = await import('./clerk-middleware');
  return clerkMiddleware(request, event);
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
