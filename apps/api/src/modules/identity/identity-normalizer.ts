import type { IdentifierProvider } from '@tsc/types';
import { SOCIAL_IDENTIFIER_PROVIDERS } from '@tsc/database';

export interface NormalizedIdentifier {
  provider: IdentifierProvider;
  externalId: string;
  normalizedId: string;
}

const EMAIL_PROVIDER: IdentifierProvider = 'email';
const PHONE_PROVIDER: IdentifierProvider = 'phone';

export function normalizeIdentifier(
  provider: IdentifierProvider,
  externalId: string,
): NormalizedIdentifier {
  const trimmed = externalId.trim();

  if (provider === EMAIL_PROVIDER) {
    const normalized = trimmed.toLowerCase();
    return { provider, externalId: trimmed, normalizedId: normalized };
  }

  if (provider === PHONE_PROVIDER) {
    const digits = trimmed.replace(/\D/g, '');
    const normalized = digits.length > 10 ? digits.slice(-10) : digits;
    return { provider, externalId: trimmed, normalizedId: normalized };
  }

  if (SOCIAL_IDENTIFIER_PROVIDERS.includes(provider)) {
    const handle = trimmed
      .replace(/^@/, '')
      .replace(/^https?:\/\/(www\.)?[^/]+\//i, '')
      .replace(/\/$/, '')
      .toLowerCase();
    return { provider, externalId: trimmed, normalizedId: handle };
  }

  return { provider, externalId: trimmed, normalizedId: trimmed.toLowerCase() };
}

export function socialHandlesFuzzyMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;

  const strip = (value: string) =>
    value.replace(/[._-]/g, '').replace(/\s+/g, '');

  const compactA = strip(a);
  const compactB = strip(b);
  if (compactA === compactB) return true;

  return compactA.includes(compactB) || compactB.includes(compactA);
}

export function matchConfidence(
  provider: IdentifierProvider,
  matchType: 'exact' | 'normalized' | 'fuzzy',
  verified = false,
): number {
  const base =
    provider === EMAIL_PROVIDER
      ? 1
      : provider === PHONE_PROVIDER
        ? 0.95
        : SOCIAL_IDENTIFIER_PROVIDERS.includes(provider)
          ? 0.75
          : 0.6;

  const typeMultiplier =
    matchType === 'exact' ? 1 : matchType === 'normalized' ? 0.92 : 0.8;

  const verifiedBonus = verified ? 0.05 : 0;
  return Math.min(1, base * typeMultiplier + verifiedBonus);
}
