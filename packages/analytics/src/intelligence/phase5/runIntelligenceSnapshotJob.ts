import type { PrismaClient } from "@tsc/database/client";
import type { AudienceIntelligenceInput } from "@tsc/types";
import { calculateArtistHealth } from "./artistHealth.js";
import { calculateEcosystemCityIntelligence } from "./cityIntelligence.js";
import { calculateCommunityIntelligence } from "./communityIntelligence.js";
import { calculateFanIntelligence } from "./fanIntelligence.js";
import { calculateOpportunityScore } from "./opportunityScoring.js";
import { generateRecommendations } from "./recommendationEngine.js";
import { detectSuggestedOpportunities } from "./suggestedOpportunities.js";
import type {
  ArtistHealthInput,
  CityEventGapInput,
  CommunityIntelligenceInput,
  EcosystemCityIntelligenceInput,
  FanIntelligenceInput,
  OpportunityScoringInput,
  RecommendationEngineInput,
} from "./types.js";
import {
  createArtistHealthSnapshot,
  createCityRecommendation,
  createCommunityIntelligenceSnapshot,
  createFanIntelligenceSnapshot,
  createLeadScore,
  createOpportunityScore,
  upsertSuggestedOpportunity,
} from "../../snapshots/intelligence-persist.js";
import { createCityIntelligenceSnapshot } from "../../snapshots/industry-persist.js";
import { toSnapshotDateOnly } from "../../snapshots/persist.js";

export interface IntelligenceSnapshotArtistTarget {
  artistId: string;
  healthInput: ArtistHealthInput;
  cityGaps?: CityEventGapInput[];
}

export interface IntelligenceSnapshotFanTarget {
  personId: string;
  artistId?: string;
  signals: FanIntelligenceInput;
}

export interface IntelligenceSnapshotCommunityTarget {
  communityId: string;
  signals: CommunityIntelligenceInput;
}

export interface RunIntelligenceSnapshotJobOptions {
  prisma: PrismaClient;
  snapshotDate?: Date;
  opportunities?: OpportunityScoringInput[];
  leadScores?: Array<{ personId: string; input: OpportunityScoringInput }>;
  artists?: IntelligenceSnapshotArtistTarget[];
  fans?: IntelligenceSnapshotFanTarget[];
  communities?: IntelligenceSnapshotCommunityTarget[];
  cities?: EcosystemCityIntelligenceInput[];
  recommendations?: RecommendationEngineInput[];
  dryRun?: boolean;
}

export interface IntelligenceSnapshotJobResult {
  snapshotDate: Date;
  processed: number;
  succeeded: number;
  failed: number;
  dryRun: boolean;
  counts: {
    opportunities: number;
    leadScores: number;
    suggestedOpportunities: number;
    artistHealth: number;
    fanIntelligence: number;
    communityIntelligence: number;
    cityIntelligence: number;
    cityRecommendations: number;
    recommendations: number;
  };
  errors: Array<{ scope: string; message: string }>;
}

/**
 * Daily ecosystem intelligence snapshot job (stub).
 *
 * Production path (not deployed here):
 * 1. Load opportunities, artists, fans, communities, cities from CRM + community warehouse
 * 2. Run all Phase 5 calculators
 * 3. Persist OpportunityScore, LeadScore, SuggestedOpportunity, health/fan/community snapshots, city recs
 * 4. Emit recommendation candidates via separate pipeline
 */
