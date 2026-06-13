import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchEcosystemPassport,
  fetchFollowStatus,
  fetchMyProfile,
  fetchPublicProfile,
  fetchVerification,
  followPerson,
  unfollowPerson,
} from '../../lib/profileApi';

export function useEcosystemPassport(slug) {
  return useQuery({
    queryKey: ['profile', 'ecosystem', slug],
    queryFn: () => fetchEcosystemPassport(slug),
    enabled: !!slug,
  });
}

export function usePublicProfile(slug) {
  return useQuery({
    queryKey: ['profile', 'public', slug],
    queryFn: () => fetchPublicProfile(slug),
    enabled: !!slug,
  });
}

export function useMyProfile() {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: fetchMyProfile,
  });
}

export function useVerification(personId) {
  return useQuery({
    queryKey: ['profile', 'verification', personId],
    queryFn: () => fetchVerification(personId),
    enabled: !!personId,
  });
}

export function useFollowStatus(personId) {
  return useQuery({
    queryKey: ['profile', 'follow-status', personId],
    queryFn: () => fetchFollowStatus(personId),
    enabled: !!personId,
    staleTime: 30_000,
  });
}

export function useFollowPerson(personId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => followPerson(personId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'follow-status', personId] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}

export function useUnfollowPerson(personId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unfollowPerson(personId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'follow-status', personId] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}
