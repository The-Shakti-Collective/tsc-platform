import { useQuery } from '@tanstack/react-query';
import {
  fetchDiscoveryCollaborations,
  fetchDiscoveryCommunities,
  fetchDiscoveryEvents,
  fetchDiscoveryPeople,
} from '../../lib/discoveryApi';

export function useDiscoveryPeople(params = {}) {
  return useQuery({
    queryKey: ['discovery', 'people', params],
    queryFn: () => fetchDiscoveryPeople(params),
    staleTime: 60_000,
  });
}

export function useDiscoveryCommunities(params = {}) {
  return useQuery({
    queryKey: ['discovery', 'communities', params],
    queryFn: () => fetchDiscoveryCommunities(params),
    staleTime: 60_000,
  });
}

export function useDiscoveryEvents(params = {}) {
  return useQuery({
    queryKey: ['discovery', 'events', params],
    queryFn: () => fetchDiscoveryEvents(params),
    staleTime: 60_000,
  });
}

export function useDiscoveryCollaborations(params = {}) {
  return useQuery({
    queryKey: ['discovery', 'collaborations', params],
    queryFn: () => fetchDiscoveryCollaborations(params),
    staleTime: 60_000,
  });
}
