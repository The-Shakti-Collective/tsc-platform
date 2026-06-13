import { createCommunityClient } from '@tsc/community-sdk';
import { notFound } from 'next/navigation';
import { PersonPassport } from '@/components/passport/person-passport';
import { getApiBaseUrl } from '@/lib/utils';

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const client = createCommunityClient({ baseUrl: getApiBaseUrl() });

  try {
    const person = await client.getPersonByUsername(username);
    const slug = person.profileSlug ?? username;
    const profile = await client.getPublicProfileBySlug(slug);
    const passport = await client.getEcosystemPassport(slug).catch(() => null);

    return (
      <div className="px-4 py-12">
        <PersonPassport
          data={profile}
          reputation={passport?.reputation ?? undefined}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
