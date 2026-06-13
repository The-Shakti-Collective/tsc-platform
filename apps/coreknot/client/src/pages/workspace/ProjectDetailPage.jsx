import React, { useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckSquare, Users } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
  addProjectMember,
  fetchProject,
  fetchProjectMembers,
  patchProject,
} from '../../lib/projectApi';

export default function ProjectDetailPage() {
  const { projectSlug } = useParams();
  const { workspace } = useOutletContext();
  const queryClient = useQueryClient();
  const [memberPersonId, setMemberPersonId] = useState('');
  const base = `/workspace/${workspace.slug}`;

  const { data: project, isLoading } = useQuery({
    queryKey: ['workspace', workspace?.slug, 'project', projectSlug],
    queryFn: () => fetchProject(workspace.slug, projectSlug),
    enabled: Boolean(workspace?.slug && projectSlug),
  });

  const { data: membersPayload } = useQuery({
    queryKey: ['workspace', workspace?.slug, 'project', projectSlug, 'members'],
    queryFn: () => fetchProjectMembers(workspace.slug, projectSlug),
    enabled: Boolean(workspace?.slug && projectSlug),
  });

  const statusMutation = useMutation({
    mutationFn: (status) => patchProject(workspace.slug, projectSlug, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspace.slug, 'project', projectSlug] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspace.slug, 'projects'] });
    },
  });

  const memberMutation = useMutation({
    mutationFn: () =>
      addProjectMember(workspace.slug, projectSlug, {
        personId: memberPersonId.trim(),
        role: 'member',
      }),
    onSuccess: () => {
      setMemberPersonId('');
      queryClient.invalidateQueries({
        queryKey: ['workspace', workspace.slug, 'project', projectSlug, 'members'],
      });
    },
  });

  const members = membersPayload?.items ?? project?.members ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-sm text-[var(--color-text-muted)]">Project not found.</div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <Link
        to={`${base}/projects`}
        className="inline-flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
      >
        <ArrowLeft size={14} />
        All projects
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">{project.name}</h1>
          <span className="rounded-full bg-[var(--color-bg-muted)] px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
            {PROJECT_TYPE_LABELS[project.type] ?? project.type}
          </span>
        </div>
        {project.description && (
          <p className="text-sm text-[var(--color-text-muted)]">{project.description}</p>
        )}
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 space-y-3">
          <h2 className="text-sm font-semibold">Status</h2>
          <select
            value={project.status}
            onChange={(e) => statusMutation.mutate(e.target.value)}
            disabled={statusMutation.isPending}
            className="w-full rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm"
          >
            {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {project.budget != null && (
            <p className="text-xs text-[var(--color-text-muted)]">
              Budget: {project.currency ?? 'INR'} {project.budget.toLocaleString()}
            </p>
          )}
        </section>

        <section className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-1.5">
            <CheckSquare size={14} />
            Tasks
          </h2>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{project.taskCount}</p>
          <Link
            to={`${base}/tasks?project=${project.slug}`}
            className="text-xs text-[var(--color-brand-primary)] hover:underline"
          >
            Open task board →
          </Link>
        </section>

        <section className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-1.5">
            <Users size={14} />
            Members
          </h2>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{members.length}</p>
        </section>
      </div>

      <section className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 space-y-3">
        <h2 className="text-sm font-semibold">Project members</h2>
        <ul className="space-y-2">
          {members.map((member) => (
            <li
              key={`${member.projectId}-${member.personId}`}
              className="flex items-center justify-between text-sm"
            >
              <span className="font-medium">{member.displayName}</span>
              <span className="text-xs uppercase text-[var(--color-text-muted)]">{member.role}</span>
            </li>
          ))}
        </ul>
        <div className="flex gap-2 pt-2 border-t border-[var(--color-bg-border)]">
          <input
            type="text"
            value={memberPersonId}
            onChange={(e) => setMemberPersonId(e.target.value)}
            placeholder="Person ID to add"
            className="flex-1 rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => memberMutation.mutate()}
            disabled={memberMutation.isPending || !memberPersonId.trim()}
            className="rounded-lg bg-[var(--color-brand-primary)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </section>
    </div>
  );
}
