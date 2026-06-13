import { useQuery } from '@tanstack/react-query';
import {
  fetchPassportByArtistId,
  fetchPassportBySlug,
  fetchPublicPassport,
} from '../../lib/passportApi';

export function usePublicPassport(slug) {
  return useQuery({
    queryKey: ['passport', 'public', slug],
    queryFn: () => fetchPublicPassport(slug),
    enabled: !!slug,
  });
}

export function usePassportBySlug(slug) {
  return useQuery({
    queryKey: ['passport', slug],
    queryFn: () => fetchPassportBySlug(slug),
    enabled: !!slug,
  });
}

export function usePassportByArtistId(artistId) {
  return useQuery({
    queryKey: ['passport', 'artist', artistId],
    queryFn: () => fetchPassportByArtistId(artistId),
    enabled: !!artistId,
  });
}
