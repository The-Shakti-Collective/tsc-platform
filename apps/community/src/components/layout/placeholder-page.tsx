import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Card className="overflow-hidden border-brand-teal-deep/10 bg-brand-cream-wash/80">
        <CardHeader className="border-b border-brand-teal-deep/10 bg-gradient-to-r from-brand-green-soft/40 to-brand-cream-wash">
          <div className="flex items-center gap-2 text-brand-green">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">Coming soon</span>
          </div>
          <CardTitle className="font-display text-2xl font-light text-brand-teal-deep">
            {title}
          </CardTitle>
          {description ? (
            <CardDescription className="text-brand-teal-deep/70">{description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-brand-teal-deep/80">
            This section is on the roadmap. Join the collective to get early access as features
            roll out.
          </p>
          <Button asChild className="bg-brand-green hover:bg-brand-teal-mid">
            <Link href="/sign-up">
              Join The Collective
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
