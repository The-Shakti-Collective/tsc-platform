import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, MapPin, X } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import {
  APPLICATION_STATUS_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
} from '../../lib/collaborationApi';
import {
  useApplyToCollaboration,
  useCollaborationDetail,
  useUpdateCollaboration,
  useUpdateCollaborationApplication,
} from '../../hooks/queries/collaboration';
import { formatRelativeDate } from './CollaborationMarketplacePage';

function ApplicationStatusBadge({ status }) {
  const colors = {
    applied: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
    accepted: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    rejected: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    withdrawn: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
  };
  return (
    <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${colors[status] ?? colors.applied}`}>
      {APPLICATION_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default function CollaborationDetailPage() {
  const { collaborationId } = useParams();
  const [message, setMessage] = useState('');

  const { data, isLoading, isError } = useCollaborationDetail(collaborationId);
  const applyMutation = useApplyToCollaboration();
  const updateMutation = useUpdateCollaboration();
  const applicationMutation = useUpdateCollaborationApplication();

  const myStatus = data?.myApplication?.status;
  const canApply = data?.status === 'open' && !myStatus;
  const isCreator = data?.isCreator ?? false;
  const busy = applyMutation.isPending || updateMutation.isPending || applicationMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={32} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center space-y-3">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">Collaboration not found</p>
        <Link to="/collaborations" className="text-sm text-[var(--color-brand-primary)]">
          ← Back to marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link
        to="/collaborations"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-brand-primary)]"
      >
        <ArrowLeft size={14} />
        Find Collaborators
      </Link>

      {data._source === 'mock' && (
        <p className="text-xs text-amber-600 dark:text-amber-400">Sample collaboration detail.</p>
      )}

      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">{data.title}</h1>
          <span className="text-xs px-2 py-1 rounded-md bg-[var(--token-surface-2)] text-[var(--color-text-muted)]">
            {STATUS_LABELS[data.status] ?? data.status}
          </span>
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">
          {TYPE_LABELS[data.type] ?? data.type}
          {data.creatorName && (
            <>
              {' · Posted by '}
              {data.creatorSlug ? (
                <Link to={`/profile/${data.creatorSlug}`} className="text-[var(--color-brand-primary)] hover:underline">
                  {data.creatorName}
                </Link>
              ) : (
                data.creatorName
              )}
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-[var(--color-text-muted)]">
          {data.city && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} />
              {data.city}
            </span>
          )}
          {data.expiresAt && (
            <span>Expires {formatRelativeDate(data.expiresAt)}</span>
          )}
          <span>{data.applicationCount} applicant{data.applicationCount === 1 ? '' : 's'}</span>
        </div>
        {(data.genres ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.genres.map((genre) => (
              <span
                key={genre}
                className="text-xs px-2 py-0.5 rounded-full bg-[var(--token-surface-2)] text-[var(--color-text-muted)]"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
        {myStatus && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-muted)]">Your status</span>
            <ApplicationStatusBadge status={myStatus} />
          </div>
        )}
      </header>

      {data.description && (
        <section className="rounded-xl border border-[var(--color-bg-border)] p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Description</h2>
          <p className="text-sm text-[var(--color-text-muted)] whitespace-pre-wrap">{data.description}</p>
        </section>
      )}

      {canApply && (
        <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Apply to collaborate</h2>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Introduce yourself, share links, describe your fit…"
            className="w-full text-sm rounded-md border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] px-3 py-2"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => applyMutation.mutateAsync({ id: collaborationId, body: { message } })}
            className="text-sm px-4 py-2 rounded-md bg-[var(--color-brand-primary)] text-white hover:opacity-90 disabled:opacity-50"
          >
            {applyMutation.isPending ? 'Submitting…' : 'Submit application'}
          </button>
        </section>
      )}

      {isCreator && (data.applications ?? []).length > 0 && (
        <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Applications ({data.applications.length})
          </h2>
          <ul className="divide-y divide-[var(--color-bg-border)]">
            {data.applications.map((app) => (
              <li key={app.id} className="py-4 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    {app.applicantSlug ? (
                      <Link
                        to={`/profile/${app.applicantSlug}`}
                        className="text-sm font-medium text-[var(--color-brand-primary)] hover:underline"
                      >
                        {app.applicantName}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {app.applicantName}
                      </p>
                    )}
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Applied {formatRelativeDate(app.appliedAt)}
                    </p>
                  </div>
                  <ApplicationStatusBadge status={app.status} />
                </div>
                {app.message && (
                  <p className="text-sm text-[var(--color-text-muted)]">{app.message}</p>
                )}
                {app.status === 'applied' && data.status === 'open' && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        applicationMutation.mutateAsync({
                          collaborationId,
                          applicationId: app.id,
                          body: { status: 'accepted' },
                        })
                      }
                      className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:opacity-90 disabled:opacity-50"
                    >
                      <Check size={12} />
                      Accept
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        applicationMutation.mutateAsync({
                          collaborationId,
                          applicationId: app.id,
                          body: { status: 'rejected' },
                        })
                      }
                      className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] text-rose-600 disabled:opacity-50"
                    >
                      <X size={12} />
                      Reject
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {isCreator && data.status === 'open' && (
        <section className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              updateMutation.mutateAsync({
                id: collaborationId,
                body: { status: 'closed' },
              })
            }
            className="text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] text-[var(--color-text-muted)] disabled:opacity-50"
          >
            Close listing
          </button>
        </section>
      )}
    </div>
  );
}

export { ApplicationStatusBadge };
