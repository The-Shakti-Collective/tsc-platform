import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Calendar, CheckSquare, FolderKanban, Sparkles } from 'lucide-react';

function NavCard({ title, description, icon: Icon, to, sprint = undefined }) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-5 space-y-3 hover:border-[var(--color-brand-primary)]/40 transition-colors block"
    >
      <div className="flex items-center gap-2">
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]">
            <Icon size={16} />
          </span>
        )}
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h2>
      </div>
      <p className="text-sm text-[var(--color-text-muted)]">{description}</p>
      {sprint && (
        <span className="inline-flex rounded-full bg-[var(--color-bg-muted)] px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
          {sprint}
        </span>
      )}
    </Link>
  );
}

function ComingSoonCard({ title, description, icon: Icon, sprint }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-5 space-y-3">
      <div className="flex items-center gap-2">
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]">
            <Icon size={16} />
          </span>
        )}
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h2>
      </div>
      <p className="text-sm text-[var(--color-text-muted)]">{description}</p>
      <span className="inline-flex rounded-full bg-[var(--color-bg-muted)] px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
        {sprint}
      </span>
    </div>
  );
}

export default function WorkspaceDashboardPage() {
  const { workspace } = useOutletContext();
  const base = workspace?.slug ? `/workspace/${workspace.slug}` : '/workspace';

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
          {workspace?.name ?? 'Workspace'}
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Personal Operating Layer — projects and tasks ship in Sprint 2.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <NavCard
          title="Projects"
          description="Albums, tours, campaigns — organize work by initiative."
          icon={FolderKanban}
          to={`${base}/projects`}
        />
        <NavCard
          title="Tasks"
          description="Kanban board with comments, checklist, and assignees."
          icon={CheckSquare}
          to={`${base}/tasks`}
        />
        <ComingSoonCard
          title="Calendar"
          description="Shared calendar across events, bookings, and team deadlines."
          icon={Calendar}
          sprint="Sprint 3"
        />
        <ComingSoonCard
          title="Events"
          description="Workspace-scoped event pipeline and show-day ops."
          icon={Sparkles}
          sprint="Sprint 3"
        />
      </div>

      <section className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
          Quick stats
        </h2>
        <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div>
            <dt className="text-[var(--color-text-muted)]">Type</dt>
            <dd className="font-medium capitalize">{workspace?.type ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-text-muted)]">Members</dt>
            <dd className="font-medium">{workspace?.memberCount ?? 0}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-text-muted)]">Teams</dt>
            <dd className="font-medium">{workspace?.teamCount ?? 0}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-text-muted)]">Slug</dt>
            <dd className="font-medium font-mono text-xs">{workspace?.slug ?? '—'}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
