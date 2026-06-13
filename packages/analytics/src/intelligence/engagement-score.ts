import { clampScore } from './utils.js';

export function calculateEngagementScore(input?: {
  contentInteractions?: number;
  sessionsLast30Days?: number;
}): number {
  const interactions = input?.contentInteractions ?? 0;
  const sessions = input?.sessionsLast30Days ?? 0;
  return clampScore(Math.min(interactions * 3 + sessions * 5, 100));
}
