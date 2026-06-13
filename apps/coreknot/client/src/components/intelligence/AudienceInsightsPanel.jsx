import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Heart, TrendingUp, Users } from 'lucide-react';
import { fetchArtistAudienceHealth } from '../../lib/audienceApi';
import { Spinner } from '../ui/Spinner';

function MetricTile({ label, value, suffix, icon: Icon, accent }) {
  return (
    <div className="rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 space-y-2">
      <div className="flex items-center gap-2">
        {Icon && (
          <div
            className="flex items-center justify-center w-7 h-7 rounded-md shrink-0"
            style={{ backgroundColor: accent }}
          >
            <Icon size={14} />
          </div>
        )}
        <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      </div>
      <p className="text-xl font-semibold text-[var(--color-text-primary)]">
        {value?.toLocaleString?.() ?? value}
        {suffix && <span className="text-sm font-normal text-[var(--color-text-muted)] ml-1">{suffix}</span>}
      </p>
    </div>
  );
}

/**
 * Artist audience health — growth, retention, LTV stub (Phase 8 Step 5).
 */
export default function AudienceInsightsPanel({ artistId }) {
  const query = useQuery({
    queryKey: ['audience', 'artist-health', artistId],
    queryFn: () => fetchArtistAudienceHealth(artistId),
    enabled: !!artistId,
  });

  if (query.isLoading) {
    return (
      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 flex justify-center py-8">
        <Spinner size={24} />
      </section>
    );
  }

  const data = query.data;
  const isMock = data?._source === 'mock';

  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <BarChart3 size={16} />
            Audience insights
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Rule-based audience health — growth, retention, conversion, LTV stub.
          </p>
        </div>
        {isMock && (
          <span className="text-xs text-amber-600 dark:text-amber-400">Sample data</span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="Audience growth"
          value={data?.audienceGrowth}
          suffix="%"
          icon={TrendingUp}
          accent="rgba(52, 211, 153, 0.16)"
        />
        <MetricTile
          label="Fan retention"
          value={data?.fanRetention}
          suffix="%"
          icon={Heart}
          accent="rgba(244, 114, 182, 0.16)"
        />
        <MetricTile
          label="Fan conversion"
          value={data?.fanConversion}
          suffix="%"
          icon={Users}
          accent="rgba(96, 165, 250, 0.16)"
        />
        <MetricTile
          label="LTV stub"
          value={data?.lifetimeValueStub}
          suffix="INR"
          icon={BarChart3}
          accent="rgba(251, 191, 36, 0.16)"
        />
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-[var(--color-text-muted)]">
        <span>Churn risk: {data?.audienceChurn ?? '—'}%</span>
        {data?.snapshotDate && (
          <span>Snapshot: {new Date(data.snapshotDate).toLocaleDateString()}</span>
        )}
        {data?.metrics?.totalFollowers != null && (
          <span>{data.metrics.totalFollowers.toLocaleString()} followers</span>
        )}
      </div>
    </section>
  );
}
