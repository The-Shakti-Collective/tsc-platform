import { getApiBaseUrl } from '@/lib/utils';

export interface ResolvePersonIdInput {
  clerkUserId: string;
  profilePersonId?: string | null;
  email?: string | null;
  phone?: string | null;
  instagram?: string | null;
  spotify?: string | null;
  displayName?: string | null;
}

export interface ResolvePersonIdResult {
  personId: string;
  source: 'profile' | 'resolver';
  created?: boolean;
  matched?: boolean;
}

/**
 * Resolves TSC person id from Clerk session identifiers via POST /identity/resolve.
 */
export async function resolvePersonId(
  input: ResolvePersonIdInput,
): Promise<ResolvePersonIdResult> {
  if (input.profilePersonId?.trim()) {
    return { personId: input.profilePersonId.trim(), source: 'profile' };
  }

  const identifiers: Array<{
    provider: string;
    externalId: string;
    verified?: boolean;
  }> = [{ provider: 'coreknot_user', externalId: input.clerkUserId, verified: true }];

  if (input.email?.trim()) {
    identifiers.push({ provider: 'email', externalId: input.email.trim() });
  }
  if (input.phone?.trim()) {
    identifiers.push({ provider: 'phone', externalId: input.phone.trim() });
  }
  if (input.instagram?.trim()) {
    identifiers.push({ provider: 'instagram', externalId: input.instagram.trim() });
  }
  if (input.spotify?.trim()) {
    identifiers.push({ provider: 'spotify', externalId: input.spotify.trim() });
  }

  const response = await fetch(`${getApiBaseUrl()}/identity/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifiers,
      displayName: input.displayName ?? undefined,
      createIfMissing: true,
      source: 'community',
    }),
  });

  if (!response.ok) {
    throw new Error(`identity resolve failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    personId: string;
    created?: boolean;
    matched?: boolean;
  };

  return {
    personId: payload.personId,
    source: 'resolver',
    created: payload.created,
    matched: payload.matched,
  };
}
