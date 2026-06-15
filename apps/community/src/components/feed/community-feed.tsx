'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_COMMUNITY_ACTIVITY, MOCK_DASHBOARD, MOCK_OPPORTUNITIES } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const FEED_TABS = [
  'For You',
  'Collaborations',
  'Projects',
  'Opportunities',
  'Events',
  'Learning',
] as const;

type FeedTab = (typeof FEED_TABS)[number];

export function CommunityFeed() {
  const [activeTab, setActiveTab] = useState<FeedTab>('For You');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-light text-brand-teal-deep">Activity</h1>
        <p className="text-sm text-brand-teal-deep/60">
          Curated updates — not an endless scroll.
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-brand-teal-deep/10 pb-0">
        {FEED_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'cursor-pointer shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors duration-200',
              activeTab === tab
                ? 'border-brand-green text-brand-teal-deep'
                : 'border-transparent text-brand-teal-deep/60 hover:text-brand-teal-deep',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'For You' ? (
        <div className="space-y-4">
          {MOCK_COMMUNITY_ACTIVITY.map((item) => (
            <Card key={item.id} className="border-brand-teal-deep/10">
              <CardContent className="flex items-center justify-between pt-6 text-sm">
                <p className="text-brand-teal-deep/85">{item.text}</p>
                <span className="shrink-0 text-xs text-brand-teal-deep/50">{item.time}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {activeTab === 'Opportunities' ? (
        <div className="space-y-4">
          {MOCK_OPPORTUNITIES.slice(0, 4).map((opp) => (
            <Card key={opp.id} className="border-brand-teal-deep/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-brand-teal-deep">{opp.title}</CardTitle>
                <CardDescription>
                  {opp.organization} · {opp.compensation}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild size="sm" className="cursor-pointer bg-brand-green hover:bg-brand-teal-mid">
                  <Link href={`/opportunities/${opp.id}`}>View opportunity</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {activeTab === 'Events' ? (
        <div className="space-y-4">
          {MOCK_DASHBOARD.events.map((ev) => (
            <Card key={ev.id} className="border-brand-teal-deep/10">
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="font-medium text-brand-teal-deep">{ev.title}</p>
                  <p className="text-sm text-brand-teal-deep/60">{ev.type}</p>
                </div>
                <span className="text-sm text-brand-pumpkin">{ev.date}</span>
              </CardContent>
            </Card>
          ))}
          <Button asChild variant="ghost" size="sm" className="cursor-pointer text-brand-green">
            <Link href="/events">
              All events
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : null}

      {['Collaborations', 'Projects', 'Learning'].includes(activeTab) ? (
        <Card className="border-brand-teal-deep/10 bg-brand-green-soft/20">
          <CardContent className="py-8 text-center text-sm text-brand-teal-deep/70">
            <p className="font-medium text-brand-teal-deep">{activeTab} feed</p>
            <p className="mt-2">Personalized {activeTab.toLowerCase()} updates appear here once your Passport is complete.</p>
            <Button asChild size="sm" className="mt-4 cursor-pointer bg-brand-green hover:bg-brand-teal-mid">
              <Link href="/profile">Complete Passport</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
