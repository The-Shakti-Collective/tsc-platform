import { ClerkProvider } from '@clerk/nextjs';
import { DM_Sans, Signika } from 'next/font/google';
import { PosthogProvider } from '@/components/analytics/posthog-provider';
import { SentryProvider } from '@/components/analytics/sentry-provider';
import { SiteHeader } from '@/components/layout/site-header';
import { QueryProvider } from '@/components/providers/query-provider';
import { AuthTokenProvider } from '@/components/providers/auth-token-provider';
import { requireClerkPublishableKey } from '@/lib/clerk-env';

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
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en" className={`${signika.variable} ${dmSans.variable}`}>
        <body>
          <SentryProvider>
            <PosthogProvider>
              <QueryProvider>
                <AuthTokenProvider>
                  <SiteHeader />
                  <main>{children}</main>
                </AuthTokenProvider>
              </QueryProvider>
            </PosthogProvider>
          </SentryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
