import React from 'react';
import { Link } from 'react-router-dom';
import { Spinner } from '../ui/Spinner';
import { APPLICATION_STATUS_LABELS } from '../../lib/opportunityApi';
import { BRAND_REVIEW_ACTIONS, LISTING_TYPE_LABELS } from '../../lib/marketplaceApi';
import { useBrandApplications, useReviewBrandApplication } from '../../hooks/queries/brand';

function StatusBadge({ status }) {
  const colors = {
    applied: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
    shortlisted: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    won: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    rejected: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  };
  return (
    <span
      className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${colors[status] ?? 'bg-slate-500/15 text-slate-600'}`}
    >
      {APPLICATION_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default function BrandApplicationQueue({ brandId }) {
  const { data, isLoading } = useBrandApplications(brandId, { status: 'applied' });
  const review = useReviewBrandApplication(brandId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner />
      </div>
    );
  }

  const items = data?.items ?? [];

  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Application review queue
        </h2>
        <span className="text-xs text-[var(--color-text-muted)]">
          {items.length} pending
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)]">No applications awaiting review.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((app) => (
            <li
              key={app.id}
              className="rounded-lg border border-[var(--color-bg-border)] p-3 space-y-2"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {app.artistName ?? app.personName ?? 'Applicant'}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    <Link
                      to={`/operating/opportunities/${app.opportunityId}`}
                      className="text-[var(--color-brand-primary)] hover:underline"
                    >
                      {app.listingTitle}
                    </Link>
                    {app.listingType
                      ? ` · ${LISTING_TYPE_LABELS[app.listingType] ?? app.listingType}`
                      : ''}
                  </p>
                  {app.artistGenre && (
                    <p className="text-xs text-[var(--color-text-muted)]">Genre: {app.artistGenre}</p>
                  )}
                </div>
                <StatusBadge status={app.status} />
              </div>

              {app.status === 'applied' && (
                <div className="flex flex-wrap gap-2">
                  {(['shortlist', 'reject', 'hire']).map((action) => (
                    <button
                      key={action}
                      type="button"
                      disabled={review.isPending}
                      className="text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] hover:border-[var(--color-brand-primary)] disabled:opacity-50"
                      onClick={() =>
                        review.mutate({ applicationId: app.id, action })
                      }
                    >
                      {BRAND_REVIEW_ACTIONS[action]}
                    </button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {data?._source === 'mock' && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Mock review queue — connect Brand OS applications API for live data.
        </p>
      )}
    </section>
  );
}
