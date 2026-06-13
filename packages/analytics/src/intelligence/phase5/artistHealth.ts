import { clampScore, normalizeToScore, recencyDecay } from "../utils.js";
import {
  PHASE5_SCORE_VERSION,
  type ArtistHealthInput,
  type ArtistHealthResult,
  type ArtistHealthRiskAlert,
} from "./types.js";

const LISTENERS_CAP = 100_000;
const POSTS_CAP = 30;
const ACTIVE_MEMBER_RATIO_CAP = 0.5;
const SHOWS_CAP = 12;

const DIMENSION_WEIGHTS = {
  listeners: 0.35,
  communityActivity: 0.35,
  shows: 0.3,
} as const;

function listenerDimension(input: ArtistHealthInput): number {
  const volume = normalizeToScore(input.listenerCount ?? 0, LISTENERS_CAP);
  const change = input.listenerChange30d ?? 0;
  const momentum = clampScore(50 + change);
  return clampScore(volume * 0.6 + momentum * 0.4);
}

function communityDimension(input: ArtistHealthInput): number {
  const posts = normalizeToScore(input.communityPostsLast30 ?? 0, POSTS_CAP);
  const total = input.communityMemberTotal ?? 0;
  const active = input.communityActiveMembers ?? 0;
  const ratio =
    total > 0 ? clampScore((active / total / ACTIVE_MEMBER_RATIO_CAP) * 100) : 0;
  return clampScore(posts * 0.5 + ratio * 0.5);
}

function showsDimension(input: ArtistHealthInput): number {
  const past = normalizeToScore(input.showsLast90 ?? 0, SHOWS_CAP);
  const future = normalizeToScore(input.showsBookedNext90 ?? 0, SHOWS_CAP);
  return clampScore(past * 0.45 + future * 0.55);
}

function buildRiskAlerts(input: ArtistHealthInput, dimensions: ArtistHealthResult["dimensions"]): ArtistHealthRiskAlert[] {
  const alerts: ArtistHealthRiskAlert[] = [];

  if ((input.listenerChange30d ?? 0) <= -15) {
    alerts.push({
      code: "listener_decline",
      severity: "high",
      message: `Listener count down ${Math.abs(input.listenerChange30d ?? 0)}% over 30 days.`,
    });
  } else if ((input.listenerChange30d ?? 0) <= -5) {
    alerts.push({
      code: "listener_soft_decline",
      severity: "medium",
      message: "Listener growth slowing — review release and promo cadence.",
    });
  }

  if (dimensions.communityActivity < 30) {
    alerts.push({
      code: "community_inactive",
      severity: "medium",
      message: "Community activity below healthy threshold.",
    });
  }

  if ((input.showsBookedNext90 ?? 0) === 0 && (input.showsLast90 ?? 0) <= 1) {
    alerts.push({
      code: "show_pipeline_empty",
      severity: "high",
      message: "No upcoming shows and low recent performance count.",
    });
  }

  if ((input.followerChange30d ?? 0) <= -10) {
    alerts.push({
      code: "follower_decline",
      severity: "low",
      message: "Follower count trending down.",
    });
  }

  const staleDays = input.showsLast90 === 0 ? 120 : 0;
  if (staleDays > 90 && dimensions.shows < 20) {
    alerts.push({
      code: "performance_gap",
      severity: "medium",
      message: "Extended gap since last live performance.",
    });
  }

  if (alerts.length === 0 && dimensions.listeners < 40) {
    alerts.push({
      code: "reach_low",
      severity: "low",
      message: "Overall reach still building — monitor listener baseline.",
    });
  }

  return alerts;
}

/**
 * Artist health score (0–100) plus risk alerts from listeners, community, shows.
 */
export function calculateArtistHealth(input: ArtistHealthInput): ArtistHealthResult {
  const dimensions = {
    listeners: listenerDimension(input),
    communityActivity: communityDimension(input),
    shows: showsDimension(input),
  };

  let healthScore = clampScore(
    dimensions.listeners * DIMENSION_WEIGHTS.listeners +
      dimensions.communityActivity * DIMENSION_WEIGHTS.communityActivity +
      dimensions.shows * DIMENSION_WEIGHTS.shows,
  );

  const declinePenalty = Math.max(0, -(input.listenerChange30d ?? 0));
  if (declinePenalty > 10) {
    healthScore = clampScore(healthScore - recencyDecay(declinePenalty, 60) * 0.15);
  }

  return {
    artistId: input.artistId,
    healthScore,
    dimensions,
    riskAlerts: buildRiskAlerts(input, dimensions),
    calculatedAt: new Date().toISOString(),
    version: PHASE5_SCORE_VERSION,
  };
}
