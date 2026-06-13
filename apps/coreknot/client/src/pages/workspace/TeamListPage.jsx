import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Users } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import { createWorkspaceTeam, fetchWorkspaceTeams } from '../../lib/workspaceApi';

export default function TeamListPage() {
  const { workspace } = useOutletContext();
  const queryClient = useQueryClient();
  const [teamName, setTeamName] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: teamsPayload, isLoading } = useQuery({
    queryKey: ['workspace', workspace?.slug, 'teams'],
    queryFn: () => fetchWorkspaceTeams(workspace.slug),
    enabled: Boolean(workspace?.slug),
  });

  const createMutation = useMutation({
    mutationFn: () => createWorkspaceTeam(workspace.slug, { name: teamName.trim() }),
    onSuccess: () => {
      setTeamName('');
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspace.slug, 'teams'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspace.slug] });
    },
  });

  const teams = teamsPayload?.items ?? workspace?.teams ?? [];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <Users size={20} />
            Teams
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Sub-teams within this workspace — e.g. Prabh Deep Team, TSC Events Team.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-bg-border)] px-3 py-2 text-sm font-medium"
        >
          <Plus size={14} />
          New team
        </button>
      </header>

      {showForm && (
        <div className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 flex gap-2">
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="flex-1 rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm"
            placeholder="Team name"
          />
          <button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !teamName.trim()}
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
      ) : teams.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-bg-border)] p-8 text-center text-sm text-[var(--color-text-muted)]">
          No teams yet. Create one to organize members and future projects.
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {teams.map((team) => (
            <li
              key={team.id}
              className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 space-y-2"
            >
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{team.name}</p>
              {team.description && (
                <p className="text-xs text-[var(--color-text-muted)]">{team.description}</p>
              )}
              <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] font-mono">
                {team.slug}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
