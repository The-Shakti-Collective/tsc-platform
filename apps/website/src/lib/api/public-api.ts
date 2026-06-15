import type {
  PublicArtistListPayload,
  PublicCommunityListPayload,
  PublicEventListPayload,
} from '@tsc/types';
import { assertPlatformApiUrl } from '@/lib/api/platform-api-url';

const API_KEY_HEADER = 'x-tsc-api-key';

function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
  return assertPlatformApiUrl(url);
}

function getPublicApiKey(): string | undefined {
  return process.env.TSC_PUBLIC_API_KEY?.trim() || undefined;
}

export function isPublicApiConfigured(): boolean {
  return Boolean(getPublicApiKey());
}

async function publicFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const apiKey = getPublicApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        [API_KEY_HEADER]: apiKey,
        ...(init?.headers ?? {}),
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchFeaturedEvents(): Promise<PublicEventListPayload | null> {
  return publicFetch<PublicEventListPayload>('/public/v1/events?page=1&limit=6');
}

export async function fetchFeaturedArtists(): Promise<PublicArtistListPayload | null> {
  return publicFetch<PublicArtistListPayload>('/public/v1/artists?page=1&limit=6');
}

export async function fetchFeaturedCommunities(): Promise<PublicCommunityListPayload | null> {
  return publicFetch<PublicCommunityListPayload>('/public/v1/communities?page=1&limit=6');
}
