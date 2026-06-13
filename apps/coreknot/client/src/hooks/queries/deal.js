import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  advanceDealStatus,
  fetchDeal,
  fetchDealRevenue,
  fetchDeals,
  recordDealRevenue,
  updateDeal,
} from '../../lib/dealApi';

export function useDeals(params = {}) {
  return useQuery({
    queryKey: ['deals', params],
    queryFn: () => fetchDeals(params),
    staleTime: 30_000,
  });
}

export function useDeal(id) {
  return useQuery({
    queryKey: ['deal', id],
    queryFn: () => fetchDeal(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useDealRevenue(id) {
  return useQuery({
    queryKey: ['deal', id, 'revenue'],
    queryFn: () => fetchDealRevenue(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useAdvanceDealStatus(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => advanceDealStatus(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deal', id] });
      qc.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useUpdateDeal(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => updateDeal(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deal', id] }),
  });
}

export function useRecordDealRevenue(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => recordDealRevenue(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deal', id, 'revenue'] });
      qc.invalidateQueries({ queryKey: ['deal', id] });
    },
  });
}
