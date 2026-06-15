'use client';

import Link from 'next/link';
import { BadgeCheck, MapPin, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MOCK_FEATURED_MEMBERS } from '@/lib/mock-data';

export function MembersDirectory() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-green">Members</p>
        <h1 className="mt-2 font-display text-3xl font-light text-brand-teal-deep">
          Discover talent across India
        </h1>
        <p className="mt-2 text-brand-teal-deep/70">
          Browse verified creators — filter by role, genre, and availability on Explore.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_FEATURED_MEMBERS.map((member) => (
          <Link key={member.username} href={`/u/${member.username}`} className="cursor-pointer">
            <Card className="overflow-hidden border-brand-teal-deep/10 transition-all duration-200 hover:border-brand-green/30 hover:shadow-md">
              <div className="h-20 bg-gradient-to-r from-brand-teal-deep to-brand-green" />
              <CardContent className="relative pt-10">
                <div className="absolute -top-8 left-4 flex h-16 w-16 items-center justify-center rounded-xl border-4 border-brand-cream-wash bg-brand-green-soft text-lg font-semibold text-brand-teal-deep">
                  {member.name.charAt(0)}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-brand-teal-deep">{member.name}</p>
                    <p className="text-sm text-brand-teal-deep/60">{member.role}</p>
                  </div>
                  {member.verified ? (
                    <BadgeCheck className="h-5 w-5 text-brand-green" />
                  ) : null}
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-brand-teal-deep/50">
                  <MapPin className="h-3 w-3" />
                  {member.location}
                  <Star className="ml-auto h-3 w-3 fill-brand-amber text-brand-amber" />
                  {member.rating}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
