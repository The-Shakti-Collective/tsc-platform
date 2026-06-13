import { siteConfig } from '@/lib/config/site';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'About',
  description: 'About The Shakti Collective — mission, platform, and how we support independent music.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight">About {siteConfig.name}</h1>
      <div className="mt-8 space-y-6 text-muted-foreground">
        <p>
          {siteConfig.name} is building infrastructure for India&apos;s independent music ecosystem — not
          another siloed social network, but an operating system that connects identity, community,
          events, and opportunity.
        </p>
        <p>
          Artists get passports and intelligence. Community leaders get membership and programming tools.
          Fans discover experiences with context. Operators get signal instead of spreadsheet chaos.
        </p>
        <p>
          This marketing site is the public front door at{' '}
          <span className="font-medium text-foreground">theshakticollective.in</span>. The community app is
          where relationships deepen, and CoreKnot supports operator workflows during the migration from
          legacy tooling.
        </p>
        <p>
          We ship in the monorepo today and migrate to dedicated repositories as each surface reaches
          production maturity — API on Railway, frontends on Vercel, data on Neon and Upstash.
        </p>
      </div>
    </div>
  );
}
