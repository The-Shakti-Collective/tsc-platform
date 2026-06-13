import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchMarketplaceListings,
  searchMarketplaceListings,
  trackListing,
} from '../../lib/marketplaceApi';
import {
  applyToOpportunity,
  saveOpportunity,
  shareOpportunity,
} from '../../lib/opportunityApi';

export function useMarketplaceListings(filters = {}) {
  return useQuery({
    queryKey: ['marketplace', 'listings', filters],
    queryFn: () => fetchMarketplaceListings(filters),
    staleTime: 60_000,
  });
}

export function useMarketplaceSearch(filters = {}) {
  return useQuery({
    queryKey: ['marketplace', 'search', filters],
    queryFn: () => searchMarketplaceListings(filters),
    enabled: Boolean(filters.q?.trim() || filters.type || filters.city || filters.genre),
    staleTime: 30_000,
  });
}

export function useTrackListing() {
  return useMutation({
    mutationFn: ({ listingId, ...body }) => trackListing(listingId, body),
  });
}

export function useBookmarkListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => saveOpportunity(id, body),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'detail', id] });
    },
  });
}

export function useApplyToListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => applyToOpportunity(id, body),
    onSuccess: (_data, { id, body }) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'detail', id] });
      if (body?.artistId) {
        queryClient.invalidateQueries({ queryKey: ['artists', body.artistId, 'applications'] });
      }
    },
  });
}

export function useShareListing() {
  return useMutation({
    mutationFn: ({ id, body }) => shareOpportunity(id, body),
  });
}
