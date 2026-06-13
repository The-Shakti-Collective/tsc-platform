import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { PosthogProvider } from '@/components/analytics/posthog-provider';
import { SentryProvider } from '@/components/analytics/sentry-provider';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { requireClerkPublishableKey, isAuthStubEnabled } from '@/lib/clerk-env';
import { createPageMetadata } from '@/lib/seo/metadata';
import './globals.css';

export const metadata: Metadata = createPageMetadata();

export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const stubEnabled = isAuthStubEnabled();
  const publishableKey = stubEnabled ? null : requireClerkPublishableKey();

  const body = (
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

  if (stubEnabled || !publishableKey) {
    return body;
  }

  return <ClerkProvider publishableKey={publishableKey}>{body}</ClerkProvider>;
}
