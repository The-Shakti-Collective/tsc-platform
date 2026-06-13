import React from 'react';
import { Link } from 'react-router-dom';
import { Spinner } from '../../components/ui/Spinner';
import { APPLICATION_STATUS_LABELS, CATEGORY_LABELS } from '../../lib/opportunityApi';
import { useArtistApplications } from '../../hooks/queries/opportunity';
import { StatusBadge, formatCurrency, formatDeadline } from '../../pages/operating/opportunities/OpportunityMarketplacePage';

export default function ArtistApplicationTracker({ artistId, compact = false }) {
  const { data, isLoading, isError } = useArtistApplications(artistId);

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
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Application tracker</h2>
        <p className="text-sm text-[var(--color-text-muted)]">Applications unavailable.</p>
      </section>
    );
  }

  const applications = data.applications ?? [];

  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Application tracker</h2>
          {!compact && (
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Saved, applied, shortlisted, won, and rejected — synced to TSC Passport history.
            </p>
          )}
        </div>
        <Link
          to="/operating/opportunities/marketplace"
          className="text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)]"
        >
          Browse marketplace →
        </Link>
      </div>

      {data._source === 'mock' && (
        <p className="text-xs text-amber-600 dark:text-amber-400">Sample application data.</p>
      )}

      {applications.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">No applications yet.</p>
      ) : (
        <ul className="divide-y divide-[var(--color-bg-border)] rounded-lg border border-[var(--color-bg-border)]">
          {applications.map((app) => (
            <li key={app.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="min-w-0 flex-1">
                <Link
                  to={`/operating/opportunities/${app.opportunityId}`}
                  className="text-sm font-medium text-[var(--color-text-primary)] hover:underline truncate block"
                >
                  {app.opportunity?.title ?? app.opportunityId}
                </Link>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {CATEGORY_LABELS[app.opportunity?.category] ?? app.opportunity?.category ?? 'Opportunity'}
                  {app.opportunity?.city ? ` · ${app.opportunity.city}` : ''}
                  {app.opportunity?.deadline ? ` · due ${formatDeadline(app.opportunity.deadline)}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={app.status} />
                <span className="text-xs text-[var(--color-text-muted)] hidden sm:inline">
                  {APPLICATION_STATUS_LABELS[app.status]}
                </span>
                <span className="text-xs font-mono text-[var(--color-text-muted)]">
                  {formatCurrency(app.opportunity?.value)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
