import type { PublicArtistListPayload, PublicCommunityListPayload, PublicEventListPayload } from '@tsc/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function DiscoverSection({
  events,
  artists,
  communities,
  apiConfigured,
}: {
  events: PublicEventListPayload | null;
  artists: PublicArtistListPayload | null;
  communities: PublicCommunityListPayload | null;
  apiConfigured: boolean;
}) {
  if (!apiConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Live platform data</CardTitle>
          <CardDescription>
            Set <code className="rounded bg-muted px-1">TSC_PUBLIC_API_KEY</code> in your environment to
            load events, artists, and communities from the TSC public API.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const hasData =
    (events?.items.length ?? 0) > 0 ||
    (artists?.items.length ?? 0) > 0 ||
    (communities?.items.length ?? 0) > 0;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No public listings yet</CardTitle>
          <CardDescription>
            The API is reachable but returned no published records. Seed data or publish content in the
            platform to populate this page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-10">
      {events && events.items.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Upcoming events</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.items.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <CardDescription>
                    {[event.city, new Date(event.startsAt).toLocaleDateString()].filter(Boolean).join(' · ')}
                  </CardDescription>
                </CardHeader>
                {event.slug ? (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">/{event.slug}</p>
                  </CardContent>
                ) : null}
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {artists && artists.items.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Featured artists</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {artists.items.map((artist) => (
              <Card key={artist.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{artist.displayName ?? artist.name}</CardTitle>
                  <CardDescription>
                    {[artist.city, artist.genres?.slice(0, 2).join(', ')].filter(Boolean).join(' · ')}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {communities && communities.items.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Communities</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {communities.items.map((community) => (
              <Card key={community.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{community.name}</CardTitle>
                  <CardDescription>{community.city ?? community.slug}</CardDescription>
                </CardHeader>
                {community.description ? (
                  <CardContent>
                    <p className="line-clamp-3 text-sm text-muted-foreground">{community.description}</p>
                  </CardContent>
                ) : null}
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
