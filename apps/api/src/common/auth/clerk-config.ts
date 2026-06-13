const PLACEHOLDER_KEY_PATTERN = /REPLACE_ME|ci_placeholder/i;

function isNonProduction(): boolean {
  return process.env.NODE_ENV !== 'production';
}

export function isAuthStubEnabled(): boolean {
  // Stub auth is dev-only — production always requires real Clerk JWTs
  if (!isNonProduction()) return false;

  const raw = process.env.TSC_AUTH_STUB?.trim().toLowerCase();
  if (raw === 'true' || raw === '1' || raw === 'yes') return true;
  if (raw === 'false' || raw === '0' || raw === 'no') return false;
  // Auto-stub when Clerk keys are unset or placeholder (local dev without .env load)
  return isPlaceholderClerkKey(process.env.CLERK_SECRET_KEY);
}

export function isPlaceholderClerkKey(key: string | undefined): boolean {
  if (!key?.trim()) return true;
  return PLACEHOLDER_KEY_PATTERN.test(key);
}

export function requireClerkSecretKey(): string {
  if (isAuthStubEnabled()) {
    throw new Error('requireClerkSecretKey called while TSC_AUTH_STUB is enabled');
  }
  const key = process.env.CLERK_SECRET_KEY?.trim();
  if (!key || isPlaceholderClerkKey(key)) {
    throw new Error(
      'CLERK_SECRET_KEY is required for API authentication. Set real Clerk keys or TSC_AUTH_STUB=true for local dev.',
    );
  }
  return key;
}

export function resolveStubUserId(): string {
  return process.env.TSC_STUB_USER_ID?.trim() || 'stub-dev-user';
}
export function resolvePlatformAdminUserIds(): Set<string> {
  const raw = process.env.TSC_ADMIN_USER_IDS?.trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export function isPlatformAdmin(clerkUserId: string): boolean {
  return resolvePlatformAdminUserIds().has(clerkUserId);
}
