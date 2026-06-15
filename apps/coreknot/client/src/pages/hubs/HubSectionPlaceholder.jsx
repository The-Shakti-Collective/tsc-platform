import React from 'react';
import { PageContainer, PageHeader } from '../../components/ui';

/**
 * Placeholder for V2 sections that reuse existing data models but need dedicated UI later.
 * Keeps navigation structure without changing design language.
 */
export default function HubSectionPlaceholder({ title, description, children }) {
  return (
    <PageContainer>
      <PageHeader title={title} subtitle={description} />
      <div className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-6 text-sm text-[var(--color-text-secondary)]">
        {children || (
          <p>
            This section is part of the CoreKnot Creative Operations OS layout. Existing tools and
            screens will be connected here in upcoming passes.
          </p>
        )}
      </div>
    </PageContainer>
  );
}
