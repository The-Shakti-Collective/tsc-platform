'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type { PersonProfileRecord } from '@tsc/types';
import { CreatorPassport } from '@/components/passport/creator-passport';
import { Button } from '@/components/ui/button';
import { useCommunityClient } from '@/hooks/use-community-client';
import { MOCK_DASHBOARD } from '@/lib/mock-data';
import { shouldUseMockData } from '@/lib/use-mock-data';

const MOCK_PROFILE: PersonProfileRecord = {
  id: 'mock-raghav',
  displayName: MOCK_DASHBOARD.displayName,
  username: 'raghav',
  city: 'Delhi',
  bio: null,
  reputationScore: MOCK_DASHBOARD.reputationScore,
  genres: [],
  skills: [],
  links: [],
  verificationLevel: 2,
} as unknown as PersonProfileRecord;

export default function ProfilePage() {
  const client = useCommunityClient();
  const useMock = shouldUseMockData();

  const { data, isLoading, error } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => client.getMyProfile(),
    enabled: !useMock,
    retry: false,
  });

  if (useMock) {
    return (
      <div className="space-y-6 px-4 py-6">
        <CreatorPassport data={MOCK_PROFILE} />
        <div className="mx-auto flex max-w-4xl justify-center gap-3 pb-12">
          <Button asChild variant="outline" className="cursor-pointer">
            <Link href="/u/raghav">Public view</Link>
          </Button>
          <Button asChild variant="secondary" className="cursor-pointer">
            <Link href="/reputation">Reputation</Link>
          </Button>
          <Button asChild variant="secondary" className="cursor-pointer">
            <Link href="/settings">Settings</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <p className="px-4 py-12 text-center text-muted-foreground">Loading Passport…</p>;
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="mb-4 text-muted-foreground">
          Complete onboarding or ensure the API is running with your Clerk user linked.
        </p>
        <Button asChild className="cursor-pointer bg-brand-green hover:bg-brand-teal-mid">
          <Link href="/onboarding">Finish onboarding</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6">
      <CreatorPassport data={data} />
      <div className="mx-auto flex max-w-4xl justify-center gap-3 pb-12">
        {data.username ? (
          <Button asChild variant="outline" className="cursor-pointer">
            <Link href={`/u/${data.username}`}>Public view</Link>
          </Button>
        ) : null}
        <Button asChild variant="secondary" className="cursor-pointer">
          <Link href="/reputation">Reputation</Link>
        </Button>
        <Button asChild variant="secondary" className="cursor-pointer">
          <Link href="/settings">Settings</Link>
        </Button>
      </div>
    </div>
  );
}
