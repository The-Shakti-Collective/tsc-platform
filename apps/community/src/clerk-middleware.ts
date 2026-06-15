import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

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
  '/projects',
  '/learning-hub',
  '/community/(.*)',
  '/event/(.*)',
  '/api/health',
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});
