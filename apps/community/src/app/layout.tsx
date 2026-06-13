import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { PosthogProvider } from '@/components/analytics/posthog-provider';
import { SentryProvider } from '@/components/analytics/sentry-provider';
import { SiteHeader } from '@/components/layout/site-header';
import { QueryProvider } from '@/components/providers/query-provider';
import { AuthTokenProvider } from '@/components/providers/auth-token-provider';
import { isAuthStubEnabled, requireClerkPublishableKey } from '@/lib/clerk-env';
import './globals.css';

export const metadata: Metadata = {
  title: 'TSC Community',
  description: 'Identity, profiles, and community for the TSC ecosystem',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const stubEnabled = isAuthStubEnabled();
  const publishableKey = stubEnabled ? null : requireClerkPublishableKey();

  const body = (
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
  );

  if (stubEnabled || !publishableKey) {
    return body;
  }

  return <ClerkProvider publishableKey={publishableKey}>{body}</ClerkProvider>;
}
