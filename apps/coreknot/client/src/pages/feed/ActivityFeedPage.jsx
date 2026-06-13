import React from 'react';
import { ActivityFeedList } from '../../components/activity/ActivityFeedList';
import { useActivityFeed } from '../../hooks/queries/activity';

/**
 * Personalized ecosystem activity feed — following + communities + trending stub.
 * Route: /feed or dashboard section via INTEGRATION.patch.md
 */
export default function ActivityFeedPage() {
  const feedQuery = useActivityFeed();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Ecosystem Feed</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Communities, events, opportunities, and people you follow across TSC.
        </p>
      </header>

      <section className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] px-5">
        <ActivityFeedList query={feedQuery} />
      </section>
    </div>
  );
}
