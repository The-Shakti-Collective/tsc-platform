import Link from 'next/link';
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchForm } from '@/components/search/search-form';

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
          <CardDescription>Global search across TSC communities, events, and artists.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading search…</p>}>
            <SearchForm initialQuery={query} />
          </Suspense>
          {query ? (
            <p className="text-sm text-muted-foreground">
              Results for &ldquo;{query}&rdquo; will appear here once search is wired to the API.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Enter a query to search. Try{' '}
              <Link href="/communities" className="text-primary underline-offset-4 hover:underline">
                communities
              </Link>{' '}
              or{' '}
              <Link href="/events" className="text-primary underline-offset-4 hover:underline">
                events
              </Link>{' '}
              browse pages in the meantime.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
