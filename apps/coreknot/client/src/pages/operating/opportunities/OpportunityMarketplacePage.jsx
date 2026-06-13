import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Calendar, MapPin, Sparkles, TrendingUp } from 'lucide-react';
import { Spinner } from '../../../components/ui/Spinner';
import { LISTING_TYPE_LABELS, LISTING_TYPES } from '../../../lib/marketplaceApi';
import { APPLICATION_STATUS_LABELS } from '../../../lib/opportunityApi';
import {
  useApplyToListing,
  useBookmarkListing,
  useMarketplaceListings,
  useMarketplaceSearch,
} from '../../../hooks/queries/marketplace';

function formatCurrency(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDeadline(iso) {
  if (!iso) return 'Rolling';
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function StatusBadge({ status }) {
  const colors = {
    saved: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
    applied: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
    shortlisted: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    won: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    rejected: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  };
  return (
    <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${colors[status] ?? colors.saved}`}>
      {APPLICATION_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function OpportunityCard({ item, artistId = undefined, onSaved = undefined, onApplied = undefined }) {
  const saveMutation = useBookmarkListing();
  const applyMutation = useApplyToListing();
  const budget = item.budget ?? item.value;
  const typeLabel =
    LISTING_TYPE_LABELS[item.listingType] ??
    LISTING_TYPE_LABELS[item.category] ??
    item.listingType ??
    item.category ??
    'Listing';
  const busy = saveMutation.isPending || applyMutation.isPending;

  return (
    <article className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 space-y-3 hover:border-[var(--color-brand-primary)]/40 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <Link
            to={`/operating/opportunities/${item.id}`}
            className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-brand-primary)] line-clamp-2"
          >
            {item.title}
          </Link>
          <p className="text-xs text-[var(--color-text-muted)]">
            {typeLabel}
            {(item.ownerName || item.organizationName)
              ? ` · ${item.ownerName ?? item.organizationName}`
              : ''}
            {item.ownerVerified ? ' ✓' : ''}
          </p>
        </div>
        {item.matchScore != null && (
          <span className="shrink-0 text-xs font-mono px-2 py-1 rounded-md bg-[var(--token-surface-2)] text-[var(--color-brand-primary)]">
            {Math.round(item.matchScore)}%
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)]">
        {item.city && (
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} />
            {item.city}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Calendar size={12} />
          {formatDeadline(item.deadline)}
        </span>
        <span>{formatCurrency(budget)}</span>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            await saveMutation.mutateAsync({ id: item.id, body: { artistId } });
            onSaved?.();
          }}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] hover:bg-[var(--token-surface-2)] disabled:opacity-50"
        >
          <Bookmark size={12} />
          Save
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            await applyMutation.mutateAsync({ id: item.id, body: { artistId } });
            onApplied?.();
          }}
          className="text-xs px-3 py-1.5 rounded-md bg-[var(--color-brand-primary)] text-white hover:opacity-90 disabled:opacity-50"
        >
          Apply
        </button>
        <Link
          to={`/operating/opportunities/${item.id}`}
          className="text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] text-[var(--color-brand-primary)]"
        >
          Details →
        </Link>
      </div>
    </article>
  );
}

export default function OpportunityMarketplacePage() {
  const [listingType, setListingType] = useState('');
  const [city, setCity] = useState('');
  const [genre, setGenre] = useState('');
  const [searchQ, setSearchQ] = useState('');

  const filters = useMemo(
    () => ({
      ...(listingType ? { type: listingType } : {}),
      ...(city.trim() ? { city: city.trim() } : {}),
      ...(genre.trim() ? { genre: genre.trim() } : {}),
      ...(searchQ.trim() ? { q: searchQ.trim() } : {}),
    }),
    [listingType, city, genre, searchQ],
  );

  const listingsQuery = useMarketplaceListings(filters);
  const searchQuery = useMarketplaceSearch(filters);
  const useSearch = Boolean(searchQ.trim());
  const activeQuery = useSearch ? searchQuery : listingsQuery;
  const { data, isLoading, isError, refetch } = activeQuery;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={32} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 text-center space-y-2">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">Marketplace unavailable</p>
        <button type="button" onClick={() => refetch()} className="text-sm text-[var(--color-brand-primary)]">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <header className="space-y-2">
        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">Ecosystem</p>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Marketplace Listings</h1>
        <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
          Brand campaigns, festival slots, workshops, grants, residencies, sync licensing, and collaborations —
          unified browse and search, ranked by intelligence (read-only).
        </p>
      </header>

      {data._source === 'mock' && (
        <p className="text-xs text-amber-600 dark:text-amber-400 rounded-lg border border-amber-500/30 px-3 py-2">
          Sample marketplace data — connect VITE_TSC_API_URL to @tsc/api for live opportunities.
        </p>
      )}

      {(data.suggested ?? []).length > 0 && (
        <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--color-brand-primary)]" />
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Suggested for you</h2>
            <span className="text-xs text-[var(--color-text-muted)]">via intelligence ranking</span>
          </div>
          <ul className="divide-y divide-[var(--color-bg-border)]">
            {data.suggested.map((item) => (
              <li key={item.id} className="py-2.5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Link
                    to={`/operating/opportunities/${item.id}`}
                    className="text-sm font-medium text-[var(--color-text-primary)] hover:underline truncate block"
                  >
                    {item.title}
                  </Link>
                  <p className="text-xs text-[var(--color-text-muted)]">{item.reason}</p>
                </div>
                <span className="text-xs font-mono shrink-0 flex items-center gap-1 text-[var(--color-brand-primary)]">
                  <TrendingUp size={12} />
                  {Math.round(item.score)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          <label className="space-y-1 flex-1 min-w-[200px]">
            <span className="text-xs text-[var(--color-text-muted)]">Search</span>
            <input
              type="search"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Title, brand, requirements…"
              className="w-full text-sm rounded-md border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] px-3 py-2"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-[var(--color-text-muted)]">Type</span>
            <select
              value={listingType}
              onChange={(e) => setListingType(e.target.value)}
              className="block text-sm rounded-md border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] px-3 py-2"
            >
              <option value="">All types</option>
              {LISTING_TYPES.map((key) => (
                <option key={key} value={key}>
                  {LISTING_TYPE_LABELS[key]}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 flex-1 min-w-[140px]">
            <span className="text-xs text-[var(--color-text-muted)]">City</span>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Bangalore, Mumbai…"
              className="w-full text-sm rounded-md border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] px-3 py-2"
            />
          </label>
          <label className="space-y-1 flex-1 min-w-[120px]">
            <span className="text-xs text-[var(--color-text-muted)]">Genre</span>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="electronic, indie…"
              className="w-full text-sm rounded-md border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] px-3 py-2"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data.items ?? []).length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] col-span-full py-8 text-center">
              No opportunities match these filters.
            </p>
          ) : (
            data.items.map((item) => (
              <OpportunityCard key={item.id} item={item} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export { StatusBadge, formatDeadline, formatCurrency };
