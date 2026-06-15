'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bot, MapPin, Sparkles, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MOCK_AI_MATCHES,
  MOCK_COLLABORATION_REQUEST,
  MOCK_COLLABORATIONS,
} from '@/lib/mock-data';

export function CollaborationEngine() {
  const [need, setNeed] = useState(MOCK_COLLABORATION_REQUEST.need);
  const [location, setLocation] = useState(MOCK_COLLABORATION_REQUEST.location);
  const [budget, setBudget] = useState(MOCK_COLLABORATION_REQUEST.budget);
  const [showMatches, setShowMatches] = useState(true);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-green">Collaboration Engine</p>
        <h1 className="mt-2 font-display text-3xl font-light text-brand-teal-deep">
          Matching, not posting
        </h1>
        <p className="mt-2 text-brand-teal-deep/70">
          Describe what you need — AI suggests creators who fit role, location, and budget.
        </p>
      </div>

      <Card className="border-brand-teal-deep/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-brand-teal-deep">
            <Bot className="h-5 w-5 text-brand-green" />
            New collaboration brief
          </CardTitle>
          <CardDescription>AI Matcher uses your Passport + these fields.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="need">You need</Label>
            <Input id="need" value={need} onChange={(e) => setNeed(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Available</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">Budget</Label>
            <Input id="budget" value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>
          <Button
            type="button"
            className="cursor-pointer bg-brand-green hover:bg-brand-teal-mid sm:col-span-3 sm:w-fit"
            onClick={() => setShowMatches(true)}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Find matching creators
          </Button>
        </CardContent>
      </Card>

      {showMatches ? (
        <section>
          <h2 className="mb-4 font-display text-xl text-brand-teal-deep">
            {MOCK_AI_MATCHES.length} matching creators
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {MOCK_AI_MATCHES.map((match) => (
              <Link key={match.username} href={`/u/${match.username}`} className="cursor-pointer">
                <Card className="border-brand-teal-deep/10 transition-colors duration-200 hover:border-brand-green/30">
                  <CardContent className="flex items-center justify-between pt-6">
                    <div>
                      <p className="font-medium text-brand-teal-deep">{match.name}</p>
                      <p className="text-sm text-brand-teal-deep/60">{match.role}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-brand-teal-deep/50">
                        <MapPin className="h-3 w-3" />
                        {match.location}
                      </p>
                    </div>
                    <Badge className="bg-brand-green-soft text-brand-teal-deep">{match.match}%</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-4 font-display text-xl text-brand-teal-deep">Open collaborations</h2>
        <div className="space-y-3">
          {MOCK_COLLABORATIONS.map((col) => (
            <Card key={col.id} className="border-brand-teal-deep/10">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
                <div>
                  <p className="font-medium text-brand-teal-deep">{col.title}</p>
                  <p className="text-sm text-brand-teal-deep/60">
                    {col.type} · {col.roles.join(', ')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-brand-teal-deep/70">
                    <Wallet className="h-4 w-4" />
                    {col.budget}
                  </span>
                  <Badge variant="outline">{col.status}</Badge>
                  <span className="text-brand-teal-deep/50">{col.applicants} applicants</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
