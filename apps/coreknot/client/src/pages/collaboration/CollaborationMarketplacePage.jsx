import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Music2, Plus, Users } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import {
  COLLABORATION_TYPES,
  STATUS_LABELS,
  TYPE_LABELS,
} from '../../lib/collaborationApi';
import { useCollaborations } from '../../hooks/queries/collaboration';

function formatRelativeDate(iso) {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function CollaborationCard({ item }) {
  return (
    <article className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 space-y-3 hover:border-[var(--color-brand-primary)]/40 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <Link
            to={`/collaborations/${item.id}`}
            className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-brand-primary)] line-clamp-2"
          >
            {item.title}
          </Link>
          <p className="text-xs text-[var(--color-text-muted)]">
            {TYPE_LABELS[item.type] ?? item.type}
            {item.creatorName ? ` · ${item.creatorName}` : ''}
          </p>
        </div>
        <span className="shrink-0 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
          {STATUS_LABELS[item.status] ?? item.status}
        </span>
      </div>

      {item.description && (
        <p className="text-xs text-[var(--color-text-muted)] line-clamp-2">{item.description}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {(item.genres ?? []).slice(0, 3).map((genre) => (
          <span
            key={genre}
            className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--token-surface-2)] text-[var(--color-text-muted)]"
          >
            {genre}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)]">
        {item.city && (
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} />
            {item.city}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Users size={12} />
          {item.applicationCount} applicant{item.applicationCount === 1 ? '' : 's'}
        </span>
        {item.expiresAt && (
          <span>Expires {formatRelativeDate(item.expiresAt)}</span>
        )}
      </div>

      <Link
        to={`/collaborations/${item.id}`}
        className="inline-block text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] text-[var(--color-brand-primary)]"
      >
        View & apply →
      </Link>
    </article>
  );
}

export default function CollaborationMarketplacePage() {
  const [type, setType] = useState('');
  const [genre, setGenre] = useState('');
  const [city, setCity] = useState('');

  const filters = useMemo(
    () => ({
      status: 'open',
      ...(type ? { type } : {}),
      ...(genre.trim() ? { genre: genre.trim() } : {}),
      ...(city.trim() ? { city: city.trim() } : {}),
    }),
    [type, genre, city],
  );

  const { data, isLoading, isError, refetch } = useCollaborations(filters);

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
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          Collaboration marketplace unavailable
        </p>
        <button type="button" onClick={() => refetch()} className="text-sm text-[var(--color-brand-primary)]">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">Ecosystem</p>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <Music2 size={22} className="text-[var(--color-brand-primary)]" />
            Find Collaborators
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
            Browse open collaboration requests from artists across TSC — rappers, producers, guitarists,
            videographers, and more.
          </p>
        </div>
        <Link
          to="/collaborations/new"
          className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-md bg-[var(--color-brand-primary)] text-white hover:opacity-90"
        >
          <Plus size={16} />
          Post request
        </Link>
      </header>

      {data._source === 'mock' && (
        <p className="text-xs text-amber-600 dark:text-amber-400 rounded-lg border border-amber-500/30 px-3 py-2">
          Sample collaboration data — connect VITE_TSC_API_URL to @tsc/api for live marketplace.
        </p>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          <label className="space-y-1">
            <span className="text-xs text-[var(--color-text-muted)]">Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="block text-sm rounded-md border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] px-3 py-2"
            >
              <option value="">All types</option>
              {COLLABORATION_TYPES.map((key) => (
                <option key={key} value={key}>
                  {TYPE_LABELS[key]}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 flex-1 min-w-[120px]">
            <span className="text-xs text-[var(--color-text-muted)]">Genre</span>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="hip-hop, drill…"
              className="w-full text-sm rounded-md border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] px-3 py-2"
            />
          </label>
          <label className="space-y-1 flex-1 min-w-[120px]">
            <span className="text-xs text-[var(--color-text-muted)]">City</span>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Bangalore, Remote…"
              className="w-full text-sm rounded-md border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] px-3 py-2"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data.items ?? []).length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] col-span-full py-8 text-center">
              No open collaborations match these filters.
            </p>
          ) : (
            data.items.map((item) => <CollaborationCard key={item.id} item={item} />)
          )}
        </div>
      </section>

      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-2">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Your collaborations</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link to="/collaborations/me/created" className="text-[var(--color-brand-primary)] hover:underline">
            Posted by you
          </Link>
          <Link to="/collaborations/me/applications" className="text-[var(--color-brand-primary)] hover:underline">
            Your applications
          </Link>
        </div>
      </section>
    </div>
  );
}

export { CollaborationCard, formatRelativeDate };
