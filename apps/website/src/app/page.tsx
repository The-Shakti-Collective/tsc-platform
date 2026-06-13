import { ArrowRight, Sparkles } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { programs, siteConfig } from '@/lib/config/site';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Home',
  description: siteConfig.description,
});

export default function HomePage() {
  return (
    <div>
      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="max-w-3xl space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              The Shakti Collective
            </p>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Where artists, scenes, and communities grow together
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">{siteConfig.tagline}</p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={siteConfig.communityUrl} size="lg">
                Enter community
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/programs" variant="outline" size="lg">
                Explore programs
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 space-y-2">
          <h2 className="text-3xl font-semibold">Programs</h2>
          <p className="text-muted-foreground">
            Purpose-built paths for artists, community leaders, and live experience organizers.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {programs.map((program) => (
            <Card key={program.slug}>
              <CardHeader>
                <CardTitle>{program.title}</CardTitle>
                <CardDescription>{program.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {program.highlights.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-16 md:flex-row md:items-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">See what&apos;s happening on TSC</h2>
            <p className="max-w-xl text-muted-foreground">
              Browse public events, artists, and communities when the platform API is connected.
            </p>
          </div>
          <ButtonLink href="/discover">Open discover</ButtonLink>
        </div>
      </section>
    </div>
  );
}
