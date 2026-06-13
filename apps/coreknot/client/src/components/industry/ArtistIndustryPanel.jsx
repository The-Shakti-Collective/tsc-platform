import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ShieldCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '../ui/Spinner';
import { fetchArtistDeals, DEAL_STATUS_LABELS } from '../../lib/dealApi';
import { fetchVerificationBadges } from '../../lib/identityNetworkApi';

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export default function ArtistIndustryPanel({ artistId }) {
  const badgesQuery = useQuery({
    queryKey: ['identity', 'badges', 'artist', artistId],
    queryFn: () => fetchVerificationBadges('artist', artistId),
    enabled: !!artistId,
  });

  const dealsQuery = useQuery({
    queryKey: ['deals', 'artist', artistId],
    queryFn: () => fetchArtistDeals(artistId),
    enabled: !!artistId,
  });

  const isLoading = badgesQuery.isLoading || dealsQuery.isLoading;

  if (isLoading) {
    return (
      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 flex justify-center py-8">
        <Spinner size={24} />
      </section>
    );
  }

  const badges = normalizeList(badgesQuery.data);
  const deals = normalizeList(dealsQuery.data);
  const activeDeals = deals.filter((deal) => !['cancelled', 'paid'].includes(deal.status));

  if (badgesQuery.isError && dealsQuery.isError) {
    return (
      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-2">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Industry relationships</h2>
        <p className="text-sm text-[var(--color-text-muted)]">Industry data unavailable for this artist.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Industry relationships</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Verified badges, brand deals, and label partnerships.
          </p>
        </div>
        <Link
          to="/brands"
          className="text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)]"
        >
          Browse brands →
        </Link>
      </div>

      {badges.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Verification</p>
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <span
                key={badge.id ?? badge.label ?? badge.type}
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-[var(--color-bg-border)] text-[var(--color-text-primary)]"
              >
                <ShieldCheck size={12} className="text-[var(--color-brand-primary)]" />
                {badge.label ?? badge.type ?? 'Verified'}
              </span>
            ))}
          </div>
        </div>
      )}

      {activeDeals.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Active deals</p>
          <ul className="divide-y divide-[var(--color-bg-border)]">
            {activeDeals.slice(0, 5).map((deal) => (
              <li key={deal.id} className="flex items-start justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {deal.title ?? deal.counterpartyName ?? deal.brandName ?? 'Deal'}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] capitalize">
                    {DEAL_STATUS_LABELS[deal.status] ?? deal.status ?? 'Open'}
                  </p>
                </div>
                {deal.id && (
                  <Link
                    to={`/deals/${deal.id}`}
                    className="text-xs text-[var(--color-brand-primary)] shrink-0 hover:underline"
                  >
                    View
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-lg border border-dashed border-[var(--color-bg-border)] p-4">
          <Building2 size={18} className="text-[var(--color-text-muted)] shrink-0 mt-0.5" />
          <p className="text-sm text-[var(--color-text-muted)]">
            No active industry deals yet. Explore brand opportunities in the marketplace.
          </p>
        </div>
      )}
    </section>
  );
}
