/** Phase 9 Step 7 — Ecosystem Forecasting linear run-rate projections (no ML). */

export const FORECAST_METRICS = [
  'revenue',
  'attendance',
  'growth',
  'demand',
  'membership_churn',
] as const;

export type ForecastMetricValue = (typeof FORECAST_METRICS)[number];

export const FORECAST_HORIZONS = ['d30', 'd90'] as const;

export type ForecastHorizonValue = (typeof FORECAST_HORIZONS)[number];

export const FORECAST_MODEL_VERSION = 'linear_run_rate_v1' as const;

/** Baseline window for run-rate (days). */
export const FORECAST_PERIOD_DAYS = 30;

/** Confidence band width (±15%). */
export const FORECAST_CONFIDENCE_BAND = 0.15;

export const FORECAST_AGENT_SLUG = 'forecast-agent';

export const INSIGHT_SEVERITIES = ['info', 'warning', 'critical'] as const;

export type InsightSeverityValue = (typeof INSIGHT_SEVERITIES)[number];

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Symmetric confidence band around a point estimate. */
export function computeConfidenceBounds(predictedValue: number): {
  lowerBound: number;
  upperBound: number;
} {
  const band = Math.abs(predictedValue) * FORECAST_CONFIDENCE_BAND;
  return {
    lowerBound: round2(Math.max(0, predictedValue - band)),
    upperBound: round2(predictedValue + band),
  };
}

/**
 * Linear run-rate: last-30d baseline projected forward.
 * d30 → one baseline period; d90 → three baseline periods.
 */
export function projectRunRate(
  baseline30d: number,
  horizon: ForecastHorizonValue,
): number {
  if (horizon === 'd90') return round2(baseline30d * 3);
  return round2(baseline30d);
}

/** Rate metrics (growth %, churn %) — horizon does not multiply the rate. */
export function projectRateMetric(
  baselineRate: number,
  _horizon: ForecastHorizonValue,
): number {
  return round2(baselineRate);
}

/** Membership churn stub: cancellations / (active + cancelled) in window. */
export function computeMembershipChurnRateStub(
  cancellations: number,
  activeCount: number,
): number {
  const denominator = activeCount + cancellations;
  if (denominator <= 0) return 0;
  return round2((cancellations / denominator) * 100);
}

export const FORECAST_METRIC_LABELS: Record<ForecastMetricValue, string> = {
  revenue: 'Revenue',
  attendance: 'Attendance',
  growth: 'Audience growth',
  demand: 'Marketplace demand',
  membership_churn: 'Membership churn',
};
