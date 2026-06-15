'use client';

import Link from 'next/link';
import { UserProfile } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isClientAuthStubEnabled } from '@/lib/clerk-env';

function StubSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Account settings (stub)</CardTitle>
          <CardDescription>
            Clerk is disabled in local stub mode. Use onboarding and profile for TSC identity fields.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Set real Clerk keys or disable{' '}
            <code className="rounded bg-muted px-1">TSC_AUTH_STUB</code> for hosted account management.
          </p>
        </CardContent>
      </Card>
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/onboarding">Edit TSC profile</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/profile">View passport</Link>
        </Button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  if (isClientAuthStubEnabled()) {
    return <StubSettingsPage />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Account settings</CardTitle>
          <CardDescription>Manage sign-in methods, email, and phone via Clerk.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <UserProfile routing="hash" />
        </CardContent>
      </Card>
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/onboarding">Edit TSC profile</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/profile">View passport</Link>
        </Button>
      </div>
    </div>
  );
}
