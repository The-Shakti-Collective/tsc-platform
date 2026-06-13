import { clampScore } from '../intelligence/utils.js';
import type { CityIntelligenceInput, CityIntelligenceMetrics } from './types.js';

/**
 * Rule-based city heat rollup — reused by Phase 5 city intelligence + Recommendation V2.
 */
export function calculateCityIntelligence(input: CityIntelligenceInput): CityIntelligenceMetrics {
  const artists = input.artistsCount ?? 0;
  const fans = input.fansCount ?? 0;
  const events = input.eventsCount ?? 0;
  const revenue = input.revenue ?? 0;
  const community = input.communityMembers ?? 0;

  const artistDensity = clampScore(Math.min(artists * 4, 100));
  const fanDensity = clampScore(Math.min(fans / 20, 100));
  const eventCadence = clampScore(Math.min(events * 8, 100));
  const revenueIndex = clampScore(Math.min(revenue / 50_000, 100));
  const communityIndex = clampScore(Math.min(community / 10, 100));

  const heatScore = clampScore(
    artistDensity * 0.2 +
      fanDensity * 0.25 +
      eventCadence * 0.2 +
      revenueIndex * 0.2 +
      communityIndex * 0.15,
  );

  return {
    city: input.city,
    heatScore,
    artistDensity,
    fanDensity,
    eventCadence,
    revenueIndex,
    communityIndex,
  };
}
