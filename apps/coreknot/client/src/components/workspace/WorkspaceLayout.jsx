import React, { useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';
import { Briefcase, CheckSquare, FolderKanban, LayoutDashboard, Settings, Users } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import { fetchWorkspace, fetchMyWorkspace } from '../../lib/workspaceApi';
import { WORKSPACE_TYPE_LABELS } from '../../lib/workspaceApi';

function WorkspaceNav({ slug }) {
  const base = slug ? `/workspace/${slug}` : '/workspace';

  return (
    <nav className="flex flex-wrap gap-2 border-b border-[var(--color-bg-border)] px-4 py-2">
      <Link
        to={base}
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]"
      >
        <LayoutDashboard size={14} />
        Dashboard
      </Link>
      <Link
        to={`${base}/projects`}
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]"
      >
        <FolderKanban size={14} />
        Projects
      </Link>
      <Link
        to={`${base}/tasks`}
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]"
      >
        <CheckSquare size={14} />
        Tasks
      </Link>
      <Link
        to={`${base}/teams`}
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]"
      >
        <Users size={14} />
        Teams
      </Link>
      <Link
        to={`${base}/settings`}
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]"
      >
        <Settings size={14} />
        Settings
      </Link>
    </nav>
  );
}

/**
 * Shell for `/workspace/*` — loads workspace context and renders nested routes.
 */
export function WorkspaceLayout({ children = null }) {
  const { slug: routeSlug } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const loader = routeSlug ? fetchWorkspace(routeSlug) : fetchMyWorkspace();

    loader
      .then((payload) => {
        if (!active) return;
        if (!payload?.slug) {
          setError('Workspace not found');
          setWorkspace(null);
          return;
        }
        setWorkspace(payload);
      })
      .catch(() => {
        if (!active) return;
        setError('Could not load workspace');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [routeSlug]);

  const header = useMemo(() => {
    if (!workspace) return null;
    const typeLabel = WORKSPACE_TYPE_LABELS[workspace.type] ?? workspace.type;

    return (
      <header className="flex items-center justify-between gap-3 border-b border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-brand-primary)]/15 text-sm font-bold text-[var(--color-brand-primary)]">
            <Briefcase size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              {workspace.name}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {typeLabel} · {workspace.memberCount} members · {workspace.teamCount} teams
              {workspace._source === 'mock' && (
                <span className="ml-2 uppercase text-amber-600">Mock</span>
              )}
            </p>
          </div>
        </div>
        {workspace.identityLink?.tscIdentitySlug && (
          <span className="text-xs text-[var(--color-text-muted)]">
            {workspace.identityLink.tscIdentityNamespace}.tsc/
            {workspace.identityLink.tscIdentitySlug}
          </span>
        )}
      </header>
    );
  }, [workspace]);

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="rounded-lg border border-[var(--color-bg-border)] p-4 text-sm text-[var(--color-text-muted)]">
        {error ?? 'Workspace unavailable'}
      </div>
    );
  }

  return (
    <div className="workspace-shell" data-workspace-slug={workspace.slug}>
      {header}
      <WorkspaceNav slug={workspace.slug} />
      <div className="workspace-shell-body">
        {children ?? <Outlet context={{ workspace }} />}
      </div>
    </div>
  );
}

export default WorkspaceLayout;
