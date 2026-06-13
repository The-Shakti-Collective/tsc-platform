export function clampScore(value: number, max = 100): number {
  return Math.min(max, Math.max(0, Math.round(value * 100) / 100));
}

export function normalizeToScore(value: number, cap: number): number {
  if (cap <= 0) return 0;
  return clampScore((value / cap) * 100);
}

export function recencyDecay(daysSince: number, halfLifeDays = 30): number {
  if (daysSince <= 0) return 100;
  return clampScore(100 * Math.pow(0.5, daysSince / halfLifeDays));
}
