import { useQuery } from '@tanstack/react-query';
import {
  fetchArtistTrust,
  fetchBrandTrust,
  postArtistOpportunitiesV2,
  postBrandMatch,
} from '../../lib/trustApi';

export function useArtistTrust(artistId) {
  return useQuery({
    queryKey: ['trust', 'artist', artistId],
    queryFn: () => fetchArtistTrust(artistId),
    enabled: !!artistId,
    staleTime: 120_000,
  });
}

export function useBrandTrust(brandId) {
  return useQuery({
    queryKey: ['trust', 'brand', brandId],
    queryFn: () => fetchBrandTrust(brandId),
    enabled: !!brandId,
    staleTime: 120_000,
  });
}

export function useBrandMatch(criteria, enabled = true) {
  return useQuery({
    queryKey: ['recommendations', 'v2', 'brand-match', criteria],
    queryFn: () => postBrandMatch(criteria),
    enabled: enabled && !!criteria?.brandId,
    staleTime: 60_000,
  });
}

export function useArtistRecommendedOpportunities(artistId, limit = 20) {
  return useQuery({
    queryKey: ['recommendations', 'v2', 'artist-opportunities', artistId, limit],
    queryFn: () => postArtistOpportunitiesV2({ artistId, limit }),
    enabled: !!artistId,
    staleTime: 60_000,
  });
}