export async function runIntelligenceSnapshotJob(
  options: RunIntelligenceSnapshotJobOptions,
): Promise<IntelligenceSnapshotJobResult> {
  const snapshotDate = toSnapshotDateOnly(options.snapshotDate ?? new Date());
  const dryRun = options.dryRun ?? false;

  const opportunities = options.opportunities ?? [];
  const leadScores = options.leadScores ?? [];
  const artists = options.artists ?? [];
  const fans = options.fans ?? [];
  const communities = options.communities ?? [];
  const cities = options.cities ?? [];
  const recommendations = options.recommendations ?? [];

  const result: IntelligenceSnapshotJobResult = {
    snapshotDate,
    processed: 0,
    succeeded: 0,
    failed: 0,
    dryRun,
    counts: {
      opportunities: 0,
      leadScores: 0,
      suggestedOpportunities: 0,
      artistHealth: 0,
      fanIntelligence: 0,
      communityIntelligence: 0,
      cityIntelligence: 0,
      cityRecommendations: 0,
      recommendations: 0,
    },
    errors: [],
  };

  const track = async (scope: string, fn: () => Promise<unknown>): Promise<void> => {
    result.processed += 1;
    try {
      if (!dryRun) {
        await fn();
      }
      result.succeeded += 1;
    } catch (error) {
      result.failed += 1;
      result.errors.push({
        scope,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };

  for (const input of opportunities) {
    const scored = calculateOpportunityScore(input);
    result.counts.opportunities += 1;
    await track(`opportunity:${input.opportunityId}`, () =>
      createOpportunityScore({ prisma: options.prisma, result: scored }),
    );
  }

  for (const lead of leadScores) {
    const scored = calculateOpportunityScore(lead.input);
    result.counts.leadScores += 1;
    await track(`lead:${lead.personId}`, () =>
      createLeadScore({
        prisma: options.prisma,
        personId: lead.personId,
        result: scored,
        opportunityId: lead.input.opportunityId,
      }),
    );
  }

  for (const artist of artists) {
    const health = calculateArtistHealth(artist.healthInput);
    result.counts.artistHealth += 1;
    await track(`artist-health:${artist.artistId}`, () =>
      createArtistHealthSnapshot({
        prisma: options.prisma,
        result: health,
        snapshotDate,
      }),
    );

    const gaps = detectSuggestedOpportunities(artist.cityGaps ?? []);
    for (const draft of gaps) {
      result.counts.suggestedOpportunities += 1;
      await track(`suggested:${artist.artistId}:${draft.metadata?.city ?? "unknown"}`, () =>
        upsertSuggestedOpportunity({ prisma: options.prisma, draft }),
      );
    }
  }

  for (const fan of fans) {
    const scores = calculateFanIntelligence(fan.signals);
    result.counts.fanIntelligence += 1;
    await track(`fan:${fan.personId}:${fan.artistId ?? "global"}`, () =>
      createFanIntelligenceSnapshot({
        prisma: options.prisma,
        personId: fan.personId,
        artistId: fan.artistId ?? null,
        scores,
        snapshotDate,
        metadata: { signals: fan.signals as AudienceIntelligenceInput },
      }),
    );
  }

  for (const community of communities) {
    const intel = calculateCommunityIntelligence(community.signals);
    result.counts.communityIntelligence += 1;
    await track(`community:${community.communityId}`, () =>
      createCommunityIntelligenceSnapshot({
        prisma: options.prisma,
        result: intel,
        snapshotDate,
      }),
    );
  }

  for (const cityInput of cities) {
    const cityResult = calculateEcosystemCityIntelligence(cityInput);
    result.counts.cityIntelligence += 1;
    await track(`city:${cityInput.city}`, async () => {
      await createCityIntelligenceSnapshot({
        prisma: options.prisma,
        city: cityInput.city,
        metrics: cityResult.metrics,
        snapshotDate,
      });
      for (const rec of cityResult.recommendations) {
        result.counts.cityRecommendations += 1;
        await createCityRecommendation({ prisma: options.prisma, draft: rec });
      }
    });
  }

  for (const recInput of recommendations) {
    const scored = generateRecommendations(recInput);
    result.counts.recommendations += scored.length;
    await track(`recommendations:${recInput.personId}`, async () => {
      // RecommendationCandidate persist deferred — job returns computed rows only in dryRun path
      if (scored.length === 0) return;
    });
  }

  return result;
}

export {
  calculateArtistHealth,
  calculateCommunityIntelligence,
  calculateEcosystemCityIntelligence,
  calculateFanIntelligence,
  calculateOpportunityScore,
  detectSuggestedOpportunities,
  generateRecommendations,
};
