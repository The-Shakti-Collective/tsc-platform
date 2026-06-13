import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchWhiteLabelConfig } from '../../lib/whiteLabelApi';
import { Spinner } from '../../components/ui/Spinner';

export default function TenantHomePage() {
  const { tenantSlug } = useParams();
  const configQuery = useQuery({
    queryKey: ['white-label', 'config', tenantSlug],
    queryFn: () => fetchWhiteLabelConfig(tenantSlug),
    enabled: Boolean(tenantSlug),
  });

  if (configQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  const config = configQuery.data;
  if (!config) {
    return <p className="p-8 text-[var(--color-text-muted)]">Tenant not found.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <h1 className="text-2xl font-semibold">{config.name}</h1>
      {config.config?.tagline && (
        <p className="text-[var(--color-text-muted)]">{config.config.tagline}</p>
      )}
      <Link
        className="inline-flex rounded-lg bg-[var(--color-brand-primary)] px-4 py-2 text-sm font-medium text-white"
        to={`/t/${tenantSlug}/artists`}
      >
        View roster
      </Link>
    </div>
  );
}
