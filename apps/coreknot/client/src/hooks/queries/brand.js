import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchBrand,
  fetchBrandApplications,
  fetchBrandCampaigns,
  fetchBrandOpportunities,
  fetchBrands,
  reviewBrandApplication,
} from '../../lib/brandApi';

export function useBrands(params = {}) {
  return useQuery({
    queryKey: ['brands', params],
    queryFn: () => fetchBrands(params),
    staleTime: 60_000,
  });
}

export function useBrand(id) {
  return useQuery({
    queryKey: ['brand', id],
    queryFn: () => fetchBrand(id),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

export function useBrandCampaigns(id) {
  return useQuery({
    queryKey: ['brand', id, 'campaigns'],
    queryFn: () => fetchBrandCampaigns(id),
    enabled: Boolean(id),
    staleTime: 120_000,
  });
}

export function useBrandOpportunities(id) {
  return useQuery({
    queryKey: ['brand', id, 'opportunities'],
    queryFn: () => fetchBrandOpportunities(id),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

export function useBrandApplications(brandId, params = {}) {
  return useQuery({
    queryKey: ['brand', brandId, 'applications', params],
    queryFn: () => fetchBrandApplications(brandId, params),
    enabled: Boolean(brandId),
    staleTime: 30_000,
  });
}

export function useReviewBrandApplication(brandId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, action, notes }) =>
      reviewBrandApplication(brandId, applicationId, action, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand', brandId, 'applications'] });
    },
  });
}
