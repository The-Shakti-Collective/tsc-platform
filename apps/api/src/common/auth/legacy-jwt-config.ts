/** Legacy CoreKnot session JWT bridge — dual-auth transition only. */

export function requireLegacyJwtSecret(): string | undefined {
  const secret =
    process.env.COREKNOT_JWT_SECRET?.trim() || process.env.JWT_SECRET?.trim();
  return secret || undefined;
}

export function isLegacyJwtBridgeEnabled(): boolean {
  const flag = process.env.COREKNOT_JWT_BRIDGE?.trim().toLowerCase();
  if (flag === 'false' || flag === '0' || flag === 'no') return false;
  if (flag === 'true' || flag === '1' || flag === 'yes') {
    return Boolean(requireLegacyJwtSecret());
  }
  // Default off — explicit opt-in during transition window
  return false;
}

export function legacyJwtAbsoluteMaxMs(): number {
  const days = Number(process.env.JWT_ABSOLUTE_MAX_DAYS) || 30;
  return days * 24 * 60 * 60 * 1000;
}
