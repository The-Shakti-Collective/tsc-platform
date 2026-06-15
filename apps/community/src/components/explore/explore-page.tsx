'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BadgeCheck, MapPin, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EXPLORE_FILTERS, MOCK_FEATURED_MEMBERS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export function ExplorePage() {
  const [activeFilter, setActiveFilter] = useState<string>('Trending');

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-green">Explore</p>
        <h1 className="mt-2 font-display text-3xl font-light text-brand-teal-deep">
          Discovery Engine
        </h1>
        <p className="mt-2 max-w-2xl text-brand-teal-deep/70">
          Find collaborators, hire talent, and build your network — not another member directory.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {EXPLORE_FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={cn(
              'cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-200',
              activeFilter === filter
                ? 'border-brand-green bg-brand-green text-brand-cream-wash'
                : 'border-brand-teal-deep/15 text-brand-teal-deep/75 hover:border-brand-green/30 hover:bg-brand-green-soft/40',
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      <p className="text-sm text-brand-teal-deep/60">
        Showing creators for <strong className="text-brand-teal-deep">{activeFilter}</strong>
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_FEATURED_MEMBERS.map((member) => (
          <Link key={member.username} href={`/u/${member.username}`} className="cursor-pointer">
            <Card className="group overflow-hidden border-brand-teal-deep/10 transition-all duration-200 hover:border-brand-green/30 hover:shadow-lg">
              <div className="relative h-28 bg-gradient-to-br from-brand-teal-deep via-brand-teal-mid to-brand-green">
                {member.verified ? (
                  <Badge className="absolute right-3 top-3 gap-1 bg-brand-cream-wash/90 text-brand-teal-deep">
                    <BadgeCheck className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : null}
              </div>
              <CardContent className="relative px-4 pb-5 pt-12">
                <div className="absolute -top-10 left-4 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-brand-cream-wash bg-brand-green-soft text-2xl font-semibold text-brand-teal-deep shadow-sm">
                  {member.name.charAt(0)}
                </div>
                <h3 className="font-display text-lg text-brand-teal-deep group-hover:text-brand-green">
                  {member.name}
                </h3>
                <p className="text-sm text-brand-teal-deep/70">{member.role}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-brand-teal-deep/60">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {member.location}
                  </span>
                  <span>·</span>
                  <span>{member.genre}</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5 font-medium text-brand-teal-deep">
                    <Star className="h-3 w-3 fill-brand-amber text-brand-amber" />
                    {member.rating}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
