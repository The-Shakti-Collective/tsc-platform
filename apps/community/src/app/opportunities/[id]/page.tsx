import { OpportunityDetail } from '@/components/opportunities/opportunity-detail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OpportunityDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <OpportunityDetail id={id} />;
}
