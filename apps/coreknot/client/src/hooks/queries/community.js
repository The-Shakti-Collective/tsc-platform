import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  TSC_UNDERGROUND_ID,
  addCommunityMember,
  createCommunityOpportunity,
  fetchCommunityDashboard,
  fetchCommunityEvents,
  fetchCommunityMembers,
  fetchMyCommunityMembership,
  joinCommunity,
  leaveCommunity,
  updateCommunitySettings,
} from '../../lib/communityApi';

export function useCommunityDashboard(communityId = TSC_UNDERGROUND_ID) {
  return useQuery({
    queryKey: ['community', 'dashboard', communityId],
    queryFn: () => fetchCommunityDashboard(communityId),
    staleTime: 60_000,
  });
}

export function useCommunityMembers(communityId = TSC_UNDERGROUND_ID, page = 1) {
  return useQuery({
    queryKey: ['community', 'members', communityId, page],
    queryFn: () => fetchCommunityMembers(communityId, page),
    staleTime: 60_000,
  });
}

export function useCommunityEvents(communityId = TSC_UNDERGROUND_ID) {
  return useQuery({
    queryKey: ['community', 'events', communityId],
    queryFn: () => fetchCommunityEvents(communityId),
    staleTime: 60_000,
  });
}

export function useAddCommunityMember(communityId = TSC_UNDERGROUND_ID) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => addCommunityMember(communityId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'dashboard', communityId] });
      queryClient.invalidateQueries({ queryKey: ['community', 'members', communityId] });
    },
  });
}

export function useCreateCommunityOpportunity(communityId = TSC_UNDERGROUND_ID) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createCommunityOpportunity(communityId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'dashboard', communityId] });
    },
  });
}

export function useUpdateCommunitySettings(communityId = TSC_UNDERGROUND_ID) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => updateCommunitySettings(communityId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'dashboard', communityId] });
    },
  });
}

export function useCommunityMembership(communityId = TSC_UNDERGROUND_ID) {
  return useQuery({
    queryKey: ['community', 'membership', communityId],
    queryFn: () => fetchMyCommunityMembership(communityId),
    staleTime: 30_000,
  });
}

export function useCommunityJoin(communityId = TSC_UNDERGROUND_ID) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => joinCommunity(communityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'membership', communityId] });
      queryClient.invalidateQueries({ queryKey: ['community', 'dashboard', communityId] });
      queryClient.invalidateQueries({ queryKey: ['community', 'members', communityId] });
    },
  });
}

export function useCommunityLeave(communityId = TSC_UNDERGROUND_ID) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => leaveCommunity(communityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'membership', communityId] });
      queryClient.invalidateQueries({ queryKey: ['community', 'dashboard', communityId] });
      queryClient.invalidateQueries({ queryKey: ['community', 'members', communityId] });
    },
  });
}
