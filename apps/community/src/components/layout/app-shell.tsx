'use client';

import { useEffect } from 'react';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { isClientAuthStubEnabled, isClerkConfigured } from '@/lib/clerk-env';
import { AppRightRail } from './app-right-rail';
import { AppSidebar } from './app-sidebar';
import { MobileBottomNav } from './mobile-bottom-nav';
import { Button } from '@/components/ui/button';
import { applyTheme, loadPreferences } from '@/lib/community-preferences';

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const useStub = isClientAuthStubEnabled() || !isClerkConfigured();

  useEffect(() => {
    applyTheme(loadPreferences().theme);
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-0px)] bg-brand-cream-wash/40">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-brand-teal-deep/10 bg-brand-cream-wash/90 px-4 backdrop-blur lg:px-6">
          <p className="text-sm font-medium text-brand-teal-deep/60 lg:hidden">TSC Community</p>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden text-brand-teal-deep sm:inline-flex"
            >
              <Link href="/feed">Activity</Link>
            </Button>
            {useStub ? (
              <Button asChild variant="ghost" size="sm" className="text-brand-teal-deep">
                <Link href="/profile">Passport</Link>
              </Button>
            ) : (
              <UserButton afterSignOutUrl="/" />
            )}
          </div>
        </header>
        <div className="flex flex-1 gap-6 px-4 py-6 lg:px-6">
          <div className="min-w-0 flex-1 pb-20 lg:pb-6">{children}</div>
          <AppRightRail />
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
