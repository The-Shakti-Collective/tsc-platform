'use client';

import { useContext } from 'react';
import { AuthTokenContext } from './auth-token-context';

export function useAuthTokenGetter() {
  return useContext(AuthTokenContext);
}
