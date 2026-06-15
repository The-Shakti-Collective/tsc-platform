'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCommunityClient } from '@/hooks/use-community-client';
import { MOCK_OPPORTUNITIES, MOCK_OPPORTUNITY_DETAILS } from '@/lib/mock-data';
import { shouldUseMockData } from '@/lib/use-mock-data';

interface OpportunityDetailProps {
  id: string;
}

export function OpportunityDetail({ id }: OpportunityDetailProps) {
  const client = useCommunityClient();
  const useMock = shouldUseMockData();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['opportunities', id],
    queryFn: () => client.getMarketplaceListing(id),
    enabled: !useMock,
    retry: false,
  });

  if (!useMock && isLoading) {
    return <p className="px-4 py-12 text-center text-muted-foreground">Loading opportunity…</p>;
  }

  const mockOpp = MOCK_OPPORTUNITIES.find((o) => o.id === id);
  const opp = useMock
    ? mockOpp
    : data
      ? {
          id: data.id,
          title: data.title,
          organization: data.ownerName ?? 'Organization',
          location: data.city ?? 'Remote',
          category: data.category ?? data.listingType,
          compensation: data.budget != null ? `₹${data.budget.toLocaleString()}` : 'TBD',
        }
      : null;

  if (!opp) {
    if (!useMock && isError) notFound();
    if (!mockOpp) notFound();
  }

  const resolved = opp!;
  const detail = useMock
    ? (MOCK_OPPORTUNITY_DETAILS[id] ?? {
        overview: `${resolved.title} — full brief available after application.`,
        requirements: ['Portfolio or reel', 'Availability for timeline', 'TSC profile complete'],
        deliverables: ['As per organization brief'],
        timeline: 'See application for schedule',
        compensation: resolved.compensation,
        team: [resolved.organization],
        applicationProcess: ['Apply via TSC', 'Review within 5 business days'],
      })
    : {
        overview: data?.description ?? `${resolved.title} — apply for full brief.`,
        requirements: data?.requirements ?? ['TSC profile complete'],
        deliverables: ['As per organization brief'],
        timeline: data?.deadline ? `Deadline ${data.deadline.slice(0, 10)}` : 'Open',
        compensation: resolved.compensation,
        team: [resolved.organization],
        applicationProcess: ['Apply via TSC marketplace'],
      };

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/opportunities">← All opportunities</Link>
        </Button>
        <h1 className="font-display text-3xl font-light text-brand-teal-deep">{resolved.title}</h1>
        <p className="mt-2 text-brand-teal-deep/70">
          {resolved.organization} · {resolved.location} · {resolved.category}
        </p>
      </div>

      {(
        [
          ['Overview', detail.overview],
          ['Timeline', detail.timeline],
          ['Compensation', detail.compensation],
        ] as const
      ).map(([title, body]) => (
        <section key={title}>
          <h2 className="mb-2 font-display text-lg text-brand-teal-deep">{title}</h2>
          <p className="text-brand-teal-deep/80">{body}</p>
        </section>
      ))}

      {(
        [
          ['Requirements', detail.requirements],
          ['Deliverables', detail.deliverables],
          ['Team', detail.team],
          ['Application Process', detail.applicationProcess],
        ] as const
      ).map(([title, items]) => (
        <Card key={title} className="border-brand-teal-deep/10">
          <CardHeader>
            <CardTitle className="text-brand-teal-deep">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm text-brand-teal-deep/80">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      <Button size="lg" className="w-full bg-brand-pumpkin hover:bg-brand-amber sm:w-auto">
        Apply
      </Button>
    </div>
  );
}
