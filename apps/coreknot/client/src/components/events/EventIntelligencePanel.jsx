import React, { useCallback, useEffect, useState } from 'react';
import { BarChart3, MapPin, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import {
  fetchEventIntelligence,
  fetchEventIntelligencePredict,
  fetchEventIntelligenceRecommendations,
  formatInr,
  formatPercent,
  refreshEventIntelligence,
} from '../../lib/eventIntelligenceApi';

function MetricCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="rounded-lg border border-[var(--color-bg-border)] p-3 space-y-1">
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
        {Icon ? <Icon size={14} /> : null}
        <span>{label}</span>
      </div>
      <p className="text-lg font-semibold text-[var(--color-text-primary)]">{value}</p>
      {sub ? <p className="text-xs text-[var(--color-text-muted)]">{sub}</p> : null}
    </div>
  );
}

export default function EventIntelligencePanel({ eventId, showAdminRefresh = false }) {
  const [snapshot, setSnapshot] = useState(null);
  const [predict, setPredict] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const [intel, forecast, recs] = await Promise.all([
        fetchEventIntelligence(eventId),
        fetchEventIntelligencePredict(eventId),
        fetchEventIntelligenceRecommendations(eventId),
      ]);
      setSnapshot(intel);
      setPredict(forecast);
      setRecommendations(recs);
    } catch {
      setError('Event intelligence unavailable');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const refreshed = await refreshEventIntelligence(eventId);
      setSnapshot(refreshed);
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  if (!eventId) {
    return (
      <section className="rounded-xl border border-[var(--color-bg-border)] p-5">
        <p className="text-sm text-[var(--color-text-muted)]">Select an event to view intelligence.</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 flex justify-center py-10">
        <Spinner size={24} />
      </section>
    );
  }

  if (error || !snapshot) {
    return (
      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-2">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Event intelligence</h2>
        <p className="text-sm text-[var(--color-text-muted)]">{error ?? 'No data'}</p>
      </section>
    );
  }

  const topCities = Object.entries(snapshot.fanDensityByCity ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Event intelligence</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Attendance, conversion, and growth from participation + support data.
          </p>
        </div>
        {showAdminRefresh ? (
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] hover:bg-[var(--token-surface-2)] disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Refresh snapshot
          </button>
        ) : null}
      </div>

      {snapshot._source === 'mock' && (
        <p className="text-xs text-amber-600 dark:text-amber-400">Sample event intelligence (offline mock).</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Attendance"
          value={snapshot.actualAttendance ?? 0}
          sub={predict ? `Forecast ${predict.predictedAttendance}` : null}
          icon={Users}
        />
        <MetricCard
          label="Conversion"
          value={formatPercent(snapshot.conversionRate)}
          sub="Check-ins / registrants"
          icon={BarChart3}
        />
        <MetricCard
          label="Revenue stub"
          value={formatInr(snapshot.actualRevenueStub)}
          sub={predict ? `Forecast ${formatInr(predict.predictedRevenueStub)}` : null}
          icon={TrendingUp}
        />
        <MetricCard
          label="Audience growth"
          value={formatPercent(snapshot.audienceGrowthImpact)}
          sub={`Community +${formatPercent(snapshot.communityImpact)}`}
          icon={TrendingUp}
        />
      </div>

      {topCities.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            <MapPin size={14} />
            Fan density by city
          </div>
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {topCities.map(([city, count]) => (
              <li
                key={city}
                className="text-xs flex justify-between rounded-md border border-[var(--color-bg-border)] px-2 py-1.5"
              >
                <span>{city}</span>
                <span className="font-mono text-[var(--color-text-muted)]">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {recommendations ? (
        <div className="space-y-2 pt-2 border-t border-[var(--color-bg-border)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Recommendations (graph stub)
          </p>
          <div className="grid md:grid-cols-3 gap-3 text-xs">
            {['cities', 'venues', 'partners'].map((kind) => (
              <div key={kind} className="rounded-lg border border-[var(--color-bg-border)] p-2 space-y-1">
                <p className="font-medium capitalize text-[var(--color-text-primary)]">{kind}</p>
                {(recommendations[kind] ?? []).slice(0, 3).map((item) => (
                  <p key={item.entityId} className="text-[var(--color-text-muted)] truncate">
                    {item.title}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
