import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Spinner } from '../ui/Spinner';
import { useEcosystemGraph } from '../../hooks/queries/intelligence';

const CLUSTER_KEYS = [
  { key: 'fans', label: 'Fans' },
  { key: 'events', label: 'Events' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'communities', label: 'Communities' },
  { key: 'venues', label: 'Venues' },
  { key: 'curators', label: 'Curators' },
  { key: 'sponsors', label: 'Sponsors' },
  { key: 'collaborators', label: 'Collaborators' },
  { key: 'opportunities', label: 'Opportunities' },
];

function formatCurrency(amount, currency = 'INR') {
  if (amount == null) return '—';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

function ClusterDetail({ clusterKey, data }) {
  if (clusterKey === 'revenue' && data) {
    return (
      <div className="space-y-2 text-sm">
        <p className="font-semibold text-[var(--color-text-primary)]">
          MTD {formatCurrency(data.mtd, data.currency)} · YTD {formatCurrency(data.ytd, data.currency)}
        </p>
        <ul className="space-y-1">
          {(data.streams ?? []).map((s) => (
            <li key={s.source} className="flex justify-between text-xs text-[var(--color-text-muted)]">
              <span>{s.source}</span>
              <span className="font-mono">{formatCurrency(s.amount, data.currency)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) {
    return <p className="text-xs text-[var(--color-text-muted)]">No connections in this cluster.</p>;
  }

  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.id} className="flex justify-between gap-2 text-xs">
          <span className="truncate text-[var(--color-text-primary)]">{item.name || item.title}</span>
          <span className="font-mono text-[var(--color-text-muted)] shrink-0">
            {item.score ?? item.bookings ?? item.members ?? item.opportunities ?? item.spend ?? item.value ?? item.count ?? ''}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function EcosystemGraphView({ artistId }) {
  const { data, isLoading, isError } = useEcosystemGraph(artistId);
  const [activeCluster, setActiveCluster] = useState('fans');

  const counts = useMemo(() => {
    if (!data) return {};
    return CLUSTER_KEYS.reduce((acc, { key }) => {
      const val = data[key];
      if (key === 'revenue') acc[key] = val?.streams?.length ?? (val ? 1 : 0);
      else acc[key] = Array.isArray(val) ? val.length : 0;
      return acc;
    }, {});
  }, [data]);

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
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Ecosystem graph</h2>
        <p className="text-sm text-[var(--color-text-muted)]">Graph unavailable for this artist.</p>
      </section>
    );
  }

  const center = data.center;

  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Ecosystem graph</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Click cluster — fans, events, revenue, communities, venues, curators, sponsors, collaborators, opportunities.
          </p>
        </div>
        <Link
          to="/operating/analytics/industry-intelligence"
          className="text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)]"
        >
          Industry view →
        </Link>
      </div>

      {data._source === 'mock' && (
        <p className="text-xs text-amber-600 dark:text-amber-400">Sample ecosystem graph — API stub not live yet.</p>
      )}

      <div className="flex flex-col items-center py-4">
        <button
          type="button"
          className="px-4 py-2 rounded-full border-2 border-[var(--color-brand-primary)] bg-[var(--token-surface-2)] text-sm font-semibold text-[var(--color-text-primary)]"
          onClick={() => setActiveCluster('fans')}
        >
          {center?.name ?? 'Artist'}
        </button>
        <p className="text-xs text-[var(--color-text-muted)] mt-2 capitalize">{center?.type ?? 'artist'} hub</p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {CLUSTER_KEYS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveCluster(key)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              activeCluster === key
                ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]'
                : 'border-[var(--color-bg-border)] text-[var(--color-text-muted)] hover:bg-[var(--token-surface-2)]'
            }`}
          >
            {label}
            {counts[key] > 0 && (
              <span className="ml-1 font-mono opacity-70">{counts[key]}</span>
            )}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-[var(--color-bg-border)] p-4 min-h-[120px]">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-3">
          {CLUSTER_KEYS.find((c) => c.key === activeCluster)?.label}
        </h3>
        <ClusterDetail clusterKey={activeCluster} data={data[activeCluster]} />
      </div>
    </section>
  );
}
