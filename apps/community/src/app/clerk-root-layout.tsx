import { ClerkProvider } from '@clerk/nextjs';
import { DM_Sans, Signika } from 'next/font/google';
import { PosthogProvider } from '@/components/analytics/posthog-provider';
import { SentryProvider } from '@/components/analytics/sentry-provider';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { QueryProvider } from '@/components/providers/query-provider';
import { AuthTokenProvider } from '@/components/providers/auth-token-provider';
import { requireClerkPublishableKey } from '@/lib/clerk-env';
import {
  getClerkAfterSignInUrl,
  getClerkAfterSignUpUrl,
  getClerkSignInUrl,
  getClerkSignUpUrl,
} from '@/lib/clerk-paths';

const signika = Signika({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-display',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
});

export function ClerkRootLayout({ children }: { children: React.ReactNode }) {
  const publishableKey = requireClerkPublishableKey();

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl={getClerkSignInUrl()}
      signUpUrl={getClerkSignUpUrl()}
      signInFallbackRedirectUrl={getClerkAfterSignInUrl()}
      signUpFallbackRedirectUrl={getClerkAfterSignUpUrl()}
    >
      <html lang="en" className={`${signika.variable} ${dmSans.variable}`}>
        <body className="flex min-h-screen flex-col">
          <SentryProvider>
            <PosthogProvider>
              <QueryProvider>
                <AuthTokenProvider>
                  <SiteHeader />
                  <main className="flex-1">{children}</main>
                  <SiteFooter />
                </AuthTokenProvider>
              </QueryProvider>
            </PosthogProvider>
          </SentryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
