import type { Metadata } from 'next';
import { DM_Sans, Signika } from 'next/font/google';
import { PosthogProvider } from '@/components/analytics/posthog-provider';
import { SentryProvider } from '@/components/analytics/sentry-provider';
import { SiteHeader } from '@/components/layout/site-header';
import { QueryProvider } from '@/components/providers/query-provider';
import { AuthTokenProvider } from '@/components/providers/auth-token-provider';
import { isAuthStubEnabled } from '@/lib/clerk-env';
import './globals.css';

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

export const metadata: Metadata = {
  title: 'The Shakti Collective — Creative Career Network',
  description:
    "India's creative career network for artists, musicians, filmmakers and industry professionals.",
};

export const dynamic = 'force-dynamic';

function AppShell({ children }: { children: React.ReactNode }) {
  return (
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
  );
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  if (isAuthStubEnabled()) {
    return <AppShell>{children}</AppShell>;
  }

  const { ClerkRootLayout } = await import('./clerk-root-layout');
  return <ClerkRootLayout>{children}</ClerkRootLayout>;
}
