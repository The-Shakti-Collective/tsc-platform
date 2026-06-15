import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axios from 'axios';
import { apiGet, apiHttp, getTscApiBase, resolveApiPath } from '../../lib/apiClient';

function platformArtistPathEnabled() {
  return Boolean(getTscApiBase());
}

function artistPathApplicationsPath(segment = '') {
  return resolveApiPath('artist-path/applications', segment);
}

export const useArtistPathPeople = (params = {}, options = {}) =>
  useQuery({
    queryKey: ['artistPath', 'people', params, platformArtistPathEnabled()],
    queryFn: async () => {
      if (platformArtistPathEnabled()) {
        const { data } = await apiHttp.get(artistPathApplicationsPath(''), { params });
        return data;
      }
      return (await axios.get('/api/artist-path/people', { params })).data;
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    ...options,
  });

export const useArtistPathPerson = (personId, options = {}) =>
  useQuery({
    queryKey: ['artistPath', 'person', personId, platformArtistPathEnabled()],
    queryFn: async () => {
      if (platformArtistPathEnabled()) {
        return apiGet(artistPathApplicationsPath(`/${personId}`));
      }
      return (await axios.get(`/api/artist-path/people/${personId}`)).data;
    },
    enabled: !!personId,
    staleTime: 1000 * 60 * 2,
    ...options,
  });

export const useArtistPathSync = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (platformArtistPathEnabled()) {
        return Promise.reject(new Error('Sheet sync is only available via CoreKnot Mongo backfill'));
      }
      return axios.post('/api/artist-path/sync');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artistPath'] });
      queryClient.invalidateQueries({ queryKey: ['dataHub'] });
    },
  });
};
