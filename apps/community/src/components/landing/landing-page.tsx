import Link from 'next/link';
import {
  Briefcase,
  Clapperboard,
  Handshake,
  Mic2,
  Music2,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { BrandPattern } from '@/components/brand/brand-pattern';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_SUCCESS_STORIES } from '@/lib/mock-data';

const trustStats = [
  'Active creative professionals',
  'Opportunities shared monthly',
  'Collaborations facilitated',
  'Industry experts contributing knowledge',
];

const whyJoin = [
  {
    title: 'For Artists',
    body: 'Build visibility and discover opportunities.',
    icon: Sparkles,
  },
  {
    title: 'For Musicians',
    body: 'Find collaborators, producers, venues and audiences.',
    icon: Music2,
  },
  {
    title: 'For Filmmakers',
    body: 'Build crews, showcase work and access projects.',
    icon: Clapperboard,
  },
  {
    title: 'For Industry Professionals',
    body: 'Connect with verified talent and emerging creators.',
    icon: Users,
  },
];

const opportunityCards = [
  { title: 'Gigs', body: 'Live performances and events.', icon: Mic2 },
  { title: 'Projects', body: 'Films, campaigns, music releases, content productions.', icon: Clapperboard },
  { title: 'Collaborations', body: 'Cross-disciplinary partnerships.', icon: Handshake },
  { title: 'Mentorship', body: 'Sessions with experienced professionals.', icon: Users },
  { title: 'Funding', body: 'Grants, sponsorships and support programs.', icon: Wallet },
];

const partnerLogos = [
  'Partner institutions',
  'Brands',
  'Production houses',
  'Artist collectives',
];

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
          <h1 className="max-w-3xl font-display text-4xl font-light leading-tight text-brand-teal-deep md:text-6xl">
            India&apos;s Creative Career Network
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-brand-teal-deep/80">
            A professional ecosystem where artists, musicians, filmmakers, creators, managers,
            producers, venues, labels and brands collaborate, discover opportunities and build
            sustainable creative careers.
          </p>
          <p className="mt-4 max-w-2xl text-brand-teal-deep/70">
            The Shakti Collective brings together emerging and established creative professionals
            into one trusted network. Build your profile, discover opportunities, join projects,
            learn from industry leaders and grow through meaningful collaborations.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-brand-green hover:bg-brand-teal-mid">
              <Link href="/sign-up">Join The Collective</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-brand-teal-deep/20 text-brand-teal-deep hover:bg-brand-cream-muted"
            >
              <Link href="/opportunities">Explore Opportunities</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-b border-brand-teal-deep/10 bg-brand-cream-muted/50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-3xl font-light text-brand-teal-deep">
            Built by creators. Backed by industry experience.
          </h2>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {trustStats.map((item) => (
              <li key={item} className="flex items-center gap-2 text-brand-teal-deep/80">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-pumpkin" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap gap-4">
            {partnerLogos.map((logo) => (
              <div
                key={logo}
                className="rounded-lg border border-brand-teal-deep/10 bg-brand-cream-wash px-6 py-4 text-sm font-medium text-brand-teal-deep/50"
              >
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Join */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-10 font-display text-3xl font-light text-brand-teal-deep">Why Join</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {whyJoin.map(({ title, body, icon: Icon }) => (
              <Card key={title} className="border-brand-teal-deep/10 bg-brand-cream-wash/80">
                <CardHeader>
                  <Icon className="mb-2 h-8 w-8 text-brand-green" />
                  <CardTitle className="text-brand-teal-deep">{title}</CardTitle>
                  <CardDescription className="text-brand-teal-deep/70">{body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Opportunity Showcase */}
      <section className="border-y border-brand-teal-deep/10 bg-brand-green-soft/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-10 font-display text-3xl font-light text-brand-teal-deep">
            Opportunity Showcase
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {opportunityCards.map(({ title, body, icon: Icon }) => (
              <Card key={title} className="border-brand-teal-deep/10">
                <CardHeader>
                  <Icon className="mb-2 h-7 w-7 text-brand-pumpkin" />
                  <CardTitle className="text-lg text-brand-teal-deep">{title}</CardTitle>
                  <CardDescription>{body}</CardDescription>
                </CardHeader>
              </Card>
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
          <p className="mb-10 text-brand-teal-deep/70">Real member journeys.</p>
          <div className="grid gap-6 md:grid-cols-3">
            {MOCK_SUCCESS_STORIES.map((story) => (
              <Card key={story.name} className="border-brand-teal-deep/10">
                <CardHeader>
                  <CardTitle className="text-brand-teal-deep">{story.name}</CardTitle>
                  <CardDescription>{story.role}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-brand-teal-deep/80">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-pumpkin">
                      Before joining
                    </p>
                    <p>{story.before}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-green">
                      Opportunity discovered
                    </p>
                    <p>{story.discovered}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-teal-mid">
                      Result achieved
                    </p>
                    <p>{story.result}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Membership CTA */}
      <section className="bg-brand-teal-deep py-20 text-brand-cream-wash">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-display text-3xl font-light md:text-4xl">
            Join India&apos;s most ambitious creative network.
          </h2>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-brand-pumpkin text-white hover:bg-brand-amber"
          >
            <Link href="/sign-up">Become a Member</Link>
          </Button>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-brand-teal-deep/10 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-display text-2xl font-light text-brand-teal-deep md:text-3xl">
            Your creative career should not depend on luck.
          </h2>
          <p className="mt-4 text-brand-teal-deep/70">
            Join a network designed to help creators discover opportunities, build meaningful
            relationships and grow professionally.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild className="bg-brand-green hover:bg-brand-teal-mid">
              <Link href="/sign-up">Join The Shakti Collective</Link>
            </Button>
            <Button asChild variant="outline" className="border-brand-teal-deep/20">
              <Link href="/opportunities">
                <Briefcase className="mr-2 h-4 w-4" />
                Explore Opportunities
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
