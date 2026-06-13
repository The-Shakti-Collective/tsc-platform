/** Phase 8 Step 7 — Event Intelligence rule-based aggregates (no ML). */

export const EVENT_INTELLIGENCE_MODELS = ['EventIntelligenceSnapshot'] as const;

export type EventIntelligenceModel = (typeof EVENT_INTELLIGENCE_MODELS)[number];

/** Post-event follow/join attribution window (days after event start). */
export const EVENT_INTELLIGENCE_POST_WINDOW_DAYS = 7;

/** Default venue capacity when none configured. */
export const DEFAULT_VENUE_CAPACITY = 300;

/** Stub ticket price (INR) when SupportAction amount is omitted. */
export const DEFAULT_TICKET_STUB_PRICE = 500;

/** Stub membership monthly price (INR) for revenue forecast. */
export const DEFAULT_MEMBERSHIP_STUB_PRICE = 199;

export interface EventPredictionInput {
  venueCapacity: number;
  artistFanCount: number;
  communityMemberCount: number;
  cityHistoricalAvgAttendance: number;
  currentRegistrations: number;
}

export interface EventPredictionResult {
  predictedAttendance: number;
  predictedRevenueStub: number;
  factors: Record<string, number>;
}

export interface EventAnalysisInput {
  registeredCount: number;
  checkedInCount: number;
  newArtistFollows: number;
  newPersonFollows: number;
  communityJoinsPostEvent: number;
  ticketSupportCount: number;
  ticketSupportAmount: number;
  membershipSupportAmount: number;
  participantCities: Record<string, number>;
}

export interface EventAnalysisResult {
  actualAttendance: number;
  actualRevenueStub: number;
  conversionRate: number;
  audienceGrowthImpact: number;
  communityImpact: number;
  fanDensityByCity: Record<string, number>;
  metrics: Record<string, unknown>;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Pre-event attendance forecast from venue capacity, fan base, community size, city history.
 */
export function predictAttendance(input: EventPredictionInput): number {
  const capacity = Math.max(1, input.venueCapacity);
  const fanFactor = 1 + Math.min(input.artistFanCount / 500, 0.5);
  const communityFactor = 1 + Math.min(input.communityMemberCount / 200, 0.3);
  const cityFactor = 1 + Math.min(input.cityHistoricalAvgAttendance / 200, 0.2);
  const base = capacity * 0.4;
  const predicted = base * fanFactor * communityFactor * cityFactor;
  const withMomentum = Math.max(predicted, input.currentRegistrations * 1.15);
  return round2(clamp(withMomentum, 0, capacity));
}

/**
 * Pre-event revenue stub from ticket support actions + membership-linked support.
 */
export function predictRevenueStub(
  ticketSupportCount: number,
  ticketSupportAmount: number,
  membershipSupportAmount: number,
  predictedAttendance: number,
): number {
  const ticketRevenue =
    ticketSupportAmount > 0
      ? ticketSupportAmount
      : ticketSupportCount * DEFAULT_TICKET_STUB_PRICE;
  const fillRevenue = Math.max(0, predictedAttendance - ticketSupportCount) * DEFAULT_TICKET_STUB_PRICE * 0.35;
  const membershipRevenue =
    membershipSupportAmount > 0
      ? membershipSupportAmount
      : membershipSupportAmount === 0 && ticketSupportCount > 0
        ? DEFAULT_MEMBERSHIP_STUB_PRICE * 0.2
        : 0;
  return round2(ticketRevenue + fillRevenue + membershipRevenue);
}

export function computeEventPrediction(input: EventPredictionInput & {
  ticketSupportCount: number;
  ticketSupportAmount: number;
  membershipSupportAmount: number;
}): EventPredictionResult {
  const predictedAttendance = predictAttendance(input);
  const predictedRevenueStub = predictRevenueStub(
    input.ticketSupportCount,
    input.ticketSupportAmount,
    input.membershipSupportAmount,
    predictedAttendance,
  );

  return {
    predictedAttendance,
    predictedRevenueStub,
    factors: {
      venueCapacity: input.venueCapacity,
      artistFanCount: input.artistFanCount,
      communityMemberCount: input.communityMemberCount,
      cityHistoricalAvgAttendance: input.cityHistoricalAvgAttendance,
      currentRegistrations: input.currentRegistrations,
    },
  };
}

/** Post-event conversion: checked-in / registered (excludes cancelled). */
export function analyzeConversion(registeredCount: number, checkedInCount: number): number {
  if (registeredCount <= 0) return 0;
  return round2((checkedInCount / registeredCount) * 100);
}

/** Audience growth impact from new follows in post-event window. */
export function analyzeAudienceGrowth(
  newArtistFollows: number,
  newPersonFollows: number,
  checkedInCount: number,
): number {
  const followScore = newArtistFollows * 2 + newPersonFollows;
  const base = checkedInCount > 0 ? (followScore / checkedInCount) * 100 : followScore * 5;
  return round2(clamp(base, 0, 100));
}

/** Community member joins attributed to post-event window. */
export function analyzeCommunityImpact(
  communityJoinsPostEvent: number,
  checkedInCount: number,
): number {
  if (checkedInCount <= 0) return round2(communityJoinsPostEvent * 10);
  return round2(clamp((communityJoinsPostEvent / checkedInCount) * 100, 0, 100));
}

export function computeEventAnalysis(input: EventAnalysisInput): EventAnalysisResult {
  const actualAttendance = input.checkedInCount;
  const conversionRate = analyzeConversion(input.registeredCount, input.checkedInCount);
  const audienceGrowthImpact = analyzeAudienceGrowth(
    input.newArtistFollows,
    input.newPersonFollows,
    input.checkedInCount,
  );
  const communityImpact = analyzeCommunityImpact(
    input.communityJoinsPostEvent,
    input.checkedInCount,
  );
  const actualRevenueStub = round2(
    (input.ticketSupportAmount > 0
      ? input.ticketSupportAmount
      : input.ticketSupportCount * DEFAULT_TICKET_STUB_PRICE) + input.membershipSupportAmount,
  );

  return {
    actualAttendance,
    actualRevenueStub,
    conversionRate,
    audienceGrowthImpact,
    communityImpact,
    fanDensityByCity: input.participantCities,
    metrics: {
      registeredCount: input.registeredCount,
      checkedInCount: input.checkedInCount,
      newArtistFollows: input.newArtistFollows,
      newPersonFollows: input.newPersonFollows,
      communityJoinsPostEvent: input.communityJoinsPostEvent,
      ticketSupportCount: input.ticketSupportCount,
      postWindowDays: EVENT_INTELLIGENCE_POST_WINDOW_DAYS,
    },
  };
}
