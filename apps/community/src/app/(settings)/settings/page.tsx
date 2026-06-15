'use client';

import Link from 'next/link';
import { UserProfile } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CommunityPreferencesPanel } from '@/components/settings/community-preferences';
import { isClientAuthStubEnabled } from '@/lib/clerk-env';

function StubSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="font-display text-2xl text-brand-teal-deep">Settings</h1>
        <p className="text-sm text-brand-teal-deep/60">Customize your Creator OS experience.</p>
      </div>
      <CommunityPreferencesPanel />
      <Card>
        <CardHeader>
          <CardTitle>Account (stub)</CardTitle>
          <CardDescription>
            Clerk disabled locally. Use onboarding and Passport for TSC identity fields.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button asChild variant="outline" className="cursor-pointer">
            <Link href="/onboarding">Edit profile</Link>
          </Button>
          <Button asChild variant="secondary" className="cursor-pointer">
            <Link href="/profile">View Passport</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  if (isClientAuthStubEnabled()) {
    return <StubSettingsPage />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="font-display text-2xl text-brand-teal-deep">Settings</h1>
        <p className="text-sm text-brand-teal-deep/60">Account, theme, and feed preferences.</p>
      </div>
      <CommunityPreferencesPanel />
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Sign-in methods via Clerk.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <UserProfile routing="hash" />
        </CardContent>
      </Card>
      <div className="flex gap-3">
        <Button asChild variant="outline" className="cursor-pointer">
          <Link href="/onboarding">Edit TSC profile</Link>
        </Button>
        <Button asChild variant="secondary" className="cursor-pointer">
          <Link href="/profile">View Passport</Link>
        </Button>
      </div>
    </div>
  );
}
