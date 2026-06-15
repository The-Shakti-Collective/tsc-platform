'use client';

import Link from 'next/link';
import { Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MOCK_MARKETPLACE } from '@/lib/mock-data';

export function MarketplaceHub() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-green">Marketplace</p>
        <h1 className="mt-2 font-display text-3xl font-light text-brand-teal-deep">
          Gigs, grants & creative work
        </h1>
        <p className="mt-2 text-brand-teal-deep/70">
          Unified marketplace — matched to your Passport and feed priorities.
        </p>
      </div>

      <div className="space-y-4">
        {MOCK_MARKETPLACE.map((listing) => (
          <Card key={listing.id} className="border-brand-teal-deep/10">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex gap-3">
                  <Store className="mt-1 h-5 w-5 text-brand-green" />
                  <div>
                    <CardTitle className="text-lg text-brand-teal-deep">{listing.title}</CardTitle>
                    <CardDescription>
                      {listing.organization} · {listing.location}
                    </CardDescription>
                  </div>
                </div>
                {listing.matchPercent > 0 ? (
                  <Badge className="bg-brand-green-soft text-brand-teal-deep">
                    {listing.matchPercent}% match
                  </Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="outline">{listing.category}</Badge>
                <span className="font-medium text-brand-teal-deep">{listing.compensation}</span>
              </div>
              <Button asChild size="sm" className="cursor-pointer bg-brand-green hover:bg-brand-teal-mid">
                <Link href={`/opportunities/${listing.id}`}>View listing</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
