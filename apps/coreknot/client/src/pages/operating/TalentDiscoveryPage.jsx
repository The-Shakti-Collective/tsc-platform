import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Compass,
  MapPin,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import { PageContainer } from '../../components/ui/primitives';
import {
  ENTITY_TYPE_LABELS,
  acknowledgeTalentDiscoveryAlert,
  fetchEmergingCities,
  fetchFastGrowingArtists,
  fetchTalentDiscoveryAlerts,
  runTalentDiscoveryScan,
} from '../../lib/talentDiscoveryApi';

function EntityBadge({ entityType }) {
  const tones = {
    Artist: 'bg-violet-500/15 text-violet-300',
    Community: 'bg-pink-500/15 text-pink-300',
    City: 'bg-sky-500/15 text-sky-300',
  };
  return (
    <span
      className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full font-medium ${tones[entityType] ?? 'bg-[var(--token-surface-2)] text-[var(--color-text-muted)]'}`}
    >
      {ENTITY_TYPE_LABELS[entityType] ?? entityType}
    </span>
  );
}

function AlertCard({ alert, onAcknowledge, pendingId }) {
  return (
    <article className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <EntityBadge entityType={alert.entityType} />
            <span className="text-xs font-mono text-[var(--color-text-muted)]">
              +{Math.round(alert.growthPercent)}%
            </span>
          </div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{alert.title}</h3>
          <p className="text-xs text-[var(--color-text-muted)]">{alert.rationale}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">{alert.score}</p>
          <p className="text-[10px] text-[var(--color-text-muted)]">score</p>
        </div>
      </div>
      {alert.reasonCodes?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {alert.reasonCodes.map((code) => (
            <span
              key={code}
              className="text-[10px] px-2 py-0.5 rounded bg-[var(--token-surface-2)] text-[var(--color-text-muted)]"
            >
              {code.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <p className="text-[10px] text-[var(--color-text-muted)]">
          {alert.city ? `${alert.city}` : ''}
          {alert.genre ? ` · ${alert.genre}` : ''}
        </p>
        {alert.status === 'active' ? (
          <button
            type="button"
            disabled={pendingId === alert.id}
            onClick={() => onAcknowledge(alert.id)}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)] disabled:opacity-60"
          >
            {pendingId === alert.id ? <Spinner size={12} /> : <CheckCircle2 size={12} />}
            Acknowledge
          </button>
        ) : (
          <span className="text-xs text-emerald-400">Acknowledged</span>
        )}
      </div>
    </article>
  );
}

function DataTable({ columns, rows, emptyLabel }) {
  if (!rows?.length) {
    return <p className="text-sm text-[var(--color-text-muted)]">{emptyLabel}</p>;
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-[var(--color-text-muted)] border-b border-[var(--color-bg-border)]">
            {columns.map((col) => (
              <th key={col.key} className="py-2 px-2 font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id ?? row.sceneKey ?? row.artistId}
              className="border-b border-[var(--color-bg-border)] last:border-0"
            >
              {columns.map((col) => (
                <td key={col.key} className="py-2.5 px-2 text-[var(--color-text-primary)]">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TalentDiscoveryPage() {
  const queryClient = useQueryClient();
  const [entityFilter, setEntityFilter] = useState('');
  const [pendingAckId, setPendingAckId] = useState(null);

  const alertsQuery = useQuery({
    queryKey: ['talent-discovery', 'alerts', entityFilter],
    queryFn: () =>
      fetchTalentDiscoveryAlerts(entityFilter ? { entityType: entityFilter } : {}),
  });

  const citiesQuery = useQuery({
    queryKey: ['talent-discovery', 'emerging-cities'],
    queryFn: () => fetchEmergingCities(10),
  });

  const artistsQuery = useQuery({
    queryKey: ['talent-discovery', 'fast-artists'],
    queryFn: () => fetchFastGrowingArtists(15),
  });

  const scanMutation = useMutation({
    mutationFn: () => runTalentDiscoveryScan(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-discovery'] });
    },
  });

  const ackMutation = useMutation({
    mutationFn: acknowledgeTalentDiscoveryAlert,
    onMutate: (id) => setPendingAckId(id),
    onSettled: () => setPendingAckId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-discovery'] });
    },
  });

  const alerts = alertsQuery.data?.items ?? [];
  const cities = citiesQuery.data?.items ?? [];
  const artists = artistsQuery.data?.items ?? [];
  const isLoading = alertsQuery.isLoading || citiesQuery.isLoading || artistsQuery.isLoading;

  return (
    <PageContainer className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <Link
          to="/operating/command-center"
          className="text-xs text-[var(--color-text-muted)] hover:underline"
        >
          ← Command Center
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <Compass size={22} className="text-[var(--color-brand-primary)]" />
              Talent Discovery
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Find fast-growing artists, undervalued communities, and emerging city scenes before
              anyone else.
            </p>
          </div>
          <button
            type="button"
            onClick={() => scanMutation.mutate()}
            disabled={scanMutation.isPending}
            className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-[var(--color-brand-primary)] text-white hover:opacity-90 disabled:opacity-60"
          >
            {scanMutation.isPending ? <Spinner size={16} /> : <RefreshCw size={16} />}
            Run platform scan
          </button>
        </div>
        {alertsQuery.data?.decision?.status === 'pending' && (
          <p className="text-xs text-amber-400 flex items-center gap-1.5">
            <Sparkles size={12} />
            Scan pending platform review — {alerts.length} alerts surfaced
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size={32} />
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <TrendingUp size={16} className="text-[var(--color-brand-primary)]" />
                Alerts feed
              </h2>
              <div className="flex flex-wrap gap-2">
                {['', 'Artist', 'Community', 'City'].map((value) => (
                  <button
                    key={value || 'all'}
                    type="button"
                    onClick={() => setEntityFilter(value)}
                    className={`text-xs px-3 py-1 rounded-full border ${
                      entityFilter === value
                        ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                        : 'border-[var(--color-bg-border)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    {value || 'All'}
                  </button>
                ))}
              </div>
            </div>
            {alerts.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                No alerts yet. Run a platform scan to surface talent signals.
              </p>
            ) : (
              <div className="grid gap-3">
                {alerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    pendingId={pendingAckId}
                    onAcknowledge={(id) => ackMutation.mutate(id)}
                  />
                ))}
              </div>
            )}
          </section>

          <div className="grid lg:grid-cols-2 gap-6">
            <section className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-5 space-y-4">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <MapPin size={16} className="text-sky-400" />
                Emerging cities
              </h2>
              <DataTable
                emptyLabel="No emerging city scenes yet."
                columns={[
                  { key: 'city', label: 'City', render: (row) => row.city },
                  {
                    key: 'genre',
                    label: 'Genre',
                    render: (row) => row.genre ?? '—',
                  },
                  {
                    key: 'growthPercent',
                    label: 'Growth',
                    render: (row) => `+${Math.round(row.growthPercent)}%`,
                  },
                  {
                    key: 'heatScore',
                    label: 'Heat',
                    render: (row) => row.heatScore,
                  },
                ]}
                rows={cities}
              />
            </section>

            <section className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-5 space-y-4">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <Users size={16} className="text-violet-400" />
                Fast-growing artists
              </h2>
              <DataTable
                emptyLabel="No fast-growing artists yet."
                columns={[
                  { key: 'name', label: 'Artist', render: (row) => row.name },
                  {
                    key: 'audienceGrowth',
                    label: 'Audience',
                    render: (row) => `+${row.audienceGrowth?.toFixed?.(1) ?? row.audienceGrowth}%`,
                  },
                  {
                    key: 'score',
                    label: 'Score',
                    render: (row) => row.score,
                  },
                ]}
                rows={artists}
              />
            </section>
          </div>
        </>
      )}
    </PageContainer>
  );
}
