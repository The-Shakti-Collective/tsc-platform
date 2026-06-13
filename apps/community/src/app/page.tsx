import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="mb-12 space-y-4 text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-primary">Sprint 1</p>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Your identity across the TSC ecosystem
        </h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Sign up, build your profile passport, and connect with communities, events, and
          collaborations — one person, one profile.
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/sign-up">Get started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/communities">Explore communities</Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Identity', 'Unified Person record with verification levels'],
          ['Passport', 'Public profile with genres, skills, and reputation'],
          ['Communities', 'Membership roles from Member to Founder'],
        ].map(([title, body]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{body}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </div>
    </div>
  );
}
