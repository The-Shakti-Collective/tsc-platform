import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle2, MapPin } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import { BUDGET_RANGE_LABELS, BRAND_STATUS_LABELS } from '../../lib/brandApi';
import { useBrands } from '../../hooks/queries/brand';

function BrandCard({ brand }) {
  return (
    <article className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 space-y-3 hover:border-[var(--color-brand-primary)]/40 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <Link
            to={`/brands/${brand.id}`}
            className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-brand-primary)] line-clamp-1"
          >
            {brand.name}
          </Link>
          <p className="text-xs text-[var(--color-text-muted)]">
            {brand.industry ?? 'Industry TBD'}
            {brand.verified ? ' · Verified' : ''}
          </p>
        </div>
        {brand.verified && (
          <CheckCircle2
            size={16}
            className="shrink-0 text-emerald-500"
            aria-label="Verified brand"
          />
        )}
      </div>

      {brand.description && (
        <p className="text-xs text-[var(--color-text-muted)] line-clamp-2">{brand.description}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {(brand.categories ?? []).slice(0, 3).map((category) => (
          <span
            key={category}
            className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--token-surface-2)] text-[var(--color-text-muted)]"
          >
            {category.replace(/_/g, ' ')}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)]">
        {brand.city && (
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} />
            {brand.city}
            {brand.country ? `, ${brand.country}` : ''}
          </span>
        )}
        {brand.budgetRange && (
          <span>{BUDGET_RANGE_LABELS[brand.budgetRange] ?? brand.budgetRange}</span>
        )}
        <span>{brand.opportunityCount ?? 0} opportunities</span>
      </div>
    </article>
  );
}

export default function BrandListPage() {
  const [city, setCity] = useState('');
  const params = useMemo(() => (city.trim() ? { city: city.trim() } : {}), [city]);
  const { data, isLoading, isError } = useBrands(params);

  const items = data?.items ?? [];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-[var(--color-brand-primary)]">
          <Building2 size={20} />
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Brand OS</h1>
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">
          Sponsor brands on TSC — browse profiles, trust signals, and marketplace opportunities.
        </p>
        {data?._source === 'mock' && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Showing mock brands (API unavailable). Examples: Red Bull India, Bacardi, boAt.
          </p>
        )}
      </header>

      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Filter by city"
          className="text-sm px-3 py-2 rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] min-w-[180px]"
        />
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {isError && !data && (
        <p className="text-sm text-red-500">Could not load brands.</p>
      )}

      {!isLoading && items.length === 0 && (
        <p className="text-sm text-[var(--color-text-muted)]">No brands match your filters.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((brand) => (
          <BrandCard key={brand.id} brand={brand} />
        ))}
      </div>
    </div>
  );
}
