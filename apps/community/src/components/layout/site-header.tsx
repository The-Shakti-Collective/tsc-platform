'use client';

import { isClientAuthStubEnabled, isClerkConfigured } from '@/lib/clerk-env';
import { SiteHeaderClerk } from './site-header-clerk';
import { SiteHeaderStub } from './site-header-stub';

export function SiteHeader() {
  const useStubShell = isClientAuthStubEnabled() || !isClerkConfigured();
  return useStubShell ? <SiteHeaderStub hideDevBadge={!isClientAuthStubEnabled()} /> : <SiteHeaderClerk />;
}
