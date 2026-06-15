import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { getAppUrl } from '@/lib/app-urls';

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
  if (isPublicRoute(request)) {
    return;
  }

  const { userId, redirectToSignIn } = await auth();
  if (!userId) {
    const returnBackUrl = `${getAppUrl()}${request.nextUrl.pathname}${request.nextUrl.search}`;
    return redirectToSignIn({ returnBackUrl });
  }
});
