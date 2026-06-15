'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCommunityClient } from '@/hooks/use-community-client';
import { MOCK_DASHBOARD } from '@/lib/mock-data';
import { shouldUseMockData } from '@/lib/use-mock-data';

export function MemberDashboard() {
  const client = useCommunityClient();
  const useMock = shouldUseMockData();

  const profileQuery = useQuery({
    queryKey: ['dashboard', 'profile'],
    queryFn: () => client.getMyProfile(),
    enabled: !useMock,
    retry: false,
  });

  const listingsQuery = useQuery({
    queryKey: ['dashboard', 'listings'],
    queryFn: () => client.listMarketplaceListings({ limit: 3 }),
    enabled: !useMock,
    retry: false,
  });

  const displayName =
    (useMock ? MOCK_DASHBOARD.displayName : profileQuery.data?.displayName) ?? 'Member';
  const reputationScore = useMock
    ? MOCK_DASHBOARD.reputationScore
    : (profileQuery.data?.reputationScore ?? 0);
  const membershipTier = useMock ? MOCK_DASHBOARD.membershipTier : 'Member';
  const opportunities = useMock
    ? MOCK_DASHBOARD.opportunities
    : (listingsQuery.data?.items ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        organization: item.ownerName ?? 'Organization',
        location: item.city ?? 'Remote',
        compensation: item.budget != null ? `₹${item.budget.toLocaleString()}` : 'TBD',
        deadline: item.deadline?.slice(0, 10) ?? 'Open',
        matchPercent: Math.round(item.matchScore ?? 0),
        category: item.category ?? item.listingType,
      }));

  const snapshot = useMock
    ? MOCK_DASHBOARD.snapshot
    : {
        profileStrength: 0,
        opportunitiesAvailable: listingsQuery.data?.items.length ?? 0,
        collaborationRequests: 0,
        tasksDue: 0,
        reputationPoints: reputationScore,
      };

  const recommendedActions = useMock
    ? MOCK_DASHBOARD.recommendedActions
    : [
        { id: '1', label: 'Complete portfolio', href: '/profile' },
        { id: '2', label: 'Browse opportunities', href: '/opportunities' },
      ];

  const events = useMock ? MOCK_DASHBOARD.events : [];
  const insights = useMock ? MOCK_DASHBOARD.insights : [];

  const loading = !useMock && (profileQuery.isLoading || listingsQuery.isLoading);
  const apiError = !useMock && (profileQuery.isError || listingsQuery.isError);

  if (loading) {
    return (
      <p className="px-4 py-12 text-center text-muted-foreground">Loading dashboard…</p>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      {apiError ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          Some dashboard data could not load. Ensure Platform API is running and your account is
          provisioned.
        </p>
      ) : null}

      <section className="rounded-xl border border-brand-teal-deep/10 bg-gradient-to-r from-brand-cream-wash to-brand-green-soft/40 p-6 md:p-8">
        <p className="text-sm text-brand-teal-deep/60">Good Morning,</p>
        <h1 className="font-display text-3xl font-light text-brand-teal-deep md:text-4xl">
          {displayName}
        </h1>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span className="rounded-md bg-brand-cream-wash px-3 py-1 text-brand-teal-deep">
            Reputation: <strong>{reputationScore.toLocaleString()}</strong>
          </span>
          <Badge variant="secondary" className="bg-brand-green-soft text-brand-teal-deep">
            {membershipTier}
          </Badge>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl text-brand-teal-deep">Quick Snapshot</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: 'Profile Strength', value: `${snapshot.profileStrength}%`, Icon: TrendingUp },
            {
              label: 'Opportunities Available',
              value: String(snapshot.opportunitiesAvailable),
              Icon: Sparkles,
            },
            {
              label: 'Collaboration Requests',
              value: String(snapshot.collaborationRequests),
              Icon: CheckCircle2,
            },
            { label: 'Tasks Due', value: String(snapshot.tasksDue), Icon: Calendar },
            {
              label: 'Reputation Points',
              value: snapshot.reputationPoints.toLocaleString(),
              Icon: Sparkles,
            },
          ].map(({ label, value, Icon }) => (
            <Card key={label} className="border-brand-teal-deep/10">
              <CardContent className="pt-6">
                <Icon className="mb-2 h-5 w-5 text-brand-green" />
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-2xl font-semibold text-brand-teal-deep">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-1">
          <h2 className="mb-4 font-display text-xl text-brand-teal-deep">Recommended Actions</h2>
          <Card className="border-brand-teal-deep/10">
            <CardContent className="divide-y pt-6">
              {recommendedActions.map((action) => (
                <Link
                  key={action.id}
                  href={action.href}
                  className="flex items-center justify-between py-3 text-sm text-brand-teal-deep hover:text-brand-green"
                >
                  {action.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl text-brand-teal-deep">Opportunity Feed</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/opportunities">View all</Link>
            </Button>
          </div>
          <div className="space-y-4">
            {opportunities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No opportunities published yet.</p>
            ) : (
              opportunities.map((opp) => (
                <Card key={opp.id} className="border-brand-teal-deep/10">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg text-brand-teal-deep">{opp.title}</CardTitle>
                      {opp.matchPercent > 0 ? (
                        <Badge className="bg-brand-green-soft text-brand-teal-deep">
                          {opp.matchPercent}% match
                        </Badge>
                      ) : null}
                    </div>
                    <CardDescription>
                      {opp.organization} · {opp.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span>{opp.compensation}</span>
                    <span className="text-muted-foreground">Deadline {opp.deadline}</span>
                    <Button asChild size="sm" className="bg-brand-green hover:bg-brand-teal-mid">
                      <Link href={`/opportunities/${opp.id}`}>View</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>

      {(events.length > 0 || insights.length > 0) && (
        <div className="grid gap-8 md:grid-cols-2">
          {events.length > 0 ? (
            <section>
              <h2 className="mb-4 font-display text-xl text-brand-teal-deep">Upcoming Events</h2>
              <Card className="border-brand-teal-deep/10">
                <CardContent className="divide-y pt-6">
                  {events.map((ev) => (
                    <div key={ev.id} className="flex justify-between py-3 text-sm">
                      <div>
                        <p className="font-medium text-brand-teal-deep">{ev.title}</p>
                        <p className="text-muted-foreground">{ev.type}</p>
                      </div>
                      <span className="text-brand-pumpkin">{ev.date}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          ) : null}

          {insights.length > 0 ? (
            <section>
              <h2 className="mb-4 font-display text-xl text-brand-teal-deep">Industry Insights</h2>
              <Card className="border-brand-teal-deep/10">
                <CardContent className="divide-y pt-6">
                  {insights.map((item) => (
                    <div key={item.id} className="flex gap-3 py-3 text-sm">
                      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber" />
                      <div>
                        <p className="font-medium text-brand-teal-deep">{item.title}</p>
                        <p className="text-muted-foreground">{item.tag}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
