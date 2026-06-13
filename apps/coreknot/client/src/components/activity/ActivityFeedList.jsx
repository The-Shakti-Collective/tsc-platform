import React, { useEffect, useRef } from 'react';
import { Spinner } from '../ui/Spinner';
import { ActivityFeedItem } from './ActivityFeedItem';

export function ActivityFeedList({
  query,
  emptyMessage = 'No activity yet — join a community or follow artists to populate your feed.',
}) {
  const sentinelRef = useRef(null);
  const items = query.data?.pages?.flatMap((page) => page.items ?? []) ?? [];
  const isMock = query.data?.pages?.[0]?._source === 'mock';

  useEffect(() => {
    if (!sentinelRef.current || !query.hasNextPage || query.isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          query.fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [query]);

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size={28} />
      </div>
    );
  }

  if (query.isError) {
    return (
      <p className="text-sm text-center text-[var(--color-text-muted)] py-8">
        Could not load activity feed.
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-center text-[var(--color-text-muted)] py-8">{emptyMessage}</p>
    );
  }

  return (
    <div className="space-y-0">
      {isMock && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mb-3 text-center">
          Sample feed — connect @tsc/api for live activity
        </p>
      )}
      {items.map((item) => (
        <ActivityFeedItem key={item.id} item={item} />
      ))}
      <div ref={sentinelRef} className="h-8 flex items-center justify-center">
        {query.isFetchingNextPage && <Spinner size={20} />}
      </div>
    </div>
  );
}
