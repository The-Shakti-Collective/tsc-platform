import type { Metadata } from 'next';
import { DM_Sans, Signika } from 'next/font/google';
import { PosthogProvider } from '@/components/analytics/posthog-provider';
import { SentryProvider } from '@/components/analytics/sentry-provider';
import { SiteChrome } from '@/components/layout/site-chrome';
import { QueryProvider } from '@/components/providers/query-provider';
import { AuthTokenProvider } from '@/components/providers/auth-token-provider';
import { getAppUrl } from '@/lib/app-urls';
import { BRAND_LOGO_PATH } from '@/lib/brand-assets';
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
    default: 'The Shakti Collective — Creator Operating System',
    template: '%s · The Shakti Collective',
  },
  description:
    "India's creator operating system — discover collaborators, find gigs, and build your creative identity.",
  openGraph: {
    title: 'The Shakti Collective — Creator Operating System',
    description:
      'Discover collaborators, find gigs, and build your creative passport with 10,000+ creators across India.',
    siteName: 'The Shakti Collective',
    type: 'website',
  },
  icons: {
    icon: BRAND_LOGO_PATH,
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
                <SiteChrome>{children}</SiteChrome>
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
