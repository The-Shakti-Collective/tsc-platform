import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  applyToOpportunity,
  fetchArtistApplications,
  fetchMarketplace,
  fetchOpportunityDetail,
  fetchSuggestedOpportunities,
  saveOpportunity,
  shareOpportunity,
} from '../../lib/opportunityApi';

export function useMarketplace(filters = {}) {
  return useQuery({
    queryKey: ['opportunities', 'marketplace', filters],
    queryFn: () => fetchMarketplace(filters),
    staleTime: 60_000,
  });
}

export function useOpportunityDetail(id) {
  return useQuery({
    queryKey: ['opportunities', 'detail', id],
    queryFn: () => fetchOpportunityDetail(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useSuggestedOpportunities(artistId) {
  return useQuery({
    queryKey: ['intelligence', 'opportunities', 'suggested', artistId],
    queryFn: () => fetchSuggestedOpportunities(artistId),
    staleTime: 60_000,
  });
}

export function useArtistApplications(artistId, filters = {}) {
  return useQuery({
    queryKey: ['artists', artistId, 'applications', filters],
    queryFn: () => fetchArtistApplications(artistId, filters),
    enabled: !!artistId,
    staleTime: 30_000,
  });
}

export function useSaveOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => saveOpportunity(id, body),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'marketplace'] });
      queryClient.invalidateQueries({ queryKey: ['artists'] });
    },
  });
}

export function useApplyToOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => applyToOpportunity(id, body),
    onSuccess: (_data, { id, body }) => {
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'marketplace'] });
      if (body?.artistId) {
        queryClient.invalidateQueries({ queryKey: ['artists', body.artistId, 'applications'] });
      }
    },
  });
}

export function useShareOpportunity() {
  return useMutation({
    mutationFn: ({ id, body }) => shareOpportunity(id, body),
  });
}
