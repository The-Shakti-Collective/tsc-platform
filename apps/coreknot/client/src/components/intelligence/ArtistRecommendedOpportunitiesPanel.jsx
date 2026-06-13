import React from 'react';
import { Link } from 'react-router-dom';
import { Target } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import TrustBadge from '../trust/TrustBadge';
import { useArtistRecommendedOpportunities } from '../../hooks/queries/trust';

function formatCurrency(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * V2 upgrade — artist "Recommended For You" with trust-weighted brand scores.
 */
export default function ArtistRecommendedOpportunitiesPanel({ artistId, limit = 10, compact = false }) {
  const { data, isLoading, isError } = useArtistRecommendedOpportunities(artistId, limit);

  if (!artistId) {
    return (
      <section className="rounded-xl border border-[var(--color-bg-border)] p-4 text-xs text-[var(--color-text-muted)]">
        Artist context required for recommendations.
      </section>
    );
  }

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
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Recommended for you</h2>
        <p className="text-sm text-[var(--color-text-muted)]">Opportunity recommendations unavailable.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <Target size={16} className="text-[var(--color-brand-primary)]" />
            Recommended for you
          </h2>
          {!compact && (
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              V2 match — opportunity fit + brand trust signals.
            </p>
          )}
        </div>
        <Link
          to="/operating/opportunities/marketplace"
          className="text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)]"
        >
          Marketplace →
        </Link>
      </div>

      {data._source === 'mock' && (
        <p className="text-xs text-amber-600 dark:text-amber-400">Sample recommendations.</p>
      )}

      {(data.items ?? []).length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)]">No matching opportunities right now.</p>
      ) : (
        <ul className="divide-y divide-[var(--color-bg-border)] rounded-lg border border-[var(--color-bg-border)]">
          {data.items.map((item) => (
            <li key={item.opportunityId} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="min-w-0 flex-1">
                <Link
                  to={`/operating/opportunities/marketplace/${item.opportunityId}`}
                  className="text-sm font-medium text-[var(--color-brand-primary)] hover:underline truncate block"
                >
                  {item.title}
                </Link>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {item.listingType ?? 'listing'} · {item.city ?? 'Any city'} · {formatCurrency(item.budget)}
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
              <div className="flex flex-wrap items-center gap-3 text-xs shrink-0">
                <TrustBadge trustScore={item.brandTrustScore} compact showScore />
                <span>
                  Score <strong>{Math.round(item.score)}</strong>
                </span>
                <span className="text-[var(--color-text-muted)]">{Math.round(item.confidence)}% conf</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
