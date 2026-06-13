import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Flame, MapPin, Music2, TrendingUp } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import {
  SUGGESTED_TYPE_LABELS,
  fetchOpportunityGenerationSignals,
} from '../../lib/opportunityGenerationApi';

function SignalRow({ signal }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-[var(--color-bg-border)] last:border-0">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 font-medium">
            {SUGGESTED_TYPE_LABELS[signal.suggestedType] ?? signal.suggestedType}
          </span>
          {signal.audienceGrowth != null && (
            <span className="text-[10px] text-emerald-400 font-mono inline-flex items-center gap-0.5">
              <TrendingUp size={10} />
              +{Math.round(signal.audienceGrowth)}%
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{signal.label}</p>
        <p className="text-[10px] text-[var(--color-text-muted)] flex flex-wrap gap-2">
          {signal.city && (
            <span className="inline-flex items-center gap-0.5">
              <MapPin size={10} />
              {signal.city}
            </span>
          )}
          {signal.genre && (
            <span className="inline-flex items-center gap-0.5">
              <Music2 size={10} />
              {signal.genre}
            </span>
          )}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
          {Math.round(signal.confidence * 100)}%
        </p>
        <p className="text-[10px] text-[var(--color-text-muted)]">conf.</p>
      </div>
    </div>
  );
}

export default function HotSignalsPanel({ limit = 5, compact = false }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['opportunity-generation', 'signals', limit],
    queryFn: () => fetchOpportunityGenerationSignals(limit),
    staleTime: 60_000,
  });

  const items = data?.items ?? [];

  return (
    <section
      className={`rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] ${compact ? 'p-4 space-y-3' : 'p-5 space-y-4'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
            style={{ backgroundColor: 'rgba(251, 146, 60, 0.15)', color: '#fb923c' }}
          >
            <Flame size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Hot signals</h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Intelligence patterns feeding opportunity drafts
            </p>
          </div>
        </div>
        <Link
          to="/operating/opportunity-generation"
          className="text-xs text-[var(--color-brand-primary)] hover:underline shrink-0"
        >
          Queue →
        </Link>
      </div>

      {isLoading && (
        <div className="flex justify-center py-6">
          <Spinner size={16} />
        </div>
      )}

      {isError && !isLoading && (
        <p className="text-xs text-[var(--color-text-muted)]">Hot signals unavailable — showing stub feed.</p>
      )}

      {!isLoading && items.length === 0 && (
        <p className="text-xs text-[var(--color-text-muted)] py-2">No hot signals right now. Run a generation scan.</p>
      )}

      {items.length > 0 && (
        <div>
          {items.slice(0, limit).map((signal) => (
            <SignalRow key={signal.id} signal={signal} />
          ))}
        </div>
      )}

      {data?._source === 'mock' && (
        <p className="text-[10px] text-[var(--color-text-muted)]">Mock feed (Mumbai Hip-Hop showcase example)</p>
      )}
    </section>
  );
}
