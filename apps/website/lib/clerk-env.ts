const PLACEHOLDER_KEY_PATTERN = /REPLACE_ME|REPLACE_WITH|ci_placeholder/i;

function parseTruthyFlag(value: string | undefined): boolean | null {
  const raw = value?.trim().toLowerCase();
  if (raw === 'true' || raw === '1' || raw === 'yes') return true;
  if (raw === 'false' || raw === '0' || raw === 'no') return false;
  return null;
}

export function isPlaceholderClerkKey(key: string | undefined): boolean {
  if (!key?.trim()) return true;
  return PLACEHOLDER_KEY_PATTERN.test(key);
}

export function hasValidClerkKeys(): boolean {
  return (
    !isPlaceholderClerkKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) &&
    !isPlaceholderClerkKey(process.env.CLERK_SECRET_KEY)
  );
}

export function isAuthStubEnabled(): boolean {
  const stubFlag = parseTruthyFlag(process.env.TSC_AUTH_STUB);
  if (stubFlag === true) return true;

  const pubStubFlag = parseTruthyFlag(process.env.NEXT_PUBLIC_AUTH_STUB);
  if (pubStubFlag === true) return true;

  if (!hasValidClerkKeys()) return true;

  if (stubFlag === false || pubStubFlag === false) return false;

  return false;
}

export function isClientAuthStubEnabled(): boolean {
  const pubStubFlag = parseTruthyFlag(process.env.NEXT_PUBLIC_AUTH_STUB);
  if (pubStubFlag === true) return true;
  if (!hasValidClerkKeys()) return true;
  if (pubStubFlag === false) return false;
  return false;
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
