import { ClerkProvider } from '@clerk/nextjs';
import { PosthogProvider } from '@/components/analytics/posthog-provider';
import { SentryProvider } from '@/components/analytics/sentry-provider';
import { SiteHeader } from '@/components/layout/site-header';
import { QueryProvider } from '@/components/providers/query-provider';
import { AuthTokenProvider } from '@/components/providers/auth-token-provider';
import { requireClerkPublishableKey } from '@/lib/clerk-env';

export function ClerkRootLayout({ children }: { children: React.ReactNode }) {
  const publishableKey = requireClerkPublishableKey();

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en">
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
