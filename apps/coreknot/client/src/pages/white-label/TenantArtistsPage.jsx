import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchWhiteLabelArtists } from '../../lib/whiteLabelApi';
import { Spinner } from '../../components/ui/Spinner';

export default function TenantArtistsPage() {
  const { tenantSlug } = useParams();
  const rosterQuery = useQuery({
    queryKey: ['white-label', 'artists', tenantSlug],
    queryFn: () => fetchWhiteLabelArtists(tenantSlug),
    enabled: Boolean(tenantSlug),
  });

  if (rosterQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  const items = rosterQuery.data?.items ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-8">
      <Link className="text-sm text-[var(--color-brand-primary)]" to={`/t/${tenantSlug}`}>
        ← Back
      </Link>
      <h1 className="text-xl font-semibold">Artist roster</h1>
      {items.length === 0 ? (
        <p className="text-[var(--color-text-muted)]">No artists listed.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((artist) => (
            <li
              key={artist.artistId}
              className="rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4"
            >
              <p className="font-medium">{artist.artistName}</p>
              {artist.artistSlug && (
                <p className="text-sm text-[var(--color-text-muted)]">@{artist.artistSlug}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
