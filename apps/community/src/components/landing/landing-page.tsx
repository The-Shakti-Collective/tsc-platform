import Link from 'next/link';
import {
  Camera,
  Clapperboard,
  Mic2,
  Music2,
  Palette,
  PenLine,
  Scissors,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  Video,
} from 'lucide-react';
import { BrandPattern } from '@/components/brand/brand-pattern';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CREATOR_CATEGORIES,
  FEATURED_OPPORTUNITIES,
  LIVE_ACTIVITY_STATS,
  MOCK_FEATURED_MEMBERS,
  MOCK_SUCCESS_STORIES,
} from '@/lib/mock-data';

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  music: Music2,
  camera: Camera,
  video: Video,
  scissors: Scissors,
  sliders: SlidersHorizontal,
  briefcase: Users,
  palette: Palette,
  pen: PenLine,
  sparkles: Sparkles,
  clapperboard: Clapperboard,
};

export function LandingPage() {
  return (
    <div className="tm-marketing-page">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-brand-teal-deep/10">
        <BrandPattern variant="hero" className="pointer-events-none absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-cream-wash via-brand-cream-wash to-brand-green-soft/40" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-brand-green">
            The Shakti Collective
          </p>
          <h1 className="max-w-4xl font-display text-4xl font-light leading-tight text-brand-teal-deep md:text-6xl">
            India&apos;s Creator Operating System
          </h1>
          <ul className="mt-8 space-y-2 text-lg text-brand-teal-deep/85 md:text-xl">
            <li className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-pumpkin" />
              Discover collaborators.
            </li>
            <li className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-pumpkin" />
              Find gigs.
            </li>
            <li className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-pumpkin" />
              Build your creative identity.
            </li>
          </ul>
          <p className="mt-6 text-sm font-medium uppercase tracking-wider text-brand-teal-mid">
            Join 10,000+ creators
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" className="cursor-pointer bg-brand-pumpkin hover:bg-brand-amber">
              <Link href="/sign-up">Create Your Passport</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="cursor-pointer border-brand-teal-deep/20 text-brand-teal-deep hover:bg-brand-cream-muted"
            >
              <Link href="/opportunities">Explore Opportunities</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Creator Categories */}
      <section className="border-b border-brand-teal-deep/10 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-2 font-display text-3xl font-light text-brand-teal-deep">
            Creator Categories
          </h2>
          <p className="mb-10 text-brand-teal-deep/70">
            Every discipline. One operating system for creative careers.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {CREATOR_CATEGORIES.map(({ label, icon }) => {
              const Icon = categoryIcons[icon] ?? Sparkles;
              return (
                <div
                  key={label}
                  className="group cursor-pointer rounded-xl border border-brand-teal-deep/10 bg-brand-cream-wash/80 p-4 transition-colors duration-200 hover:border-brand-green/30 hover:bg-brand-green-soft/40"
                >
                  <Icon className="mb-3 h-6 w-6 text-brand-green transition-colors group-hover:text-brand-teal-mid" />
                  <p className="text-sm font-medium text-brand-teal-deep">{label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Live Activity */}
      <section className="border-b border-brand-teal-deep/10 bg-brand-teal-deep py-14 text-brand-cream-wash">
        <div className="mx-auto max-w-6xl px-4">
          <p className="mb-8 text-sm font-medium uppercase tracking-[0.2em] text-brand-cream/70">
            Live Activity
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            {LIVE_ACTIVITY_STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="font-display text-5xl font-light text-brand-cream">{value}</p>
                <p className="mt-2 text-brand-cream/75">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-2 font-display text-3xl font-light text-brand-teal-deep">
            Success Stories
          </h2>
          <p className="mb-10 text-brand-teal-deep/70">Real creators. Real outcomes.</p>
          <div className="grid gap-6 md:grid-cols-3">
            {MOCK_SUCCESS_STORIES.map((story) => (
              <Card
                key={story.name}
                className="cursor-pointer border-brand-teal-deep/10 transition-shadow duration-200 hover:shadow-md"
              >
                <CardHeader>
                  <CardTitle className="text-brand-teal-deep">{story.name}</CardTitle>
                  <CardDescription>{story.role}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-brand-teal-deep/80">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-pumpkin">
                      Before
                    </p>
                    <p>{story.before}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-green">
                      Discovered
                    </p>
                    <p>{story.discovered}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-teal-mid">
                      Result
                    </p>
                    <p>{story.result}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Opportunities */}
      <section className="border-y border-brand-teal-deep/10 bg-brand-green-soft/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-light text-brand-teal-deep">
                Featured Opportunities
              </h2>
              <p className="mt-2 text-brand-teal-deep/70">Latest gigs, projects, and grants.</p>
            </div>
            <Button asChild variant="outline" className="cursor-pointer border-brand-teal-deep/20">
              <Link href="/opportunities">View all</Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {FEATURED_OPPORTUNITIES.slice(0, 3).map((opp) => (
              <Card
                key={opp.id}
                className="cursor-pointer border-brand-teal-deep/10 transition-colors duration-200 hover:border-brand-green/30"
              >
                <CardHeader className="pb-2">
                  <Badge className="mb-2 w-fit bg-brand-pumpkin-soft text-brand-espresso">
                    {opp.category}
                  </Badge>
                  <CardTitle className="text-lg text-brand-teal-deep">{opp.title}</CardTitle>
                  <CardDescription>
                    {opp.organization} · {opp.location}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-sm">
                  <span className="font-medium text-brand-teal-deep">{opp.compensation}</span>
                  <Button asChild size="sm" className="cursor-pointer bg-brand-green hover:bg-brand-teal-mid">
                    <Link href={`/opportunities/${opp.id}`}>View</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Members */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-2 font-display text-3xl font-light text-brand-teal-deep">
            Featured Members
          </h2>
          <p className="mb-10 text-brand-teal-deep/70">Discover talent across India.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MOCK_FEATURED_MEMBERS.map((member) => (
              <Link
                key={member.username}
                href={`/u/${member.username}`}
                className="group cursor-pointer"
              >
                <Card className="overflow-hidden border-brand-teal-deep/10 transition-all duration-200 hover:border-brand-green/30 hover:shadow-md">
                  <div className="h-24 bg-gradient-to-br from-brand-teal-deep via-brand-teal-mid to-brand-green" />
                  <CardContent className="relative pt-10">
                    <div className="absolute -top-8 left-4 flex h-16 w-16 items-center justify-center rounded-full border-4 border-brand-cream-wash bg-brand-green-soft text-lg font-semibold text-brand-teal-deep">
                      {member.name.charAt(0)}
                    </div>
                    <p className="font-medium text-brand-teal-deep group-hover:text-brand-green">
                      {member.name}
                    </p>
                    <p className="text-sm text-brand-teal-deep/60">{member.role}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-brand-teal-deep/50">
                      <span>{member.location}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
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
      </section>

      {/* Passport CTA */}
      <section className="relative overflow-hidden bg-brand-teal-deep py-20 text-brand-cream-wash">
        <BrandPattern variant="footer" className="pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <Mic2 className="mx-auto mb-6 h-10 w-10 text-brand-cream/80" />
          <h2 className="font-display text-3xl font-light md:text-4xl">
            Your creative career should not depend on luck.
          </h2>
          <p className="mt-4 text-brand-cream/75">
            Build your Creator Passport — identity, portfolio, reputation, and opportunities in one
            place.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 cursor-pointer bg-brand-pumpkin text-white hover:bg-brand-amber"
          >
            <Link href="/sign-up">Create Your Passport</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
