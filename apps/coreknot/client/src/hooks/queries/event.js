import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  checkInToEvent,
  fetchEventParticipants,
  fetchMyEventParticipation,
  registerForEvent,
} from '../../lib/eventApi';

export function useEventParticipants(eventId, page = 1) {
  return useQuery({
    queryKey: ['event', 'participants', eventId, page],
    queryFn: () => fetchEventParticipants(eventId, page),
    enabled: Boolean(eventId),
    staleTime: 60_000,
  });
}

export function useEventParticipation(eventId) {
  return useQuery({
    queryKey: ['event', 'participation', eventId],
    queryFn: () => fetchMyEventParticipation(eventId),
    enabled: Boolean(eventId),
    staleTime: 30_000,
  });
}

export function useEventRegister(eventId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => registerForEvent(eventId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', 'participation', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', 'participants', eventId] });
    },
  });
}

export function useEventCheckIn(eventId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => checkInToEvent(eventId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', 'participation', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', 'participants', eventId] });
    },
  });
}
