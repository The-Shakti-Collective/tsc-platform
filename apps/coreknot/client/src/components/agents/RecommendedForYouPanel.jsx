import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, RefreshCw, Target } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import AgentRecommendationCard from './AgentRecommendationCard';
import {
  fetchOpportunityAgentRecommendations,
  runOpportunityAgent,
} from '../../lib/agentsApi';

/**
 * Phase 9 — agent-powered "Recommended For You" (Decision Layer).
 * Upgrades opportunity panel with persisted AgentRecommendation rows.
 */
export default function RecommendedForYouPanel({ artistId, compact = false, limit = 10 }) {
  const queryClient = useQueryClient();

  const recommendationsQuery = useQuery({
    queryKey: ['agents', 'recommendations', artistId, limit],
    queryFn: () => fetchOpportunityAgentRecommendations(artistId, limit),
    enabled: Boolean(artistId),
  });

  const runMutation = useMutation({
    mutationFn: () => runOpportunityAgent(artistId, limit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents', 'recommendations', artistId] });
    },
  });

  if (!artistId) {
    return (
      <section className="rounded-xl border border-[var(--color-bg-border)] p-4 text-xs text-[var(--color-text-muted)]">
        Artist context required for agent recommendations.
      </section>
    );
  }

  if (recommendationsQuery.isLoading) {
    return (
      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 flex justify-center py-8">
        <Spinner size={24} />
      </section>
    );
  }

  const data = recommendationsQuery.data;
  const isError = recommendationsQuery.isError || !data;

  if (isError) {
    return (
      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-2">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Recommended for you</h2>
        <p className="text-sm text-[var(--color-text-muted)]">Agent recommendations unavailable.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <Target size={16} className="text-[var(--color-brand-primary)]" />
            Recommended for you
          </h2>
          {!compact && (
            <p className="text-xs text-[var(--color-text-muted)] mt-1 flex items-center gap-1.5">
              <Bot size={12} />
              Opportunity Agent — intelligence → decision → you approve & apply
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={runMutation.isPending}
            onClick={() => runMutation.mutate()}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] text-[var(--color-text-primary)] hover:bg-[var(--token-surface-2)] disabled:opacity-50"
          >
            <RefreshCw size={12} className={runMutation.isPending ? 'animate-spin' : ''} />
            {runMutation.isPending ? 'Running…' : 'Refresh matches'}
          </button>
          <Link
            to="/operating/opportunities/marketplace"
            className="text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)]"
          >
            Marketplace →
          </Link>
        </div>
      </div>

      {data._source === 'mock' && (
        <p className="text-xs text-amber-600 dark:text-amber-400">Sample agent recommendations.</p>
      )}

      {runMutation.isSuccess && runMutation.data?.recommendationsCreated != null && (
        <p className="text-xs text-green-600 dark:text-green-400">
          Agent created {runMutation.data.recommendationsCreated} new recommendation
          {runMutation.data.recommendationsCreated === 1 ? '' : 's'}.
        </p>
      )}

      {(data.items ?? []).length === 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-[var(--color-text-muted)]">
            No agent recommendations yet. Run the Opportunity Agent to find marketplace matches.
          </p>
          <button
            type="button"
            disabled={runMutation.isPending}
            onClick={() => runMutation.mutate()}
            className="text-xs px-3 py-1.5 rounded-md bg-[var(--color-brand-primary)] text-white disabled:opacity-50"
          >
            Run Opportunity Agent
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--color-bg-border)] rounded-lg border border-[var(--color-bg-border)]">
          {data.items.map((item) => (
            <AgentRecommendationCard
              key={item.id}
              item={item}
              artistId={artistId}
              compact={compact}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
