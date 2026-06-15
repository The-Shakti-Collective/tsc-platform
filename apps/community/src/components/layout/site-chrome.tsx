'use client';

import { usePathname } from 'next/navigation';
import { AppShell } from './app-shell';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import { isMemberAppRoute } from '@/lib/member-routes';

type SiteChromeProps = {
  children: React.ReactNode;
};

export function SiteChrome({ children }: SiteChromeProps) {
  const pathname = usePathname();

  if (pathname && isMemberAppRoute(pathname)) {
    return <AppShell>{children}</AppShell>;
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
