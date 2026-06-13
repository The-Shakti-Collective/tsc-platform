'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { PersonPassport } from '@/components/passport/person-passport';
import { Button } from '@/components/ui/button';
import { useCommunityClient } from '@/hooks/use-community-client';

export default function ProfilePage() {
  const client = useCommunityClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => client.getMyProfile(),
  });

  if (isLoading) {
    return <p className="px-4 py-12 text-center text-muted-foreground">Loading profile…</p>;
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="mb-4 text-muted-foreground">
          Complete onboarding or ensure the API is running with your Clerk user linked.
        </p>
        <Button asChild>
          <Link href="/onboarding">Finish onboarding</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-12">
      <PersonPassport data={data} />
      <div className="mx-auto flex max-w-xl justify-center gap-3">
        {data.username ? (
          <Button asChild variant="outline">
            <Link href={`/u/${data.username}`}>Public view</Link>
          </Button>
        ) : null}
        <Button asChild variant="secondary">
          <Link href="/settings">Settings</Link>
        </Button>
      </div>
    </div>
  );
}
