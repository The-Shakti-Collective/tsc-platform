const PLACEHOLDER_KEY_PATTERN = /REPLACE_ME|ci_placeholder/i;

function isNonProduction(): boolean {
  return process.env.NODE_ENV !== 'production';
}

export function isPlaceholderClerkKey(key: string | undefined): boolean {
  if (!key?.trim()) return true;
  return PLACEHOLDER_KEY_PATTERN.test(key);
}

export function isAuthStubEnabled(): boolean {
  if (!isNonProduction()) return false;

  const raw = process.env.TSC_AUTH_STUB?.trim().toLowerCase();
  if (raw === 'true' || raw === '1' || raw === 'yes') return true;
  if (raw === 'false' || raw === '0' || raw === 'no') return false;

  const pubStub = process.env.NEXT_PUBLIC_AUTH_STUB?.trim().toLowerCase();
  if (pubStub === 'true' || pubStub === '1' || pubStub === 'yes') return true;
  if (pubStub === 'false' || pubStub === '0' || pubStub === 'no') return false;

  return isPlaceholderClerkKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

/** Client-safe stub check (NEXT_PUBLIC vars only). */
export function isClientAuthStubEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false;

  const pubStub = process.env.NEXT_PUBLIC_AUTH_STUB?.trim().toLowerCase();
  if (pubStub === 'true' || pubStub === '1' || pubStub === 'yes') return true;
  if (pubStub === 'false' || pubStub === '0' || pubStub === 'no') return false;

  return isPlaceholderClerkKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

export function requireClerkPublishableKey(): string {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  if (!key || isPlaceholderClerkKey(key)) {
    throw new Error(
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required. Set real Clerk keys from the Clerk dashboard.',
    );
  }
  return key;
}
