import { clampScore } from './utils.js';

export function calculateLoyaltyScore(input?: {
  tenureDays?: number;
  consecutiveActiveMonths?: number;
}): number {
  const tenure = input?.tenureDays ?? 0;
  const months = input?.consecutiveActiveMonths ?? 0;
  return clampScore(Math.min(tenure / 4 + months * 8, 100));
}
