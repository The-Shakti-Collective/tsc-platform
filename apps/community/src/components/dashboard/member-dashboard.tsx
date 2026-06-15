'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Calendar,
  FolderKanban,
  Handshake,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCommunityClient } from '@/hooks/use-community-client';
import { MOCK_DASHBOARD } from '@/lib/mock-data';
import { shouldUseMockData } from '@/lib/use-mock-data';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function MemberDashboard() {
  const client = useCommunityClient();
  const useMock = shouldUseMockData();
  const [greeting, setGreeting] = useState('Welcome');

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

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

  const pulse = useMock
    ? MOCK_DASHBOARD.pulse
    : {
        collaborationMatches: 0,
        newOpportunities: listingsQuery.data?.items.length ?? 0,
        eventInvitations: 0,
        projectUpdates: 0,
      };

  const recommendedCreators = useMock ? MOCK_DASHBOARD.recommendedCreators : [];
  const trendingProjects = useMock ? MOCK_DASHBOARD.trendingProjects : [];
  const communityActivity = useMock ? MOCK_DASHBOARD.communityActivity : [];

  const opportunities = useMock
    ? MOCK_DASHBOARD.opportunities.slice(0, 2)
    : (listingsQuery.data?.items ?? []).slice(0, 2).map((item) => ({
        id: item.id,
        title: item.title,
        organization: item.ownerName ?? 'Organization',
        location: item.city ?? 'Remote',
        compensation: item.budget != null ? `₹${item.budget.toLocaleString()}` : 'TBD',
        matchPercent: Math.round(item.matchScore ?? 0),
      }));

  const loading = !useMock && (profileQuery.isLoading || listingsQuery.isLoading);
  const apiError = !useMock && (profileQuery.isError || listingsQuery.isError);

  if (loading) {
    return <p className="py-12 text-center text-muted-foreground">Loading dashboard…</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {apiError ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          Some dashboard data could not load. Showing preview data until Platform API is ready.
        </p>
      ) : null}

      <section>
        <p className="text-sm text-brand-teal-deep/60">{greeting},</p>
        <h1 className="font-display text-3xl font-light text-brand-teal-deep md:text-4xl">
          {displayName}
        </h1>
        <div className="mt-3 flex flex-wrap gap-3">
          <Badge variant="secondary" className="bg-brand-green-soft text-brand-teal-deep">
            {membershipTier}
          </Badge>
          <span className="text-sm text-brand-teal-deep/70">
            Reputation {reputationScore.toLocaleString()}
          </span>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Collaboration Matches',
            value: pulse.collaborationMatches,
            icon: Handshake,
            href: '/collaborations',
          },
          {
            label: 'New Opportunities',
            value: pulse.newOpportunities,
            icon: Sparkles,
            href: '/opportunities',
          },
          {
            label: 'Event Invitations',
            value: pulse.eventInvitations,
            icon: Calendar,
            href: '/events',
          },
          {
            label: 'Project Updates',
            value: pulse.projectUpdates,
            icon: FolderKanban,
            href: '/projects',
          },
        ].map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="cursor-pointer">
            <Card className="border-brand-teal-deep/10 transition-colors duration-200 hover:border-brand-green/30 hover:bg-brand-green-soft/20">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-green-soft">
                  <Icon className="h-5 w-5 text-brand-green" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-brand-teal-deep">{value}</p>
                  <p className="text-xs text-brand-teal-deep/60">{label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      {recommendedCreators.length > 0 ? (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl text-brand-teal-deep">Recommended Creators</h2>
            <Button asChild variant="ghost" size="sm" className="cursor-pointer text-brand-green">
              <Link href="/directory">
                Explore
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {recommendedCreators.map((creator) => (
              <Link
                key={creator.username}
                href={`/u/${creator.username}`}
                className="cursor-pointer"
              >
                <Card className="border-brand-teal-deep/10 transition-colors duration-200 hover:border-brand-green/30">
                  <CardContent className="flex items-center gap-3 pt-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-teal-deep to-brand-green text-sm font-semibold text-brand-cream-wash">
                      {creator.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-brand-teal-deep">{creator.name}</p>
                      <p className="text-xs text-brand-teal-deep/60">
                        {creator.role} · {creator.location}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {trendingProjects.length > 0 ? (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl text-brand-teal-deep">Trending Projects</h2>
            <Button asChild variant="ghost" size="sm" className="cursor-pointer">
              <Link href="/projects">View all</Link>
            </Button>
          </div>
          <div className="space-y-3">
            {trendingProjects.map((project) => (
              <Card key={project.id} className="border-brand-teal-deep/10">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-brand-teal-deep">{project.title}</p>
                      <p className="text-xs text-brand-teal-deep/60">
                        {project.team} · {project.genre}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-brand-green">{project.progress}%</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-brand-cream-muted">
                    <div
                      className="h-full rounded-full bg-brand-green transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {opportunities.length > 0 ? (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl text-brand-teal-deep">Matched Opportunities</h2>
            <Button asChild variant="ghost" size="sm" className="cursor-pointer">
              <Link href="/opportunities">View all</Link>
            </Button>
          </div>
          <div className="space-y-3">
            {opportunities.map((opp) => (
              <Card key={opp.id} className="border-brand-teal-deep/10">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base text-brand-teal-deep">{opp.title}</CardTitle>
                    {'matchPercent' in opp && opp.matchPercent > 0 ? (
                      <Badge className="bg-brand-green-soft text-brand-teal-deep">
                        {opp.matchPercent}% match
                      </Badge>
                    ) : null}
                  </div>
                  <CardDescription>
                    {opp.organization} · {opp.location}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="text-sm font-medium">{opp.compensation}</span>
                  <Button asChild size="sm" className="cursor-pointer bg-brand-green hover:bg-brand-teal-mid">
                    <Link href={`/opportunities/${opp.id}`}>View</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {communityActivity.length > 0 ? (
        <section>
          <h2 className="mb-4 font-display text-xl text-brand-teal-deep">Community Activity</h2>
          <Card className="border-brand-teal-deep/10">
            <CardContent className="divide-y pt-2">
              {communityActivity.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                  <div className="flex gap-3">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-brand-teal-mid" />
                    <p className="text-brand-teal-deep/85">{item.text}</p>
                  </div>
                  <span className="shrink-0 text-xs text-brand-teal-deep/50">{item.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section className="rounded-xl border border-brand-teal-deep/10 bg-brand-green-soft/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-brand-teal-deep">
            <TrendingUp className="h-4 w-4 text-brand-green" />
            Strengthen your Passport to unlock better matches
          </div>
          <Button asChild size="sm" className="cursor-pointer bg-brand-green hover:bg-brand-teal-mid">
            <Link href="/profile">Open Passport</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
