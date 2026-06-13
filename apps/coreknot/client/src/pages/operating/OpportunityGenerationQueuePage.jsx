import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  MapPin,
  Music2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import HotSignalsPanel from '../../components/opportunity-generation/HotSignalsPanel';
import { Spinner } from '../../components/ui/Spinner';
import { PageContainer } from '../../components/ui/primitives';
import {
  SUGGESTED_TYPE_LABELS,
  approveOpportunityGenerationDraft,
  dismissOpportunityGenerationDraft,
  fetchOpportunityGenerationDrafts,
  runOpportunityGeneration,
} from '../../lib/opportunityGenerationApi';

function SignalContext({ draft }) {
  const snapshot = draft.signalSnapshot ?? {};
  const codes = snapshot.reasonCodes ?? draft.generationReason?.split(/,\s*/) ?? [];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 text-xs text-[var(--color-text-muted)]">
        {draft.city && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--token-surface-2)]">
            <MapPin size={12} />
            {draft.city}
          </span>
        )}
        {draft.genre && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--token-surface-2)]">
            <Music2 size={12} />
            {draft.genre}
          </span>
        )}
        {snapshot.audienceGrowth != null && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300">
            <TrendingUp size={12} />
            Audience +{Math.round(snapshot.audienceGrowth)}%
          </span>
        )}
        {snapshot.communityActivity != null && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/10 text-sky-300">
            Community +{Math.round(snapshot.communityActivity)}%
          </span>
        )}
        {snapshot.memberGrowth != null && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-violet-500/10 text-violet-300">
            Members +{Math.round(snapshot.memberGrowth)}%
          </span>
        )}
      </div>
      {codes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {codes.map((code) => (
            <span
              key={code}
              className="text-[10px] px-2 py-0.5 rounded bg-[var(--token-surface-2)] text-[var(--color-text-muted)]"
            >
              {String(code).replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function DraftCard({ draft, onApprove, onDismiss, pendingId }) {
  return (
    <article className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--token-surface-2)] text-[var(--color-text-muted)] font-medium">
              {SUGGESTED_TYPE_LABELS[draft.suggestedType] ?? draft.suggestedType}
            </span>
            <span className="text-[10px] text-[var(--color-text-muted)]">{draft.source}</span>
          </div>
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{draft.title}</h3>
          {draft.description && (
            <p className="text-sm text-[var(--color-text-muted)]">{draft.description}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">
            {Math.round(draft.confidence * 100)}%
          </p>
          <p className="text-[10px] text-[var(--color-text-muted)]">confidence</p>
        </div>
      </div>

      <SignalContext draft={draft} />

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        <button
          type="button"
          disabled={pendingId === draft.id}
          onClick={() => onDismiss(draft.id)}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border border-[var(--color-bg-border)] text-[var(--color-text-muted)] hover:bg-[var(--token-surface-2)] disabled:opacity-60"
        >
          <XCircle size={14} />
          Dismiss
        </button>
        <button
          type="button"
          disabled={pendingId === draft.id}
          onClick={() => onApprove(draft.id)}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-md bg-[var(--color-brand-primary)] text-white hover:opacity-90 disabled:opacity-60"
        >
          <CheckCircle2 size={14} />
          Approve & publish
        </button>
      </div>
    </article>
  );
}

export default function OpportunityGenerationQueuePage() {
  const queryClient = useQueryClient();
  const [pendingId, setPendingId] = useState(null);

  const draftsQuery = useQuery({
    queryKey: ['opportunity-generation', 'drafts'],
    queryFn: () => fetchOpportunityGenerationDrafts(),
  });

  const runMutation = useMutation({
    mutationFn: () => runOpportunityGeneration(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-generation'] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id) => approveOpportunityGenerationDraft(id),
    onMutate: (id) => setPendingId(id),
    onSettled: () => setPendingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-generation'] });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (id) => dismissOpportunityGenerationDraft(id),
    onMutate: (id) => setPendingId(id),
    onSettled: () => setPendingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-generation'] });
    },
  });

  const items = draftsQuery.data?.items ?? [];
  const activePendingId =
    pendingId ?? (approveMutation.isPending ? approveMutation.variables : null) ??
    (dismissMutation.isPending ? dismissMutation.variables : null);

  return (
    <PageContainer
      title="Opportunity generation"
      subtitle="Review system-generated opportunity drafts before publishing to marketplace"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Sparkles size={16} className="text-[var(--color-brand-primary)]" />
          <span>Rule-based scans from city intelligence, community snapshots, and talent alerts</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/operating/command-center"
            className="text-xs text-[var(--color-brand-primary)] hover:underline"
          >
            ← Command Center
          </Link>
          <button
            type="button"
            disabled={runMutation.isPending}
            onClick={() => runMutation.mutate()}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border border-[var(--color-bg-border)] hover:bg-[var(--token-surface-2)] disabled:opacity-60"
          >
            <RefreshCw size={14} className={runMutation.isPending ? 'animate-spin' : ''} />
            Run scan
          </button>
        </div>
      </div>

      {runMutation.isSuccess && (
        <p className="text-xs text-emerald-400 mb-4">
          Scan complete — {runMutation.data?.generatedCount ?? 0} draft(s) created (
          {runMutation.data?._source ?? 'api'})
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          {draftsQuery.isLoading && (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          )}

          {!draftsQuery.isLoading && items.length === 0 && (
            <div className="rounded-xl border border-dashed border-[var(--color-bg-border)] p-10 text-center space-y-2">
              <p className="text-sm text-[var(--color-text-primary)]">No drafts pending approval</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Run a scan to generate opportunities from hot signals.
              </p>
            </div>
          )}

          {items.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              pendingId={activePendingId}
              onApprove={(id) => approveMutation.mutate(id)}
              onDismiss={(id) => dismissMutation.mutate(id)}
            />
          ))}

          {draftsQuery.data?._source === 'mock' && items.length > 0 && (
            <p className="text-[10px] text-[var(--color-text-muted)]">
              Mock queue — Mumbai Hip-Hop showcase example included
            </p>
          )}
        </div>

        <div className="space-y-4">
          <HotSignalsPanel limit={8} />
        </div>
      </div>
    </PageContainer>
  );
}
