import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, History, RefreshCw, Send, Sparkles } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import TrustBadge from '../trust/TrustBadge';
import {
  confidenceBarWidth,
  fetchBrandMatchCampaignHistory,
  fetchBrandMatchResults,
  formatBrandMatchConfidence,
  inviteBrandMatchArtist,
  runBrandMatchAgent,
} from '../../lib/brandMatchAgentApi';

function formatCurrency(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function ArtistMatchRow({ item, brandId, onInvite }) {
  const queryClient = useQueryClient();
  const meta = item.metadata ?? {};
  const slug = meta.slug;
  const invited = item.status === 'applied';

  const inviteMutation = useMutation({
    mutationFn: () => inviteBrandMatchArtist(item.id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['brand-match-agent', brandId] });
      onInvite?.(item.id, result);
    },
  });

  return (
    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
            {meta.artistName ?? item.title}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {meta.city ?? 'City n/a'} · {meta.genres?.slice(0, 2).join(', ') || 'Genre n/a'}
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {(meta.reasonCodes ?? []).slice(0, 3).map((code) => (
              <span
                key={code}
                className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--token-surface-2)] text-[var(--color-text-muted)]"
              >
                {code.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-[var(--token-surface-2)] overflow-hidden max-w-[140px]">
              <div
                className="h-full rounded-full bg-[var(--color-brand-primary)]"
                style={{ width: `${confidenceBarWidth(item.confidence)}%` }}
              />
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)]">
              {formatBrandMatchConfidence(item.confidence)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 shrink-0 text-xs">
        <TrustBadge trustScore={meta.trustScore} compact showScore />
        <span className="text-[var(--color-text-muted)]">
          Match <strong className="text-[var(--color-text-primary)]">{Math.round(item.score)}</strong>
        </span>
        {slug && (
          <Link
            to={`/passport/${slug}`}
            className="text-[var(--color-brand-primary)] hover:underline"
          >
            Passport →
          </Link>
        )}
        <button
          type="button"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--color-bg-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-50"
          disabled={invited || inviteMutation.isPending}
          onClick={() => inviteMutation.mutate()}
        >
          <Send size={12} />
          {invited ? 'Invited' : inviteMutation.isPending ? 'Sending…' : 'Invite'}
        </button>
      </div>
      {inviteMutation.isSuccess && (
        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 sm:col-span-full">
          {inviteMutation.data?.invitedStub ?? 'Invite stub logged'}
        </p>
      )}
    </div>
  );
}

