'use client';

import { useAuth } from '@clerk/nextjs';
import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { isClientAuthStubEnabled } from '@/lib/clerk-env';

const STUB_USER_ID = process.env.NEXT_PUBLIC_STUB_USER_ID?.trim() || 'stub-dev-user';

type AuthTokenGetter = () => Promise<string | null>;

const AuthTokenContext = createContext<AuthTokenGetter>(() => Promise.resolve(null));

function ClerkAuthTokenProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();

  const getAuthToken = useCallback(async () => (await getToken()) ?? null, [getToken]);

  return <AuthTokenContext.Provider value={getAuthToken}>{children}</AuthTokenContext.Provider>;
}

function StubAuthTokenProvider({ children }: { children: ReactNode }) {
  const getAuthToken = useCallback(async () => `stub:${STUB_USER_ID}`, []);

  return <AuthTokenContext.Provider value={getAuthToken}>{children}</AuthTokenContext.Provider>;
}

export function AuthTokenProvider({ children }: { children: ReactNode }) {
  const stubEnabled = isClientAuthStubEnabled();

  if (stubEnabled) {
    return <StubAuthTokenProvider>{children}</StubAuthTokenProvider>;
  }

  return <ClerkAuthTokenProvider>{children}</ClerkAuthTokenProvider>;
}

export function useAuthTokenGetter(): AuthTokenGetter {
  return useContext(AuthTokenContext);
}
