import type { CityRecommendationType } from "@tsc/types";
import { calculateCityIntelligence } from "../../industry/city-intelligence.js";
import { clampScore } from "../utils.js";
import type {
  CityIntelligenceRecommendationDraft,
  EcosystemCityIntelligenceInput,
  EcosystemCityIntelligenceResult,
} from "./types.js";

function pushRecommendation(
  list: CityIntelligenceRecommendationDraft[],
  draft: CityIntelligenceRecommendationDraft,
): void {
  list.push(draft);
}

/**
 * Ecosystem city rollup + rule-based recommendations
 * (workshop, book artist, host event, grow community chapter).
 */
export function calculateEcosystemCityIntelligence(
  input: EcosystemCityIntelligenceInput,
): EcosystemCityIntelligenceResult {
  const metrics = calculateCityIntelligence(input);
  const recommendations: CityIntelligenceRecommendationDraft[] = [];

  const fanDensity = (input.fansCount ?? 0) + (input.communityMembers ?? 0);
  const monthsSinceEvent = input.monthsSinceLastEvent ?? 0;
  const heat = metrics.heatScore;

  if (fanDensity >= 200 && monthsSinceEvent >= 4) {
    pushRecommendation(recommendations, {
      city: input.city,
      recommendationType: "host_event",
      rationale: `Strong fan base (${fanDensity}) with ${monthsSinceEvent} months since last event.`,
      priority: clampScore(heat * 0.5 + Math.min(fanDensity / 10, 50)),
      metadata: { fanDensity, monthsSinceLastEvent: monthsSinceEvent },
    });
  }

  if ((input.workshopInterestCount ?? 0) >= 15) {
    pushRecommendation(recommendations, {
      city: input.city,
      recommendationType: "expand_market",
      rationale: `${input.workshopInterestCount} workshop interest signals — schedule academy session.`,
      priority: clampScore(40 + (input.workshopInterestCount ?? 0)),
      metadata: { kind: "workshop", interestCount: input.workshopInterestCount },
    });
  }

  if ((input.artistBookingDemand ?? 0) >= 3 && (input.venuesCount ?? 0) >= 2) {
    pushRecommendation(recommendations, {
      city: input.city,
      recommendationType: "recruit_talent",
      rationale: "Venue capacity and booking demand suggest recruiting local artists.",
      priority: clampScore(35 + (input.artistBookingDemand ?? 0) * 5),
      metadata: { artistBookingDemand: input.artistBookingDemand },
    });
  }

  if (!input.hasLocalChapter && (input.chapterMemberCount ?? 0) >= 25) {
    pushRecommendation(recommendations, {
      city: input.city,
      recommendationType: "grow_community",
      rationale: `${input.chapterMemberCount} members without local chapter — launch community hub.`,
      priority: clampScore(30 + (input.chapterMemberCount ?? 0)),
      metadata: { kind: "chapter", chapterMemberCount: input.chapterMemberCount },
    });
  }

  if ((input.venuesCount ?? 0) >= 3 && heat >= 50) {
    pushRecommendation(recommendations, {
      city: input.city,
      recommendationType: "partner_venue",
      rationale: "Multiple venues and rising heat score — pursue venue partnerships.",
      priority: clampScore(heat * 0.7),
      metadata: { venuesCount: input.venuesCount, heatScore: heat },
    });
  }

  if (recommendations.length === 0 && heat >= 30) {
    pushRecommendation(recommendations, {
      city: input.city,
      recommendationType: "other",
      rationale: "Moderate market activity — monitor for event or workshop window.",
      priority: clampScore(heat * 0.4),
    });
  }

  recommendations.sort((a, b) => b.priority - a.priority);

  return { metrics, recommendations };
}

export type { CityRecommendationType };
