import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  applyToCollaboration,
  createCollaboration,
  fetchCollaborationDetail,
  fetchCollaborations,
  fetchMyCollaborationApplications,
  fetchMyCollaborations,
  updateCollaboration,
  updateCollaborationApplication,
} from '../../lib/collaborationApi';

export function useCollaborations(filters = {}) {
  return useQuery({
    queryKey: ['collaborations', 'browse', filters],
    queryFn: () => fetchCollaborations(filters),
    staleTime: 60_000,
  });
}

export function useCollaborationDetail(id) {
  return useQuery({
    queryKey: ['collaborations', 'detail', id],
    queryFn: () => fetchCollaborationDetail(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useMyCollaborations() {
  return useQuery({
    queryKey: ['collaborations', 'me', 'created'],
    queryFn: () => fetchMyCollaborations(),
    staleTime: 30_000,
  });
}

export function useMyCollaborationApplications() {
  return useQuery({
    queryKey: ['collaborations', 'me', 'applications'],
    queryFn: () => fetchMyCollaborationApplications(),
    staleTime: 30_000,
  });
}

export function useCreateCollaboration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => createCollaboration(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborations'] });
    },
  });
}

export function useUpdateCollaboration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => updateCollaboration(id, body),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['collaborations', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['collaborations'] });
    },
  });
}

export function useApplyToCollaboration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => applyToCollaboration(id, body),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['collaborations', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['collaborations', 'me', 'applications'] });
    },
  });
}

export function useUpdateCollaborationApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ collaborationId, applicationId, body }) =>
      updateCollaborationApplication(collaborationId, applicationId, body),
    onSuccess: (_data, { collaborationId }) => {
      queryClient.invalidateQueries({
        queryKey: ['collaborations', 'detail', collaborationId],
      });
    },
  });
}
