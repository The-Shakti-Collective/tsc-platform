'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchFormProps {
  initialQuery?: string;
}

export function SearchForm({ initialQuery = '' }: SearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    const params = new URLSearchParams(searchParams?.toString() ?? '');

    if (trimmed) {
      params.set('q', trimmed);
    } else {
      params.delete('q');
    }

    const query = params.toString();
    router.push(query ? `/search?${query}` : '/search');
  };

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <Input
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search communities, events, artists…"
        aria-label="Search query"
      />
      <Button type="submit">Search</Button>
    </form>
  );
}
