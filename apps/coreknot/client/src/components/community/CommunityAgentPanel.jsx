import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, RefreshCw, Sparkles, UserCheck, UserMinus, X } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import {
  approveCommunitySuggestion,
  COMMUNITY_SUGGESTION_TYPE_LABELS,
  communitySuggestionPriorityClass,
  dismissCommunitySuggestion,
  fetchCommunitySuggestions,
  formatCommunityConfidence,
  runCommunityAgent,
} from '../../lib/communityAgentApi';

function SuggestionCard({ item, communityId, onAction }) {
  const queryClient = useQueryClient();
  const suggestionType = item.metadata?.suggestionType;
  const priority = item.metadata?.priority ?? 'medium';

  const approveMutation = useMutation({
    mutationFn: () => approveCommunitySuggestion(item.id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['community-agent', communityId] });
      onAction?.('approve', item.id, result);
    },
  });

  const dismissMutation = useMutation({
    mutationFn: () => dismissCommunitySuggestion(item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-agent', communityId] });
      onAction?.('dismiss', item.id);
    },
  });

  const isPending = approveMutation.isPending || dismissMutation.isPending;

  return (
    <article className="rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 rounded-full bg-[var(--token-surface-2)] text-[var(--color-text-muted)]">
              {COMMUNITY_SUGGESTION_TYPE_LABELS[suggestionType] ?? suggestionType ?? 'Suggestion'}
            </span>
            <span className={`text-[10px] font-medium ${communitySuggestionPriorityClass(priority)}`}>
              {priority} priority
            </span>
          </div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{item.title}</h3>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">{item.score}</p>
          <p className="text-[10px] text-[var(--color-text-muted)]">{formatCommunityConfidence(item.confidence)}</p>
        </div>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{item.rationale}</p>
      {item.metadata?.pollStub && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
          Poll stub: {item.metadata.pollStub.question}
        </p>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-brand-primary)] text-white disabled:opacity-50"
          disabled={isPending}
          onClick={() => approveMutation.mutate()}
        >
          {approveMutation.isPending ? 'Approving…' : 'Approve'}
        </button>
        <button
          type="button"
          className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-bg-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-50 inline-flex items-center gap-1"
          disabled={isPending}
          onClick={() => dismissMutation.mutate()}
        >
          <X size={12} />
          Dismiss
        </button>
      </div>
      {approveMutation.isSuccess && (
        <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
          Executed: {approveMutation.data?.executedStub ?? 'stub complete'}
        </p>
      )}
    </article>
  );
}

export default function CommunityAgentPanel({ communityId }) {
  const queryClient = useQueryClient();
  const [lastAction, setLastAction] = useState(null);

  const suggestionsQuery = useQuery({
    queryKey: ['community-agent', communityId],
    queryFn: () => fetchCommunitySuggestions(communityId),
    enabled: Boolean(communityId),
  });

  const runMutation = useMutation({
    mutationFn: () => runCommunityAgent(communityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-agent', communityId] });
    },
  });

  const data = suggestionsQuery.data;
  const isMock = data?._source === 'mock';

  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
            style={{ backgroundColor: 'rgba(96, 165, 250, 0.16)', color: '#60a5fa' }}
          >
            <Bot size={18} />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Community Agent</h2>
            <p className="text-xs text-[var(--color-text-muted)] max-w-xl">
              Rule-based signals for inactive members, moderator candidates, trends, and collaboration fits.
              Leaders approve before stub execution.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="text-sm px-4 py-2 rounded-lg border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)] disabled:opacity-50 inline-flex items-center gap-2 shrink-0"
          disabled={runMutation.isPending}
          onClick={() => runMutation.mutate()}
        >
          {runMutation.isPending ? <Spinner size={14} /> : <RefreshCw size={14} />}
          {runMutation.isPending ? 'Running…' : 'Run agent'}
        </button>
      </div>

      {isMock && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          TSC Underground fixtures — wire to POST /agents/community/run when API live.
        </p>
      )}

      {suggestionsQuery.isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size={24} />
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] p-3 space-y-1">
              <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                <UserMinus size={14} />
                <span className="text-xs">Inactive (30d+)</span>
              </div>
              <p className="text-xl font-semibold text-[var(--color-text-primary)]">
                {data?.inactiveMemberCount?.toLocaleString?.() ?? '—'}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] p-3 space-y-1">
              <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                <UserCheck size={14} />
                <span className="text-xs">Moderator candidates</span>
              </div>
              <p className="text-xl font-semibold text-[var(--color-text-primary)]">
                {data?.moderatorCandidates?.length ?? 0}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] p-3 space-y-1">
              <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                <Sparkles size={14} />
                <span className="text-xs">Trend topics (stub)</span>
              </div>
              <p className="text-xs text-[var(--color-text-primary)] truncate">
                {(data?.upcomingTrends ?? []).join(' · ') || '—'}
              </p>
            </div>
          </div>

          {(data?.moderatorCandidates ?? []).length > 0 && (
            <div className="rounded-lg border border-dashed border-[var(--color-bg-border)] p-3 space-y-2">
              <p className="text-xs font-medium text-[var(--color-text-primary)]">Top moderator candidates</p>
              <ul className="space-y-1">
                {data.moderatorCandidates.map((candidate) => (
                  <li
                    key={candidate.personId}
                    className="flex justify-between gap-2 text-xs text-[var(--color-text-muted)]"
                  >
                    <span className="text-[var(--color-text-primary)]">{candidate.name}</span>
                    <span>
                      {candidate.postCount30d} posts · score {candidate.contributorScore}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-xs font-medium text-[var(--color-text-primary)]">
              Suggestions ({data?.items?.length ?? 0})
              {data?.lastRunAt && (
                <span className="font-normal text-[var(--color-text-muted)] ml-2">
                  Last run {new Date(data.lastRunAt).toLocaleString()}
                </span>
              )}
            </p>
            {(data?.items ?? []).length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] py-4 text-center">
                No active suggestions — run the Community Agent to generate recommendations.
              </p>
            ) : (
              data.items.map((item) => (
                <SuggestionCard
                  key={item.id}
                  item={item}
                  communityId={communityId}
                  onAction={(action, id, result) =>
                    setLastAction({ action, id, result, at: new Date().toISOString() })
                  }
                />
              ))
            )}
          </div>

          {lastAction?.action === 'approve' && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Suggestion approved — {lastAction.result?.executedStub ?? 'stub executed'}
            </p>
          )}
        </>
      )}
    </section>
  );
}
