'use client';

import { isClientAuthStubEnabled } from '@/lib/clerk-env';
import { SiteHeaderClerk } from './site-header-clerk';
import { SiteHeaderStub } from './site-header-stub';

export function SiteHeader() {
  return isClientAuthStubEnabled() ? <SiteHeaderStub /> : <SiteHeaderClerk />;
}
