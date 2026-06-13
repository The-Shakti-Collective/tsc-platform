import React from 'react';
import { Link } from 'react-router-dom';
import { Spinner } from '../../components/ui/Spinner';
import { STATUS_LABELS, TYPE_LABELS } from '../../lib/collaborationApi';
import { useMyCollaborations } from '../../hooks/queries/collaboration';

export default function MyCollaborationsPage() {
  const { data, isLoading, isError } = useMyCollaborations();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={32} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-sm text-[var(--color-text-primary)]">Could not load your collaborations</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <header className="space-y-2">
        <Link to="/collaborations" className="text-xs text-[var(--color-text-muted)] hover:underline">
          ← Marketplace
        </Link>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Your posted collaborations</h1>
      </header>

      {data._source === 'mock' && (
        <p className="text-xs text-amber-600 dark:text-amber-400">Sample data.</p>
      )}

      {(data.items ?? []).length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          You haven&apos;t posted any collaborations yet.{' '}
          <Link to="/collaborations/new" className="text-[var(--color-brand-primary)]">
            Post one
          </Link>
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-bg-border)] rounded-xl border border-[var(--color-bg-border)]">
          {data.items.map((item) => (
            <li key={item.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Link
                  to={`/collaborations/${item.id}`}
                  className="text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-brand-primary)]"
                >
                  {item.title}
                </Link>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {TYPE_LABELS[item.type]} · {STATUS_LABELS[item.status]} · {item.applicationCount} apps
                </p>
              </div>
              <Link
                to={`/collaborations/${item.id}`}
                className="text-xs text-[var(--color-brand-primary)] shrink-0"
              >
                Manage →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
