'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCommunityClient } from '@/hooks/use-community-client';
import { isClientAuthStubEnabled } from '@/lib/clerk-env';
import { FEATURED_OPPORTUNITIES, OPPORTUNITY_CATEGORIES } from '@/lib/mock-data';
import { shouldUseMockData } from '@/lib/use-mock-data';

function OpportunitiesListInner({ authenticated }: { authenticated: boolean }) {
  const client = useCommunityClient();
  const useMock = shouldUseMockData();
  const canFetchLive = authenticated && !useMock;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['opportunities', 'list'],
    queryFn: () => client.listMarketplaceListings({ limit: 25 }),
    enabled: canFetchLive,
    retry: false,
  });

  const opportunities = useMock
    ? FEATURED_OPPORTUNITIES
    : canFetchLive
      ? (data?.items ?? []).map((item) => ({
          id: item.id,
          title: item.title,
          organization: item.ownerName ?? 'Organization',
          location: item.city ?? 'Remote',
          compensation: item.budget != null ? `₹${item.budget.toLocaleString()}` : 'TBD',
          deadline: item.deadline?.slice(0, 10) ?? 'Open',
          matchPercent: Math.round(item.matchScore ?? 0),
          category: item.category ?? item.listingType,
        }))
      : FEATURED_OPPORTUNITIES;

  const showFeaturedNote = !useMock && !authenticated;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <section>
        <h1 className="font-display text-3xl font-light text-brand-teal-deep">
          Find your next opportunity.
        </h1>
        <p className="mt-2 text-brand-teal-deep/70">
          Gigs, projects, grants, collaborations — matched to your creative career goals.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Input placeholder="Search opportunities…" className="max-w-md" />
          {['Location', 'Compensation', 'Remote', 'Deadline', 'Experience'].map((f) => (
            <Button key={f} variant="outline" size="sm" className="border-brand-teal-deep/15">
              {f}
            </Button>
          ))}
        </div>
      </section>

      {showFeaturedNote ? (
        <div className="rounded-lg border border-brand-teal-deep/10 bg-brand-green-soft/40 px-4 py-3 text-sm text-brand-teal-deep">
          Featured opportunities below.{' '}
          <Link href="/sign-in" className="font-medium text-brand-green underline-offset-2 hover:underline">
            Sign in
          </Link>{' '}
          to see personalized matches from the live marketplace.
        </div>
      ) : null}

      {canFetchLive && isError ? (
        <p className="text-sm text-amber-800">
          Could not load live opportunities. Showing featured listings while we reconnect to the
          Platform API.
        </p>
      ) : null}

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-teal-deep/60">
          Categories
        </h2>
        <div className="flex flex-wrap gap-2">
          {(useMock || showFeaturedNote
            ? OPPORTUNITY_CATEGORIES
            : [...new Set(opportunities.map((o) => o.category))]
          )
            .filter(Boolean)
            .map((cat) => (
              <Badge key={cat} variant="secondary" className="bg-brand-cream-muted">
                {cat}
              </Badge>
            ))}
        </div>
      </section>

      <section className="space-y-4">
        {isLoading && canFetchLive ? (
          <p className="text-muted-foreground">Loading opportunities…</p>
        ) : opportunities.length === 0 ? (
          <p className="text-muted-foreground">No opportunities published yet.</p>
        ) : (
          opportunities.map((opp) => (
            <Card key={opp.id} className="border-brand-teal-deep/10">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Badge variant="outline" className="mb-2">
                      {opp.category}
                    </Badge>
                    <CardTitle className="text-brand-teal-deep">{opp.title}</CardTitle>
                    <CardDescription>
                      {opp.organization} · {opp.location}
                    </CardDescription>
                  </div>
                  {opp.matchPercent > 0 ? (
                    <Badge className="bg-brand-green-soft text-brand-teal-deep">
                      {opp.matchPercent}% match
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm">{opp.compensation}</span>
                <span className="text-sm text-muted-foreground">Deadline {opp.deadline}</span>
                <Button asChild size="sm" className="bg-brand-green hover:bg-brand-teal-mid">
                  <Link href={`/opportunities/${opp.id}`}>View details</Link>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}

function OpportunitiesListClerk() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <p className="px-4 py-12 text-center text-muted-foreground">Loading opportunities…</p>
    );
  }

  return <OpportunitiesListInner authenticated={isSignedIn} />;
}

export function OpportunitiesList() {
  if (isClientAuthStubEnabled()) {
    return <OpportunitiesListInner authenticated />;
  }

  return <OpportunitiesListClerk />;
}
