import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Gift,
  Loader2,
  Share2,
  Sparkles,
  Ticket,
  Users,
  Zap,
} from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import {
  CATEGORY_LABELS,
  fetchMyCreditBalance,
  fetchRewardCatalog,
  formatCreditCost,
  redeemReward,
  shareContentStub,
} from '../../lib/rewardsApi';

const CATEGORY_ICONS = {
  merch: Gift,
  tickets: Ticket,
  meet_greet: Users,
  community_access: Users,
  priority_application: Zap,
};

function RewardCard({ reward, balance, onRedeemed }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [redeemed, setRedeemed] = useState(false);
  const Icon = CATEGORY_ICONS[reward.category] ?? Gift;
  const canAfford = balance >= reward.creditCost;
  const outOfStock = reward.stock != null && reward.stock <= 0;

  async function handleRedeem() {
    setLoading(true);
    setError(null);
    try {
      const result = await redeemReward(reward.id);
      setRedeemed(true);
      onRedeemed?.(result);
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Redemption failed — check your balance';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-5 space-y-4 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-[var(--token-surface-2)] border border-[var(--color-bg-border)] flex items-center justify-center">
            <Icon size={16} className="text-[var(--color-brand-primary)]" />
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)]">
              {CATEGORY_LABELS[reward.category] ?? reward.category}
            </p>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              {reward.name}
            </h3>
          </div>
        </div>
        <span className="text-sm font-bold text-[var(--color-brand-primary)] shrink-0">
          {formatCreditCost(reward.creditCost)}
        </span>
      </div>

      {reward.description && (
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed flex-1">
          {reward.description}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        {reward.stock != null ? (
          <span className="text-xs text-[var(--color-text-muted)]">
            {outOfStock ? 'Out of stock' : `${reward.stock} left`}
          </span>
        ) : (
          <span className="text-xs text-[var(--color-text-muted)]">Unlimited</span>
        )}

        <button
          type="button"
          disabled={loading || redeemed || !canAfford || outOfStock}
          onClick={handleRedeem}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-[var(--color-brand-primary)] text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {redeemed ? 'Redeemed' : 'Redeem'}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      {!canAfford && !redeemed && !outOfStock && (
        <p className="text-xs text-amber-400">Need {reward.creditCost - balance} more credits</p>
      )}
    </article>
  );
}

/**
 * Rewards catalog — browse + redeem ecosystem credits.
 * Route: /rewards (see INTEGRATION.patch.md)
 */
export default function RewardsCatalogPage() {
  const [catalog, setCatalog] = useState(null);
  const [balance, setBalance] = useState(null);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareMsg, setShareMsg] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catalogData, balanceData] = await Promise.all([
        fetchRewardCatalog(category ? { category } : {}),
        fetchMyCreditBalance(),
      ]);
      setCatalog(catalogData);
      setBalance(balanceData);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => {
    const all = catalog?.items?.map((r) => r.category) ?? [];
    return [...new Set(all)];
  }, [catalog]);

  function handleRedeemed(result) {
    setBalance((prev) =>
      prev
        ? { ...prev, balance: result.balanceAfter ?? prev.balance - result.creditCost }
        : prev,
    );
  }

  async function handleShareStub() {
    setShareLoading(true);
    setShareMsg(null);
    try {
      const result = await shareContentStub();
      setBalance((prev) => (prev ? { ...prev, balance: result.balance } : prev));
      if (result.created) {
        setShareMsg(`+${result.amount} credits for sharing today`);
      } else {
        setShareMsg('Already earned share credits today');
      }
    } finally {
      setShareLoading(false);
    }
  }

  if (loading && !catalog) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
          Module 5 — Rewards
        </p>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Rewards Catalog
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
          Spend ecosystem credits on merch, tickets, meet & greets, community access, and priority
          application passes. Fulfillment is manual — redemptions start as pending.
        </p>
      </header>

      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--color-text-muted)]">Your balance</p>
          <p className="text-3xl font-bold text-[var(--color-brand-primary)]">
            {balance?.balance ?? 0}
            <span className="text-sm font-normal text-[var(--color-text-muted)] ml-2">credits</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleShareStub}
            disabled={shareLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-bg-border)] px-3 py-2 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--token-surface-2)]"
          >
            {shareLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Share2 size={14} />
            )}
            Share (+3 stub)
          </button>
          <Link
            to="/rewards/redemptions"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-bg-border)] px-3 py-2 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--token-surface-2)]"
          >
            <Gift size={14} />
            My redemptions
          </Link>
        </div>
        {shareMsg && (
          <p className="w-full text-xs text-emerald-400">{shareMsg}</p>
        )}
      </section>

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory('')}
            className={`rounded-full px-3 py-1 text-xs border ${
              !category
                ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                : 'border-[var(--color-bg-border)] text-[var(--color-text-muted)]'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs border ${
                category === cat
                  ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                  : 'border-[var(--color-bg-border)] text-[var(--color-text-muted)]'
              }`}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(catalog?.items ?? []).map((reward) => (
          <RewardCard
            key={reward.id}
            reward={reward}
            balance={balance?.balance ?? 0}
            onRedeemed={handleRedeemed}
          />
        ))}
      </div>

      {catalog?._source === 'mock' && (
        <p className="text-xs text-[var(--color-text-muted)] text-center">
          Showing mock catalog — connect API for live rewards
        </p>
      )}
    </div>
  );
}
