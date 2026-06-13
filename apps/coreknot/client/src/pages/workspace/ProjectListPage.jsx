import React, { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderKanban, Plus } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
  createProject,
  fetchProjects,
} from '../../lib/projectApi';

export default function ProjectListPage() {
  const { workspace } = useOutletContext();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('general');

  const { data, isLoading } = useQuery({
    queryKey: ['workspace', workspace?.slug, 'projects'],
    queryFn: () => fetchProjects(workspace.slug),
    enabled: Boolean(workspace?.slug),
  });

  const createMutation = useMutation({
    mutationFn: () => createProject(workspace.slug, { name: name.trim(), type }),
    onSuccess: () => {
      setName('');
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspace.slug, 'projects'] });
    },
  });

  const projects = data?.items ?? [];
  const base = `/workspace/${workspace.slug}`;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <FolderKanban size={20} />
            Projects
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Albums, tours, campaigns, and general workspace initiatives.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-bg-border)] px-3 py-2 text-sm font-medium"
        >
          <Plus size={14} />
          New project
        </button>
      </header>

      {showForm && (
        <div className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 flex flex-wrap gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 min-w-[200px] rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm"
            placeholder="Project name"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm"
          >
            {Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !name.trim()}
            className="rounded-lg bg-[var(--color-brand-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-bg-border)] p-8 text-center text-sm text-[var(--color-text-muted)]">
          No projects yet. Create one to organize tasks and collaborators.
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                to={`${base}/projects/${project.slug}`}
                className="block rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 space-y-2 hover:border-[var(--color-brand-primary)]/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {project.name}
                  </p>
                  <span className="shrink-0 rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
                    {PROJECT_STATUS_LABELS[project.status] ?? project.status}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {PROJECT_TYPE_LABELS[project.type] ?? project.type} · {project.taskCount} tasks ·{' '}
                  {project.memberCount} members
                </p>
                {project.description && (
                  <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">
                    {project.description}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
