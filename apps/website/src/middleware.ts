import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isAuthStubEnabled } from '@/lib/clerk-env';

const authStubEnabled = isAuthStubEnabled();

const isPublicRoute = createRouteMatcher([
  '/',
  '/about(.*)',
  '/blog(.*)',
  '/contact(.*)',
  '/discover(.*)',
  '/programs(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/(.*)',
]);

export default authStubEnabled
  ? function stubMiddleware() {
      return NextResponse.next();
    }
  : clerkMiddleware(async (auth, request) => {
      if (!isPublicRoute(request)) {
        await auth.protect();
      }
    });

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
