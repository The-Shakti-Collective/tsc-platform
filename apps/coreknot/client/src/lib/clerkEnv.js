const PLACEHOLDER_KEY_PATTERN = /REPLACE_ME|ci_placeholder/i;

function isPlaceholderClerkKey(key) {
  if (!key?.trim()) return true;
  return PLACEHOLDER_KEY_PATTERN.test(key);
}

export function isAuthStubEnabled() {
  if (import.meta.env.PROD) return false;

  const raw = import.meta.env.VITE_AUTH_STUB?.trim().toLowerCase();
  if (raw === 'true' || raw === '1' || raw === 'yes') return true;
  if (raw === 'false' || raw === '0' || raw === 'no') return false;

  return isPlaceholderClerkKey(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
}

export function requireClerkPublishableKey() {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim();
  if (!key || isPlaceholderClerkKey(key)) {
    throw new Error(
      'VITE_CLERK_PUBLISHABLE_KEY is required. Set real Clerk keys from the Clerk dashboard.',
    );
  }
  return key;
}
