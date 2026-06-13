import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import TrustBadge from '../trust/TrustBadge';
import { useBrandMatch } from '../../hooks/queries/trust';

function formatCurrency(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function BrandMatchResultsPanel({ brandId, genre, city, budget, audienceAge }) {
  const enabled = !!brandId;
  const { data, isLoading, isError } = useBrandMatch(
    { brandId, genre, city, budget, audienceAge },
    enabled,
  );

  if (!enabled) {
    return (
      <section className="rounded-xl border border-[var(--color-bg-border)] p-4 text-xs text-[var(--color-text-muted)]">
        Select a brand to run campaign matching.
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="rounded-xl border border-[var(--color-bg-border)] p-6 flex justify-center">
        <Spinner size={24} />
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="rounded-xl border border-[var(--color-bg-border)] p-4 space-y-2">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Brand match</h2>
        <p className="text-xs text-[var(--color-text-muted)]">Campaign matching unavailable.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--color-brand-primary)]" />
            Brand campaign match
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Ranked artists — genre, city, budget, trust-weighted confidence.
          </p>
        </div>
        {data._source === 'mock' && (
          <span className="text-[10px] uppercase text-amber-600 dark:text-amber-400">Sample</span>
        )}
      </div>

      {(data.items ?? []).length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)]">No artist matches for criteria.</p>
      ) : (
        <ul className="divide-y divide-[var(--color-bg-border)] rounded-lg border border-[var(--color-bg-border)]">
          {data.items.map((item, index) => (
            <li key={item.artistId} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-xs font-mono text-[var(--color-text-muted)] w-5 shrink-0">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {item.artistName ?? item.artistId}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {item.city ?? 'City n/a'} · {item.genres?.slice(0, 2).join(', ') || 'Genre n/a'}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(item.reasonCodes ?? []).slice(0, 3).map((code) => (
                      <span
                        key={code}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--token-surface-2)] text-[var(--color-text-muted)]"
                      >
                        {code.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 shrink-0 text-xs">
                <TrustBadge trustScore={item.trustScore} compact showScore />
                <span className="text-[var(--color-text-muted)]">
                  Match <strong className="text-[var(--color-text-primary)]">{Math.round(item.score)}</strong>
                </span>
                <span className="text-[var(--color-text-muted)]">
                  Conf <strong>{Math.round(item.confidence)}%</strong>
                </span>
                {item.slug && (
                  <Link
                    to={`/passport/${item.slug}`}
                    className="text-[var(--color-brand-primary)] hover:underline"
                  >
                    Passport →
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {data.criteria?.budget != null && (
        <p className="text-[10px] text-[var(--color-text-muted)]">
          Budget target: {formatCurrency(data.criteria.budget)}
        </p>
      )}
    </section>
  );
}
