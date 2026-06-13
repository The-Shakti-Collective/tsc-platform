import { DiscoverSection } from '@/components/discover/discover-section';
import {
  fetchFeaturedArtists,
  fetchFeaturedCommunities,
  fetchFeaturedEvents,
  isPublicApiConfigured,
} from '@/lib/api/public-api';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Discover',
  description: 'Public events, artists, and communities from The Shakti Collective platform.',
  path: '/discover',
});

export const revalidate = 300;

export default async function DiscoverPage() {
  const apiConfigured = isPublicApiConfigured();
  const [events, artists, communities] = apiConfigured
    ? await Promise.all([fetchFeaturedEvents(), fetchFeaturedArtists(), fetchFeaturedCommunities()])
    : [null, null, null];

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-10 space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Discover</h1>
        <p className="max-w-2xl text-muted-foreground">
          Live listings from the TSC public API — events, artists, and communities shaping independent
          music in India.
        </p>
      </div>
      <DiscoverSection
        events={events}
        artists={artists}
        communities={communities}
        apiConfigured={apiConfigured}
      />
    </div>
  );
}
