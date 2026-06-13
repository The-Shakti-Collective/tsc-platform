import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, ExternalLink, MapPin } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import {
  BUDGET_RANGE_LABELS,
  BRAND_STATUS_LABELS,
} from '../../lib/brandApi';
import BrandApplicationQueue from '../../components/brand/BrandApplicationQueue';
import {
  useBrand,
  useBrandCampaigns,
  useBrandOpportunities,
} from '../../hooks/queries/brand';
import { useBrandTrust } from '../../hooks/queries/trust';
import TrustBadge from '../../components/trust/TrustBadge';
import BrandMatchAgentPanel from '../../components/brand/BrandMatchAgentPanel';

export default function BrandDetailPage() {
  const { brandId } = useParams();
  const { data: brand, isLoading } = useBrand(brandId);
  const { data: campaigns } = useBrandCampaigns(brandId);
  const { data: opportunities } = useBrandOpportunities(brandId);
  const { data: trust } = useBrandTrust(brandId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="p-6 text-sm text-[var(--color-text-muted)]">
        Brand not found.{' '}
        <Link to="/brands" className="text-[var(--color-brand-primary)]">
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <Link
        to="/brands"
        className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-brand-primary)]"
      >
        <ArrowLeft size={14} />
        All brands
      </Link>

      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-[var(--color-brand-primary)]" />
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">{brand.name}</h1>
          {brand.verified && (
            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              Verified
            </span>
          )}
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">
          {brand.industry ?? 'Industry not set'} ·{' '}
          {BRAND_STATUS_LABELS[brand.status] ?? brand.status}
        </p>
        {brand.description && (
          <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">{brand.description}</p>
        )}
        <div className="flex flex-wrap gap-4 text-xs text-[var(--color-text-muted)]">
          {brand.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} />
              {brand.city}
              {brand.country ? `, ${brand.country}` : ''}
            </span>
          )}
          {brand.budgetRange && (
            <span>Budget: {BUDGET_RANGE_LABELS[brand.budgetRange] ?? brand.budgetRange}</span>
          )}
          {brand.website && (
            <a
              href={brand.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[var(--color-brand-primary)]"
            >
              Website <ExternalLink size={12} />
            </a>
          )}
        </div>
        {dataSourceNote(brand)}
      </header>

      <section className="rounded-xl border border-[var(--color-bg-border)] p-4 space-y-2">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Trust score</h2>
        <TrustBadge
          trustScore={trust?.trustScore ?? brand.trustScore}
          badges={trust?.badges ?? (brand.verified ? ['verified_brand_partner'] : [])}
        />
        {trust?._source === 'mock' && (
          <p className="text-xs text-amber-600 dark:text-amber-400">Sample trust data.</p>
        )}
      </section>

      <BrandMatchAgentPanel
        brandId={brandId}
        defaultGenre={brand.categories?.[0] ?? 'hip-hop'}
        defaultCity={brand.city ?? 'Mumbai'}
        defaultBudget={brand.budgetRange === 'over_1cr' ? 1000000 : 500000}
      />

      <section className="rounded-xl border border-[var(--color-bg-border)] p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Campaigns</h2>
        {campaigns?.stubbed ? (
          <p className="text-xs text-[var(--color-text-muted)]">{campaigns.message}</p>
        ) : (
          <p className="text-xs text-[var(--color-text-muted)]">
            {campaigns?.items?.length ?? 0} campaigns
          </p>
        )}
      </section>

      <BrandApplicationQueue brandId={brandId} />

      <section className="rounded-xl border border-[var(--color-bg-border)] p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Listings</h2>
        {(opportunities?.items ?? []).length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)]">No posted opportunities yet.</p>
        ) : (
          <ul className="space-y-2">
            {opportunities.items.map((opp) => (
              <li key={opp.id}>
                <Link
                  to={`/opportunities/marketplace/${opp.id}`}
                  className="text-sm text-[var(--color-brand-primary)] hover:underline"
                >
                  {opp.title}
                </Link>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {opp.category ?? 'open_call'} · {opp.applicationCount} applications
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function dataSourceNote(brand) {
  if (brand._source !== 'mock') return null;
  return (
    <p className="text-xs text-amber-600 dark:text-amber-400">
      Mock brand profile — connect Brand OS API for live data.
    </p>
  );
}
