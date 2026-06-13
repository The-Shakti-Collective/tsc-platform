import { clampScore } from './utils.js';

export function calculateSpendingScore(input?: {
  totalSpendLast90Days?: number;
  transactionCount?: number;
}): number {
  const spend = input?.totalSpendLast90Days ?? 0;
  const tx = input?.transactionCount ?? 0;
  return clampScore(Math.min(spend / 2000 + tx * 5, 100));
}
