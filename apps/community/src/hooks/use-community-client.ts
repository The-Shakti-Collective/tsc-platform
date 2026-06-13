'use client';

import { createCommunityClient } from '@tsc/community-sdk';
import { useMemo } from 'react';
import { useAuthTokenGetter } from '@/components/providers/auth-token-provider';
import { getApiBaseUrl } from '@/lib/utils';

export function useCommunityClient() {
  const getAuthToken = useAuthTokenGetter();

  return useMemo(
    () =>
      createCommunityClient({
        baseUrl: getApiBaseUrl(),
        getAuthToken,
      }),
    [getAuthToken],
  );
}
