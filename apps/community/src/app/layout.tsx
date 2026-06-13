import type { Metadata } from 'next';
import { PosthogProvider } from '@/components/analytics/posthog-provider';
import { SentryProvider } from '@/components/analytics/sentry-provider';
import { SiteHeader } from '@/components/layout/site-header';
import { QueryProvider } from '@/components/providers/query-provider';
import { AuthTokenProvider } from '@/components/providers/auth-token-provider';
import { isAuthStubEnabled } from '@/lib/clerk-env';
import './globals.css';

export const metadata: Metadata = {
  title: 'TSC Community',
  description: 'Identity, profiles, and community for the TSC ecosystem',
};

export const dynamic = 'force-dynamic';

function AppShell({ children }: { children: React.ReactNode }) {
  return (
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
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  if (isAuthStubEnabled()) {
    return <AppShell>{children}</AppShell>;
  }

  const { ClerkRootLayout } = await import('./clerk-root-layout');
  return <ClerkRootLayout>{children}</ClerkRootLayout>;
}
