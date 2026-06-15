'use client';

import Link from 'next/link';
import { Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MOCK_AI_AGENTS } from '@/lib/mock-data';

export function AiAgentsHub() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-green">AI Agents</p>
        <h1 className="mt-2 font-display text-3xl font-light text-brand-teal-deep">
          Your creative co-pilots
        </h1>
        <p className="mt-2 text-brand-teal-deep/70">
          Agents that match, brief, and scout — wired to your Passport and goals.
        </p>
      </div>

      <div className="space-y-4">
        {MOCK_AI_AGENTS.map((agent) => (
          <Card key={agent.id} className="border-brand-teal-deep/10">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-green-soft">
                  <Bot className="h-5 w-5 text-brand-green" />
                </div>
                <div>
                  <CardTitle className="text-brand-teal-deep">{agent.name}</CardTitle>
                  <CardDescription>{agent.description}</CardDescription>
                </div>
              </div>
              <Badge variant={agent.status === 'Active' ? 'default' : 'outline'}>
                {agent.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <Button
                size="sm"
                variant="outline"
                className="cursor-pointer border-brand-teal-deep/20"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Run agent
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-brand-teal-deep/10 bg-brand-green-soft/30">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <p className="text-sm text-brand-teal-deep">
            Try Collaboration Matcher on a live brief
          </p>
          <Button asChild className="cursor-pointer bg-brand-green hover:bg-brand-teal-mid">
            <Link href="/collaborations">Open Collaboration Engine</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
