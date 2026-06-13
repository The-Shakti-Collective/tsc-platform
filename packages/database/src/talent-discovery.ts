/** Phase 9 Step 6 — Talent Discovery Agent rule-based growth signals (no ML). */

import { AUDIENCE_PERIOD_DAYS, HIGH_GROWTH_AUDIENCE_THRESHOLD } from './audience.js';

export const TALENT_DISCOVERY_ALERT_ENTITY_TYPES = ['Artist', 'Community', 'City'] as const;
export type TalentDiscoveryAlertEntityType =
  (typeof TALENT_DISCOVERY_ALERT_ENTITY_TYPES)[number];

export const TALENT_DISCOVERY_ALERT_TYPE = 'talent_discovery_alert' as const;

/** Artist audienceGrowth must meet or exceed this (reuses Audience V2 threshold). */
export const FAST_GROWING_ARTIST_THRESHOLD = HIGH_GROWTH_AUDIENCE_THRESHOLD;

/** City+genre scene growth % to surface as emerging alert. */
export const EMERGING_CITY_SCENE_THRESHOLD = 50;

/** Community memberGrowth floor for undervalued signal. */
export const UNDERVALUED_COMMUNITY_MIN_GROWTH = 8;

/** Communities above this active-member count are treated as already visible. */
export const UNDERVALUED_COMMUNITY_MAX_ACTIVE = 800;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function growthPercent(current: number, previous: number): number {
  if (previous > 0) return round2(((current - previous) / previous) * 100);
  return current > 0 ? 100 : 0;
}

/** Superfan velocity stub — new platinum+ tier snapshots vs prior window. */
export function computeSuperfanVelocityStub(
  newSuperfansCurrent: number,
  newSuperfansPrevious: number,
): number {
  return growthPercent(newSuperfansCurrent, newSuperfansPrevious);
}

/** Activity feed velocity stub — platform activities tied to entity in window. */
export function computeActivityFeedVelocityStub(
  activityCurrent: number,
  activityPrevious: number,
): number {
  return growthPercent(activityCurrent, activityPrevious);
}

export interface CitySceneGrowthInput {
  avgMemberGrowth: number;
  eventDensityGrowth: number;
  activityVelocity: number;
  artistAudienceGrowth?: number;
}

/** Weighted city+genre scene growth (e.g. Nagpur Hip-Hop +300%). */
export function computeCitySceneGrowth(input: CitySceneGrowthInput): number {
  const artistBoost = input.artistAudienceGrowth ?? 0;
  return round2(
    input.avgMemberGrowth * 0.35 +
      input.eventDensityGrowth * 0.3 +
      input.activityVelocity * 0.2 +
      artistBoost * 0.15,
  );
}

export interface TalentDiscoveryScoreInput {
  growthPercent: number;
  superfanVelocityStub: number;
  activityVelocityStub: number;
  entityType: TalentDiscoveryAlertEntityType;
}

export function scoreTalentDiscoveryAlert(input: TalentDiscoveryScoreInput): {
  score: number;
  confidence: number;
} {
  const base =
    input.entityType === 'City'
      ? Math.min(100, input.growthPercent * 0.28)
      : input.entityType === 'Community'
        ? Math.min(100, input.growthPercent * 0.45 + 20)
        : Math.min(100, input.growthPercent * 0.5 + 15);

  const velocityBoost = Math.min(
    18,
    input.superfanVelocityStub * 0.08 + input.activityVelocityStub * 0.06,
  );
  const score = round2(Math.min(100, base + velocityBoost));
  const confidence = round2(
    Math.min(0.95, 0.45 + score / 200 + Math.min(0.15, input.growthPercent / 500)),
  );

  return { score, confidence };
}

export function isUndervaluedCommunity(
  memberGrowth: number,
  activeMembers: number,
  fanGrowth: number,
): boolean {
  if (memberGrowth < UNDERVALUED_COMMUNITY_MIN_GROWTH) return false;
  if (activeMembers > UNDERVALUED_COMMUNITY_MAX_ACTIVE) return false;
  return fanGrowth >= memberGrowth * 0.5 || activeMembers < 600;
}

export function buildTalentDiscoveryTitle(
  entityType: TalentDiscoveryAlertEntityType,
  name: string,
  growthPercent: number,
  genre?: string | null,
): string {
  const pct = Math.round(growthPercent);
  if (entityType === 'City') {
    const label = genre ? `${name} ${formatGenreLabel(genre)} Scene` : `${name} Scene`;
    return `${label} +${pct}% growth`;
  }
  if (entityType === 'Community') {
    return `Undervalued community: ${name}`;
  }
  return `Fast growing artist: ${name}`;
}

function formatGenreLabel(genre: string): string {
  return genre
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('-');
}

export const TALENT_DISCOVERY_PERIOD_DAYS = AUDIENCE_PERIOD_DAYS;
