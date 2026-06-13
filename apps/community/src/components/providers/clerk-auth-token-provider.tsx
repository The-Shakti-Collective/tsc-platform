'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, type ReactNode } from 'react';
import { AuthTokenContext } from './auth-token-context';

export function ClerkAuthTokenProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();

  const getAuthToken = useCallback(async () => (await getToken()) ?? null, [getToken]);

  return <AuthTokenContext.Provider value={getAuthToken}>{children}</AuthTokenContext.Provider>;
}
