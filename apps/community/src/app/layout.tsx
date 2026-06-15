import type { Metadata } from 'next';
import { DM_Sans, Signika } from 'next/font/google';
import { PosthogProvider } from '@/components/analytics/posthog-provider';
import { SentryProvider } from '@/components/analytics/sentry-provider';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { QueryProvider } from '@/components/providers/query-provider';
import { AuthTokenProvider } from '@/components/providers/auth-token-provider';
import { getAppUrl } from '@/lib/app-urls';
import { isAuthStubEnabled, isClerkConfigured } from '@/lib/clerk-env';
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
  metadataBase: new URL(getAppUrl()),
  title: {
    default: 'The Shakti Collective — Creative Career Network',
    template: '%s · The Shakti Collective',
  },
  description:
    "India's creative career network for artists, musicians, filmmakers and industry professionals.",
  openGraph: {
    title: 'The Shakti Collective — Creative Career Network',
    description:
      'Discover opportunities, collaborate with creators, and build a sustainable creative career in India.',
    siteName: 'The Shakti Collective',
    type: 'website',
  },
  icons: {
    icon: '/brand/tsc-logo.svg',
  },
};

export const dynamic = 'force-dynamic';

function AppShell({ children }: { children: React.ReactNode }) {
  return (
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
  );
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  if (isAuthStubEnabled() || !isClerkConfigured()) {
    return <AppShell>{children}</AppShell>;
  }

  const { ClerkRootLayout } = await import('./clerk-root-layout');
  return <ClerkRootLayout>{children}</ClerkRootLayout>;
}
