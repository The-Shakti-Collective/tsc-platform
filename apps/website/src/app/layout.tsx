import type { Metadata } from 'next';
import { PosthogProvider } from '@/components/analytics/posthog-provider';
import { SentryProvider } from '@/components/analytics/sentry-provider';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { isAuthStubEnabled } from '@/lib/clerk-env';
import { createPageMetadata } from '@/lib/seo/metadata';
import './globals.css';

export const metadata: Metadata = createPageMetadata();

export const dynamic = 'force-dynamic';

function AppShell({ children }: { children: React.ReactNode }) {
  return (
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
  );
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  if (isAuthStubEnabled()) {
    return <AppShell>{children}</AppShell>;
  }

  const { ClerkRootLayout } = await import('./clerk-root-layout');
  return <ClerkRootLayout>{children}</ClerkRootLayout>;
}
