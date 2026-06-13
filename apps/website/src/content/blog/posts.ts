export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readingMinutes: number;
  body: string[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'why-we-built-the-shakti-collective',
    title: 'Why we built The Shakti Collective',
    excerpt:
      'India’s independent music ecosystem is rich in talent but fragmented in tooling. TSC unifies identity, community, and opportunity.',
    publishedAt: '2025-11-12',
    readingMinutes: 4,
    body: [
      'Independent artists in India juggle spreadsheets, DMs, and disconnected platforms to book gigs, grow communities, and understand their audiences.',
      'The Shakti Collective (TSC) is an operating system for that work: one person record, one passport, many communities and events.',
      'We are building in the open — starting with community identity, event intelligence, and curator tools that respect how scenes actually grow.',
    ],
  },
  {
    slug: 'community-first-growth',
    title: 'Community-first growth for independent scenes',
    excerpt:
      'Scenes scale when curators, venues, and artists share context. TSC gives community leaders membership and programming primitives.',
    publishedAt: '2026-01-08',
    readingMinutes: 3,
    body: [
      'Strong scenes are not just follower counts — they are recurring gatherings, shared rituals, and trust between artists and fans.',
      'TSC Community gives leaders roles, membership tiers, and discovery surfaces so programming stays visible and measurable.',
      'The marketing site is the front door; the community app is where relationships deepen.',
    ],
  },
  {
    slug: 'events-with-signal-not-noise',
    title: 'Events with signal, not noise',
    excerpt:
      'Capacity, supporter visibility, and post-show intelligence help organizers iterate instead of guessing.',
    publishedAt: '2026-03-02',
    readingMinutes: 3,
    body: [
      'Every event teaches something: who showed up, who supported, what resonated.',
      'TSC connects public discovery with backstage intelligence so organizers can repeat what works in each city.',
      'When the public API is configured, this site surfaces live events directly from the platform API.',
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
