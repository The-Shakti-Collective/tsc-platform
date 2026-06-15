import { programs, siteConfig } from '@/lib/config/site';
import { createPageMetadata } from '@/lib/seo/metadata';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';

export const metadata = createPageMetadata({
  title: 'Programs',
  description: 'Artist Path, Community Leaders, and Live Experiences — TSC programs for independent music.',
  path: '/programs',
});

export default function ProgramsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-10 space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Programs</h1>
        <p className="max-w-2xl text-muted-foreground">
          Each program connects to the same identity graph — passports, memberships, events, and
          intelligence — with workflows tuned to your role.
        </p>
      </div>
      <div className="grid gap-6">
        {programs.map((program) => {
          const externalUrl =
            'externalUrl' in program && program.externalUrl ? program.externalUrl : undefined;
          return (
            <Card key={program.slug} id={program.slug}>
              <CardHeader>
                <CardTitle>{program.title}</CardTitle>
                <CardDescription>{program.summary}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                  {program.highlights.map((item) => (
                    <li key={item} className="rounded-md border px-3 py-2">
                      {item}
                    </li>
                  ))}
                </ul>
                {externalUrl ? (
                  <ButtonLink href={externalUrl}>
                    Visit {program.title}
                  </ButtonLink>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="mt-12 rounded-lg border bg-muted/30 p-8">
        <h2 className="text-xl font-semibold">Ready to participate?</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Join the community app to create your passport, follow scenes, and access program workflows.
        </p>
        <div className="mt-4">
          <ButtonLink href={siteConfig.communityUrl}>Go to {siteConfig.shortName} Community</ButtonLink>
        </div>
      </div>
    </div>
  );
}
