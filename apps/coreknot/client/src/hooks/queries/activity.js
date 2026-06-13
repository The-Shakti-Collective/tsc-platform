import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  fetchActivityFeed,
  fetchCommunityActivity,
  fetchFollowingFeed,
  fetchPersonActivity,
} from '../../lib/activityApi';

export function useActivityFeed() {
  return useInfiniteQuery({
    queryKey: ['activity', 'feed'],
    queryFn: ({ pageParam = 1 }) => fetchActivityFeed(pageParam, 20),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 30_000,
  });
}

export function useFollowingFeed() {
  return useInfiniteQuery({
    queryKey: ['activity', 'following-feed'],
    queryFn: ({ pageParam = 1 }) => fetchFollowingFeed(pageParam, 20),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 30_000,
  });
}

export function usePersonActivity(personId) {
  return useQuery({
    queryKey: ['activity', 'person', personId],
    queryFn: () => fetchPersonActivity(personId),
    enabled: !!personId,
    staleTime: 60_000,
  });
}

export function useCommunityActivity(communityId) {
  return useQuery({
    queryKey: ['activity', 'community', communityId],
    queryFn: () => fetchCommunityActivity(communityId),
    enabled: !!communityId,
    staleTime: 60_000,
  });
}
