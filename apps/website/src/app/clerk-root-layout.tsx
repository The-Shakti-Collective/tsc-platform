import { ClerkProvider } from '@clerk/nextjs';
import { PosthogProvider } from '@/components/analytics/posthog-provider';
import { SentryProvider } from '@/components/analytics/sentry-provider';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { requireClerkPublishableKey } from '@/lib/clerk-env';

export function ClerkRootLayout({ children }: { children: React.ReactNode }) {
  const publishableKey = requireClerkPublishableKey();

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en">
        <body className="min-h-screen">
          <SentryProvider>
            <PosthogProvider>
              <SiteHeader />
              <main>{children}</main>
              <SiteFooter />
            </PosthogProvider>
          </SentryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
