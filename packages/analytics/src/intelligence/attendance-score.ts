import { clampScore } from './utils.js';

export function calculateAttendanceScore(input?: {
  eventsAttended?: number;
  eventsInvited?: number;
  eventsNoShow?: number;
  daysSinceLastAttendance?: number;
}): number {
  const attended = input?.eventsAttended ?? 0;
  const invited = input?.eventsInvited ?? 0;
  if (invited <= 0) return attended > 0 ? 80 : 0;
  return clampScore((attended / invited) * 100);
}

export function calculateEngagementScore(input?: {
  contentInteractions?: number;
  sessionsLast30Days?: number;
}): number {
  const interactions = input?.contentInteractions ?? 0;
  const sessions = input?.sessionsLast30Days ?? 0;
  return clampScore(Math.min(interactions * 3 + sessions * 5, 100));
}

export function calculateSpendingScore(input?: {
  totalSpendLast90Days?: number;
  transactionCount?: number;
}): number {
  const spend = input?.totalSpendLast90Days ?? 0;
  const tx = input?.transactionCount ?? 0;
  return clampScore(Math.min(spend / 2000 + tx * 5, 100));
}

export function calculateLoyaltyScore(input?: {
  tenureDays?: number;
  consecutiveActiveMonths?: number;
}): number {
  const tenure = input?.tenureDays ?? 0;
  const months = input?.consecutiveActiveMonths ?? 0;
  return clampScore(Math.min(tenure / 4 + months * 8, 100));
}
