import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { COLLABORATION_TYPES, TYPE_LABELS } from '../../lib/collaborationApi';
import { useCreateCollaboration } from '../../hooks/queries/collaboration';

export default function PostCollaborationForm({ onSuccess = undefined, compact = false }) {
  const navigate = useNavigate();
  const createMutation = useCreateCollaboration();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('general');
  const [city, setCity] = useState('');
  const [genres, setGenres] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters');
      return;
    }

    try {
      const body = {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        city: city.trim() || undefined,
        genres: genres
          .split(',')
          .map((g) => g.trim())
          .filter(Boolean),
        ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
      };

      const result = await createMutation.mutateAsync(body);
      onSuccess?.(result);
      navigate(`/collaborations/${result.id}`);
    } catch (err) {
      setError(err?.message ?? 'Failed to post collaboration');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-4 ${compact ? '' : 'rounded-xl border border-[var(--color-bg-border)] p-5'}`}
    >
      {!compact && (
        <header className="space-y-1">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Post a collaboration request
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            Find producers, vocalists, videographers, and more across the TSC ecosystem.
          </p>
        </header>
      )}

      <label className="block space-y-1">
        <span className="text-xs text-[var(--color-text-muted)]">Title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Looking for a rapper on a drill beat"
          className="w-full text-sm rounded-md border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] px-3 py-2"
          required
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs text-[var(--color-text-muted)]">Type</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full text-sm rounded-md border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] px-3 py-2"
        >
          {COLLABORATION_TYPES.map((key) => (
            <option key={key} value={key}>
              {TYPE_LABELS[key]}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-xs text-[var(--color-text-muted)]">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Describe what you need, timeline, and how to reach you…"
          className="w-full text-sm rounded-md border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] px-3 py-2"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs text-[var(--color-text-muted)]">City</span>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Bangalore, Remote…"
            className="w-full text-sm rounded-md border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] px-3 py-2"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-[var(--color-text-muted)]">Genres (comma-separated)</span>
          <input
            type="text"
            value={genres}
            onChange={(e) => setGenres(e.target.value)}
            placeholder="hip-hop, drill, electronic"
            className="w-full text-sm rounded-md border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] px-3 py-2"
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-xs text-[var(--color-text-muted)]">Expires (optional)</span>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="w-full text-sm rounded-md border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] px-3 py-2"
        />
      </label>

      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="text-sm px-4 py-2 rounded-md bg-[var(--color-brand-primary)] text-white hover:opacity-90 disabled:opacity-50"
        >
          {createMutation.isPending ? 'Posting…' : 'Post collaboration'}
        </button>
        {!compact && (
          <Link
            to="/collaborations"
            className="text-sm px-4 py-2 rounded-md border border-[var(--color-bg-border)] text-[var(--color-text-muted)]"
          >
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}
