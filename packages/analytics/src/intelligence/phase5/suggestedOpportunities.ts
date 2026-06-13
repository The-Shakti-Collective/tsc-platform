import { clampScore } from "../utils.js";
import type { CityEventGapInput, SuggestedOpportunityDraft } from "./types.js";

const DEFAULT_GAP_MONTHS = 6;
const FAN_DENSITY_THRESHOLD = 50;

/**
 * Detect market gaps — e.g. fans in city with no event in N months.
 * Returns draft rows for `SuggestedOpportunity` persist.
 */
export function detectCityEventGap(input: CityEventGapInput): SuggestedOpportunityDraft | null {
  const threshold = input.gapThresholdMonths ?? DEFAULT_GAP_MONTHS;
  const monthsSince = input.monthsSinceLastEvent ?? threshold + 1;

  if (input.fanCount < FAN_DENSITY_THRESHOLD || monthsSince < threshold) {
    return null;
  }

  const fanSignal = clampScore(Math.min(input.fanCount / 500, 1) * 100);
  const gapSignal = clampScore(((monthsSince - threshold) / threshold) * 100);
  const confidence = clampScore(fanSignal * 0.6 + gapSignal * 0.4) / 100;

  const potentialAttendance = input.avgEventAttendance
    ? Math.round(input.avgEventAttendance * 0.6)
    : Math.round(input.fanCount * 0.15);

  return {
    artistId: input.artistId,
    type: "city_event_gap",
    title: `Host show in ${input.city}`,
    rationale: `${input.fanCount} fans in ${input.city}; no event in ${monthsSince} months (threshold ${threshold}).`,
    potentialAttendance,
    confidence,
    metadata: {
      city: input.city,
      fanCount: input.fanCount,
      monthsSinceLastEvent: monthsSince,
      gapThresholdMonths: threshold,
    },
  };
}

/** Batch gap detection across cities for one artist. */
export function detectSuggestedOpportunities(
  gaps: CityEventGapInput[],
): SuggestedOpportunityDraft[] {
  return gaps
    .map(detectCityEventGap)
    .filter((draft): draft is SuggestedOpportunityDraft => draft !== null)
    .sort((a, b) => b.confidence - a.confidence);
}
