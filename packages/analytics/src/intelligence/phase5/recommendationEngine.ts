import type { RecommendationEntityType } from "@tsc/types";
import { clampScore } from "../utils.js";
import type {
  RecommendationCandidateInput,
  RecommendationEngineInput,
  ScoredRecommendation,
} from "./types.js";

const GENRE_MATCH_WEIGHT = 25;
const CITY_MATCH_WEIGHT = 20;
const FOLLOW_PROXIMITY_WEIGHT = 30;
const ATTENDANCE_AFFINITY_WEIGHT = 15;
const POPULARITY_WEIGHT = 10;

function genreOverlap(preferred: string[], candidateGenres: string[] = []): number {
  if (preferred.length === 0 || candidateGenres.length === 0) return 0;
  const preferredSet = new Set(preferred.map((g) => g.toLowerCase()));
  const matches = candidateGenres.filter((g) => preferredSet.has(g.toLowerCase())).length;
  return clampScore((matches / Math.max(preferred.length, 1)) * 100);
}

function scoreCandidate(
  input: RecommendationEngineInput,
  candidate: RecommendationCandidateInput,
): ScoredRecommendation {
  const reasonCodes: string[] = [];
  let score = candidate.popularity ?? 0;

  const genres = candidate.artistGenres ?? candidate.eventGenres ?? [];
  const genreScore = genreOverlap(input.preferredGenres ?? [], genres);
  if (genreScore > 0) {
    score += (genreScore / 100) * GENRE_MATCH_WEIGHT;
    reasonCodes.push("genre_match");
  }

  if (input.city && candidate.city && input.city.toLowerCase() === candidate.city.toLowerCase()) {
    score += CITY_MATCH_WEIGHT;
    reasonCodes.push("location_match");
  }

  if (
    candidate.kind === "artist" &&
    input.followedArtistIds?.includes(candidate.entityId)
  ) {
    score += FOLLOW_PROXIMITY_WEIGHT;
    reasonCodes.push("already_followed");
  }

  if (
    candidate.kind === "event" &&
    input.attendedEventIds?.includes(candidate.entityId)
  ) {
    score += ATTENDANCE_AFFINITY_WEIGHT;
    reasonCodes.push("attended_similar");
  }

  if (candidate.kind === "workshop") {
    score += 5;
    reasonCodes.push("workshop_interest");
  }

  if ((candidate.popularity ?? 0) >= 60) {
    reasonCodes.push("trending");
  }

  score += ((candidate.popularity ?? 0) / 100) * POPULARITY_WEIGHT;

  if (reasonCodes.length === 0) {
    reasonCodes.push("explore");
  }

  return {
    personId: input.personId,
    entityType: candidate.entityType,
    entityId: candidate.entityId,
    score: clampScore(score),
    reasonCodes,
  };
}

/**
 * Rule-based artist / event / workshop recommendations from follows, attendance, genres, location.
 */
export function generateRecommendations(
  input: RecommendationEngineInput,
): ScoredRecommendation[] {
  const max = input.maxResults ?? 10;

  return input.candidates
    .map((candidate) => scoreCandidate(input, candidate))
    .sort((a, b) => b.score - a.score)
    .slice(0, max);
}

export type { RecommendationEntityType };
