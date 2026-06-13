import React from 'react';
import { Link } from 'react-router-dom';
import { Spinner } from '../../components/ui/Spinner';
import { APPLICATION_STATUS_LABELS, TYPE_LABELS } from '../../lib/collaborationApi';
import { useMyCollaborationApplications } from '../../hooks/queries/collaboration';
import { ApplicationStatusBadge } from './CollaborationDetailPage';

export default function MyCollaborationApplicationsPage() {
  const { data, isLoading, isError } = useMyCollaborationApplications();

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
        <p className="text-sm text-[var(--color-text-primary)]">Could not load your applications</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <header className="space-y-2">
        <Link to="/collaborations" className="text-xs text-[var(--color-text-muted)] hover:underline">
          ← Marketplace
        </Link>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Your collaboration applications</h1>
      </header>

      {data._source === 'mock' && (
        <p className="text-xs text-amber-600 dark:text-amber-400">Sample data.</p>
      )}

      {(data.items ?? []).length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          No applications yet.{' '}
          <Link to="/collaborations" className="text-[var(--color-brand-primary)]">
            Browse open collaborations
          </Link>
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-bg-border)] rounded-xl border border-[var(--color-bg-border)]">
          {data.items.map((app) => (
            <li key={app.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    to={`/collaborations/${app.collaborationId}`}
                    className="text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-brand-primary)]"
                  >
                    {app.collaboration?.title ?? app.collaborationId}
                  </Link>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {app.collaboration?.type ? TYPE_LABELS[app.collaboration.type] : 'Collaboration'}
                    {app.collaboration?.city ? ` · ${app.collaboration.city}` : ''}
                  </p>
                </div>
                <ApplicationStatusBadge status={app.status} />
              </div>
              {app.message && (
                <p className="text-xs text-[var(--color-text-muted)] line-clamp-2">{app.message}</p>
              )}
              <p className="text-[10px] text-[var(--color-text-muted)] uppercase">
                {APPLICATION_STATUS_LABELS[app.status]}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
