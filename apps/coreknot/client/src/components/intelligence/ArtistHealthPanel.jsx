import React from 'react';
import { Activity, AlertTriangle } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import { useArtistHealth } from '../../hooks/queries/intelligence';

const SEVERITY_STYLES = {
  high: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20',
  medium: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
  low: 'text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20',
};

function scoreColor(score, maxScore) {
  const pct = (score / maxScore) * 100;
  if (pct >= 85) return '#34d399';
  if (pct >= 70) return '#facc15';
  return '#fb7185';
}

export default function ArtistHealthPanel({ artistId }) {
  const { data, isLoading, isError } = useArtistHealth(artistId);

  if (isLoading) {
    return (
      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 flex justify-center py-8">
        <Spinner size={24} />
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-2">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Artist health</h2>
        <p className="text-sm text-[var(--color-text-muted)]">Health score unavailable for this artist.</p>
      </section>
    );
  }

  const maxScore = data.maxScore ?? 100;
  const color = scoreColor(data.score, maxScore);

  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Artist health</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Engagement, revenue, content, community composite.</p>
        </div>
        {data._source === 'mock' && (
          <span className="text-xs text-amber-600 dark:text-amber-400">Sample data</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-full border-4"
            style={{ borderColor: color }}
          >
            <Activity size={22} style={{ color }} />
          </div>
          <div>
            <p className="text-3xl font-bold text-[var(--color-text-primary)]">
              {data.score}
              <span className="text-lg text-[var(--color-text-muted)] font-normal">/{maxScore}</span>
            </p>
            <p className="text-sm text-[var(--color-text-muted)] capitalize">{data.label}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(data.dimensions ?? []).map((dim) => (
            <span
              key={dim.key}
              className="text-xs px-2 py-1 rounded-md border border-[var(--color-bg-border)] text-[var(--color-text-muted)]"
            >
              {dim.label}: {dim.score}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] flex items-center gap-1.5">
          <AlertTriangle size={12} />
          Risk alerts
        </h3>
        {(data.riskAlerts ?? []).length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No active risk alerts.</p>
        ) : (
          <ul className="space-y-2">
            {data.riskAlerts.map((alert) => (
              <li
                key={alert.id}
                className={`text-sm px-3 py-2 rounded-lg border ${SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.low}`}
              >
                <span className="font-medium capitalize">{alert.category}</span>
                {' — '}
                {alert.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