export default function BrandMatchAgentPanel({ brandId, defaultGenre, defaultCity, defaultBudget }) {
  const queryClient = useQueryClient();
  const [brief, setBrief] = useState({
    genre: defaultGenre ?? 'hip-hop',
    audienceAge: '18-24',
    city: defaultCity ?? 'Mumbai',
    budget: defaultBudget ?? 500000,
  });
  const [showHistory, setShowHistory] = useState(false);
  const [lastInvite, setLastInvite] = useState(null);

  const resultsQuery = useQuery({
    queryKey: ['brand-match-agent', brandId],
    queryFn: () => fetchBrandMatchResults(brandId),
    enabled: Boolean(brandId),
  });

  const historyQuery = useQuery({
    queryKey: ['brand-match-agent-history', brandId],
    queryFn: () => fetchBrandMatchCampaignHistory(brandId),
    enabled: Boolean(brandId) && showHistory,
  });

  const runMutation = useMutation({
    mutationFn: () =>
      runBrandMatchAgent({
        brandId,
        genre: brief.genre,
        audienceAge: brief.audienceAge,
        city: brief.city,
        budget: Number(brief.budget) || undefined,
        limit: 20,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-match-agent', brandId] });
      queryClient.invalidateQueries({ queryKey: ['brand-match-agent-history', brandId] });
    },
  });

  if (!brandId) {
    return (
      <section className="rounded-xl border border-[var(--color-bg-border)] p-4 text-xs text-[var(--color-text-muted)]">
        Select a brand to run campaign matching.
      </section>
    );
  }

  const data = resultsQuery.data;
  const isLoading = resultsQuery.isLoading;

  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <Bot size={16} className="text-[var(--color-brand-primary)]" />
            Brand Match Agent
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Campaign brief → top 20 artists ranked with confidence. Pending brand approval on each run.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {data?._source === 'mock' && (
            <span className="text-[10px] uppercase text-amber-600 dark:text-amber-400">Sample</span>
          )}
          <button
            type="button"
            className="text-xs px-2 py-1 rounded-lg border border-[var(--color-bg-border)] text-[var(--color-text-muted)] inline-flex items-center gap-1"
            onClick={() => setShowHistory((v) => !v)}
          >
            <History size={12} />
            History
          </button>
        </div>
      </div>

      <form
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-dashed border-[var(--color-bg-border)] p-3"
        onSubmit={(e) => {
          e.preventDefault();
          runMutation.mutate();
        }}
      >
        <label className="space-y-1">
          <span className="text-[10px] uppercase text-[var(--color-text-muted)]">Genre</span>
          <input
            className="w-full text-sm rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] px-2 py-1.5"
            value={brief.genre}
            onChange={(e) => setBrief((b) => ({ ...b, genre: e.target.value }))}
          />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] uppercase text-[var(--color-text-muted)]">Audience age</span>
          <input
            className="w-full text-sm rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] px-2 py-1.5"
            value={brief.audienceAge}
            onChange={(e) => setBrief((b) => ({ ...b, audienceAge: e.target.value }))}
          />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] uppercase text-[var(--color-text-muted)]">City</span>
          <input
            className="w-full text-sm rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] px-2 py-1.5"
            value={brief.city}
            onChange={(e) => setBrief((b) => ({ ...b, city: e.target.value }))}
          />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] uppercase text-[var(--color-text-muted)]">Budget (INR)</span>
          <input
            type="number"
            min={0}
            className="w-full text-sm rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] px-2 py-1.5"
            value={brief.budget}
            onChange={(e) => setBrief((b) => ({ ...b, budget: e.target.value }))}
          />
        </label>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-2 pt-1">
          <button
            type="submit"
            className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-brand-primary)] text-white inline-flex items-center gap-1 disabled:opacity-50"
            disabled={runMutation.isPending}
          >
            {runMutation.isPending ? (
              <Spinner size={14} className="text-white" />
            ) : (
              <RefreshCw size={12} />
            )}
            {runMutation.isPending ? 'Running…' : 'Run agent'}
          </button>
          {data?.lastRunAt && (
            <span className="text-[10px] text-[var(--color-text-muted)]">
              Last run {new Date(data.lastRunAt).toLocaleString()}
            </span>
          )}
          {data?.decision?.status === 'pending' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
              Campaign pending approval
            </span>
          )}
        </div>
      </form>

      {showHistory && (
        <div className="rounded-lg border border-[var(--color-bg-border)] p-3 space-y-2">
          <p className="text-xs font-medium text-[var(--color-text-primary)]">Campaign history</p>
          {historyQuery.isLoading ? (
            <Spinner size={18} />
          ) : (historyQuery.data?.campaigns ?? []).length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)]">No prior runs.</p>
          ) : (
            <ul className="space-y-2">
              {historyQuery.data.campaigns.map((campaign) => (
                <li
                  key={campaign.taskId}
                  className="text-xs flex flex-wrap justify-between gap-2 border-b border-[var(--color-bg-border)] pb-2 last:border-0"
                >
                  <span>
                    {campaign.brief?.genre ?? '—'} · {campaign.brief?.city ?? '—'} ·{' '}
                    {formatCurrency(campaign.brief?.budget)}
                  </span>
                  <span className="text-[var(--color-text-muted)]">
                    {campaign.recommendationsCreated} artists ·{' '}
                    {new Date(campaign.completedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size={24} />
        </div>
      ) : (data?.items ?? []).length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
          <Sparkles size={12} />
          Run the agent to rank artists for this campaign brief.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-bg-border)] rounded-lg border border-[var(--color-bg-border)]">
          {data.items.map((item, index) => (
            <li key={item.id} className="relative pl-6">
              <span className="absolute left-2 top-3 text-[10px] font-mono text-[var(--color-text-muted)]">
                {index + 1}
              </span>
              <ArtistMatchRow
                item={item}
                brandId={brandId}
                onInvite={(id, result) => setLastInvite({ id, result })}
              />
            </li>
          ))}
        </ul>
      )}

      {lastInvite && (
        <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
          Invite logged for recommendation {lastInvite.id}
        </p>
      )}
    </section>
  );
}
