'use client';

import { useCallback, type ReactNode } from 'react';
import { isClientAuthStubEnabled } from '@/lib/clerk-env';
import { AuthTokenContext } from './auth-token-context';
import { ClerkAuthTokenProvider } from './clerk-auth-token-provider';

const STUB_USER_ID = process.env.NEXT_PUBLIC_STUB_USER_ID?.trim() || 'stub-dev-user';

function StubAuthTokenProvider({ children }: { children: ReactNode }) {
  const getAuthToken = useCallback(async () => `stub:${STUB_USER_ID}`, []);

  return <AuthTokenContext.Provider value={getAuthToken}>{children}</AuthTokenContext.Provider>;
}

export function AuthTokenProvider({ children }: { children: ReactNode }) {
  if (isClientAuthStubEnabled()) {
    return <StubAuthTokenProvider>{children}</StubAuthTokenProvider>;
  }

  return <ClerkAuthTokenProvider>{children}</ClerkAuthTokenProvider>;
}

export { useAuthTokenGetter } from './use-auth-token-getter';
