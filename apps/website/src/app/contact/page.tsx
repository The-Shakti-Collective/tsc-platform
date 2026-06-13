import Link from 'next/link';
import { ContactForm } from '@/components/contact/contact-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Contact',
  description: 'Contact The Shakti Collective — partnerships, programs, and platform updates.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-10 space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Contact</h1>
        <p className="max-w-2xl text-muted-foreground">
          Partnerships, program questions, or early access — send a note and we&apos;ll route it to the
          right team.
        </p>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Send a message</CardTitle>
            <CardDescription>
              Submissions are validated server-side and recorded when PostHog analytics is configured.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContactForm />
          </CardContent>
        </Card>
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            Prefer the community product directly?{' '}
            <Link href="/programs" className="text-primary underline-offset-4 hover:underline">
              Explore programs
            </Link>{' '}
            or join via the community app from the header.
          </p>
          <p>
            For API integrations, configure a scoped public API key with{' '}
            <code className="rounded bg-muted px-1">read:events</code>,{' '}
            <code className="rounded bg-muted px-1">read:artists</code>, and related scopes — then set{' '}
            <code className="rounded bg-muted px-1">TSC_PUBLIC_API_KEY</code> for the Discover page.
          </p>
        </div>
      </div>
    </div>
  );
}
