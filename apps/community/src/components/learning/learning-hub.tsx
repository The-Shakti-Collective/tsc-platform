'use client';

import { BookOpen, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MOCK_LEARNING } from '@/lib/mock-data';

const CATEGORIES = [
  'Music',
  'Film',
  'Photography',
  'Design',
  'Business',
  'Marketing',
  'AI',
  'Personal Branding',
] as const;

export function LearningHub() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-green">Learning Hub</p>
        <h1 className="mt-2 font-display text-3xl font-light text-brand-teal-deep">
          Learn from creators who have done the work
        </h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Badge
            key={cat}
            variant="outline"
            className="cursor-pointer border-brand-teal-deep/15 px-3 py-1 hover:bg-brand-green-soft/40"
          >
            {cat}
          </Badge>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {MOCK_LEARNING.map((item) => (
          <Card key={item.id} className="border-brand-teal-deep/10">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <BookOpen className="h-5 w-5 text-brand-green" />
                <Badge className="bg-brand-green-soft text-brand-teal-deep">{item.type}</Badge>
              </div>
              <CardTitle className="text-base text-brand-teal-deep">{item.title}</CardTitle>
              <CardDescription>{item.category}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs text-brand-teal-deep/60">
                <Clock className="h-3 w-3" />
                {item.duration}
              </span>
              <Button size="sm" className="cursor-pointer bg-brand-green hover:bg-brand-teal-mid">
                Start
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
