import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Info,
  LineChart,
  Play,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import {
  FORECAST_METRIC_LABELS,
  INSIGHT_SEVERITY_STYLES,
  executeInsightAction,
  fetchInsightsFeed,
  fetchPlatformForecastRollup,
  runForecastAgent,
} from '../../lib/forecastApi';

function formatForecastValue(metric, value) {
  if (value == null) return '—';
  if (metric === 'revenue') {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${Math.round(value).toLocaleString()}`;
  }
  if (metric === 'growth' || metric === 'membership_churn') {
    return `${value.toFixed(1)}%`;
  }
  if (metric === 'demand') {
    return `${Math.round(value)} apps`;
  }
  return Math.round(value).toLocaleString();
}

function ForecastMetricCard({ rollup }) {
  const snap30 = rollup.horizon30;
  const snap90 = rollup.horizon90;

  return (
    <div className="rounded-lg border border-[var(--color-bg-border)] p-3 space-y-2">
      <p className="text-xs font-medium text-[var(--color-text-primary)]">{rollup.label}</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-[var(--color-text-muted)]">30d</p>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            {formatForecastValue(rollup.metric, snap30?.predictedValue)}
          </p>
          {snap30 && (
            <p className="text-[10px] text-[var(--color-text-muted)]">
              {formatForecastValue(rollup.metric, snap30.lowerBound)} –{' '}
              {formatForecastValue(rollup.metric, snap30.upperBound)}
            </p>
          )}
        </div>
        <div>
          <p className="text-[10px] text-[var(--color-text-muted)]">90d</p>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            {formatForecastValue(rollup.metric, snap90?.predictedValue)}
          </p>
          {snap90 && (
            <p className="text-[10px] text-[var(--color-text-muted)]">
              {formatForecastValue(rollup.metric, snap90.lowerBound)} –{' '}
              {formatForecastValue(rollup.metric, snap90.upperBound)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function InsightCard({ insight, onAction, pendingAction }) {
  const styles = INSIGHT_SEVERITY_STYLES[insight.severity] ?? INSIGHT_SEVERITY_STYLES.info;
  const Icon =
    insight.severity === 'critical'
      ? AlertTriangle
      : insight.severity === 'warning'
        ? AlertTriangle
        : Info;

  return (
    <div
      className={`rounded-lg border p-3 space-y-2 ${styles.border}`}
      style={{ backgroundColor: styles.bg }}
    >
      <div className="flex items-start gap-2">
        <Icon size={14} className={`shrink-0 mt-0.5 ${styles.text}`} />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">{insight.title}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${styles.badge}`}>
              {insight.severity}
            </span>
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)] capitalize">
            {insight.category.replace(/_/g, ' ')}
          </p>
        </div>
      </div>
      {(insight.actions ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {insight.actions.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={action.status === 'executed' || pendingAction === action.actionType}
              onClick={() => onAction(insight.id, action.actionType)}
              className="text-[10px] px-2 py-1 rounded border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)] disabled:opacity-50"
            >
              {pendingAction === action.actionType ? (
                <Spinner size={10} />
              ) : action.status === 'executed' ? (
                'Done'
              ) : (
                action.actionType.replace(/_/g, ' ')
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ForecastPanel() {
  const [rollup, setRollup] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [notice, setNotice] = useState(null);
  const [source, setSource] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rollupData, insightsData] = await Promise.all([
        fetchPlatformForecastRollup(),
        fetchInsightsFeed({ limit: 6 }),
      ]);
      setRollup(rollupData);
      setInsights(insightsData.items ?? []);
      setSource(rollupData._source === 'mock' || insightsData._source === 'mock' ? 'mock' : 'api');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRun() {
    setRunning(true);
    setNotice(null);
    try {
      const result = await runForecastAgent();
      setNotice(
        `Generated ${result.forecastsCreated ?? 0} forecasts · ${result.insightsCreated ?? 0} insights`,
      );
      await load();
    } catch (err) {
      setNotice(err?.message ?? 'Forecast run failed');
    } finally {
      setRunning(false);
    }
  }

  async function handleInsightAction(insightId, actionType) {
    setPendingAction(actionType);
    setNotice(null);
    try {
      const result = await executeInsightAction(insightId, actionType);
      setNotice(result.executedStub ?? 'Action executed (stub)');
      setInsights((prev) =>
        prev.map((item) =>
          item.id === insightId
            ? {
                ...item,
                actions: (item.actions ?? []).map((action) =>
                  action.actionType === actionType
                    ? { ...action, status: 'executed' }
                    : action,
                ),
              }
            : item,
        ),
      );
    } catch (err) {
      setNotice(err?.message ?? 'Action failed');
    } finally {
      setPendingAction(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size={24} />
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <LineChart size={16} className="text-[var(--color-brand-primary)]" />
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Ecosystem Forecasting
            </h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--token-surface-2)] text-[var(--color-text-muted)]">
              Module 7
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] max-w-2xl">
            Linear run-rate projections from deal pipeline, event attendance, audience growth,
            marketplace demand, and membership churn — Command Center V5 prep stub.
          </p>
          {source === 'mock' && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Sample forecasts — live when @tsc/api is reachable.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)] disabled:opacity-60"
        >
          {running ? <Spinner size={12} /> : <Play size={12} />}
          Run forecast agent
        </button>
      </div>

      {notice && (
        <p className="text-xs text-[var(--color-text-muted)] border border-[var(--color-bg-border)] rounded-md px-3 py-2">
          {notice}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-[var(--color-text-muted)]" />
            <h3 className="text-xs font-semibold text-[var(--color-text-primary)]">
              Platform rollups
            </h3>
            {rollup?.lastRunAt && (
              <span className="text-[10px] text-[var(--color-text-muted)]">
                Last run {new Date(rollup.lastRunAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {(rollup?.rollups ?? []).map((row) => (
              <ForecastMetricCard key={row.metric} rollup={row} />
            ))}
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)]">
            ±15% confidence bands · linear_run_rate_v1 · last 30d baseline
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-[var(--color-text-muted)]" />
            <h3 className="text-xs font-semibold text-[var(--color-text-primary)]">
              Forecast insights
            </h3>
          </div>
          {insights.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">No insights yet — run forecast agent.</p>
          ) : (
            <div className="space-y-2">
              {insights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onAction={handleInsightAction}
                  pendingAction={pendingAction}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-[var(--color-bg-border)] p-3 flex items-center gap-2 text-[10px] text-[var(--color-text-muted)]">
        <TrendingUp size={12} />
        Command Center V5 full forecasting UI deferred — this panel is the Step 7 integration stub.
      </div>
    </section>
  );
}

export { FORECAST_METRIC_LABELS, INSIGHT_SEVERITY_STYLES };
