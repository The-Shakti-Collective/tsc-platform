import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, Calendar, MapPin, Share2 } from 'lucide-react';
import { Spinner } from '../../../components/ui/Spinner';
import {
  APPLICATION_STATUS_LABELS,
  CATEGORY_LABELS,
} from '../../../lib/opportunityApi';
import {
  useApplyToOpportunity,
  useOpportunityDetail,
  useSaveOpportunity,
  useShareOpportunity,
} from '../../../hooks/queries/opportunity';
import { StatusBadge, formatCurrency, formatDeadline } from './OpportunityMarketplacePage';

export default function OpportunityDetailPage() {
  const { opportunityId } = useParams();
  const [notes, setNotes] = useState('');
  const [shareMessage, setShareMessage] = useState(null);

  const { data, isLoading, isError } = useOpportunityDetail(opportunityId);
  const saveMutation = useSaveOpportunity();
  const applyMutation = useApplyToOpportunity();
  const shareMutation = useShareOpportunity();

  const myStatus = data?.myApplication?.status;
  const canApply = !myStatus || myStatus === 'saved';
  const canSave = !myStatus;
  const busy = saveMutation.isPending || applyMutation.isPending;

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
        <p className="text-sm font-medium text-[var(--color-text-primary)]">Opportunity not found</p>
        <Link to="/operating/opportunities/marketplace" className="text-sm text-[var(--color-brand-primary)]">
          ← Back to marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link
        to="/operating/opportunities/marketplace"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-brand-primary)]"
      >
        <ArrowLeft size={14} />
        Marketplace
      </Link>

      {data._source === 'mock' && (
        <p className="text-xs text-amber-600 dark:text-amber-400">Sample opportunity detail.</p>
      )}

      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">{data.title}</h1>
          {data.matchScore != null && (
            <span className="text-xs font-mono px-2 py-1 rounded-md bg-[var(--token-surface-2)] text-[var(--color-brand-primary)]">
              Match {Math.round(data.matchScore)}%
            </span>
          )}
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">
          {CATEGORY_LABELS[data.category] ?? data.category}
          {data.organizationName ? ` · ${data.organizationName}` : ''}
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-[var(--color-text-muted)]">
          {data.city && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} />
              {data.city}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={14} />
            Deadline {formatDeadline(data.deadline)}
          </span>
          <span>{formatCurrency(data.value)}</span>
        </div>
        {myStatus && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-muted)]">Your status</span>
            <StatusBadge status={myStatus} />
            <span className="text-xs text-[var(--color-text-muted)]">
              {APPLICATION_STATUS_LABELS[myStatus]}
            </span>
          </div>
        )}
      </header>

      {data.description && (
        <section className="rounded-xl border border-[var(--color-bg-border)] p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">About</h2>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{data.description}</p>
        </section>
      )}

      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Apply or save</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes for your application…"
          rows={3}
          className="w-full text-sm rounded-md border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] px-3 py-2 resize-y"
        />
        <div className="flex flex-wrap gap-2">
          {canSave && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                saveMutation.mutate({ id: opportunityId, body: { notes: notes || undefined } })
              }
              className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-md border border-[var(--color-bg-border)] hover:bg-[var(--token-surface-2)] disabled:opacity-50"
            >
              <Bookmark size={14} />
              Save for later
            </button>
          )}
          {canApply && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                applyMutation.mutate({ id: opportunityId, body: { notes: notes || undefined } })
              }
              className="text-sm px-4 py-2 rounded-md bg-[var(--color-brand-primary)] text-white hover:opacity-90 disabled:opacity-50"
            >
              {myStatus === 'saved' ? 'Submit application' : 'Apply now'}
            </button>
          )}
          {!canApply && !canSave && myStatus && (
            <p className="text-sm text-[var(--color-text-muted)]">
              Application is {APPLICATION_STATUS_LABELS[myStatus]?.toLowerCase()}. Track progress in your artist workspace.
            </p>
          )}
          <button
            type="button"
            disabled={shareMutation.isPending}
            onClick={async () => {
              const result = await shareMutation.mutateAsync({ id: opportunityId, body: {} });
              setShareMessage(result.shareUrl ?? result.message);
            }}
            className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-md border border-[var(--color-bg-border)] text-[var(--color-brand-primary)]"
          >
            <Share2 size={14} />
            Share
          </button>
        </div>
        {shareMessage && (
          <p className="text-xs text-[var(--color-text-muted)] break-all">
            Share link: {shareMessage}
          </p>
        )}
      </section>

      <section className="text-xs text-[var(--color-text-muted)] space-y-1">
        <p>
          Application flow: <strong>saved</strong> → <strong>applied</strong> →{' '}
          <strong>shortlisted</strong> → <strong>won</strong> or <strong>rejected</strong>.
        </p>
        <p>
          Won applications appear on the artist&apos;s TSC Passport opportunity history.
        </p>
      </section>
    </div>
  );
}
