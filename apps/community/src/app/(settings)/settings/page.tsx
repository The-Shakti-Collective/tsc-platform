'use client';

import Link from 'next/link';
import { UserProfile } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
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
