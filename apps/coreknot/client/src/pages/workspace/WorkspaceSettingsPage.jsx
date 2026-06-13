import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import {
  WORKSPACE_ROLE_LABELS,
  fetchWorkspaceMembers,
  inviteWorkspaceMember,
  patchWorkspaceSettings,
} from '../../lib/workspaceApi';

export default function WorkspaceSettingsPage() {
  const { workspace } = useOutletContext();
  const queryClient = useQueryClient();
  const [name, setName] = useState(workspace?.name ?? '');
  const [invitePersonId, setInvitePersonId] = useState('');

  const { data: membersPayload, isLoading } = useQuery({
    queryKey: ['workspace', workspace?.slug, 'members'],
    queryFn: () => fetchWorkspaceMembers(workspace.slug),
    enabled: Boolean(workspace?.slug),
  });

  const saveMutation = useMutation({
    mutationFn: () => patchWorkspaceSettings(workspace.slug, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspace.slug] });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: () =>
      inviteWorkspaceMember(workspace.slug, {
        personId: invitePersonId.trim(),
        role: 'member',
      }),
    onSuccess: () => {
      setInvitePersonId('');
      queryClient.invalidateQueries({ queryKey: ['workspace', workspace.slug, 'members'] });
    },
  });

  const members = membersPayload?.items ?? workspace?.members ?? [];

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Workspace name, members, and invite stub (Sprint 1).
        </p>
      </header>

      <section className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Workspace name</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm"
          placeholder="Workspace name"
        />
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !name.trim()}
          className="rounded-lg bg-[var(--color-brand-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saveMutation.isPending ? 'Saving…' : 'Save name'}
        </button>
      </section>

      <section className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Members</h2>
          <span className="text-xs text-[var(--color-text-muted)]">{members.length} active</span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <ul className="divide-y divide-[var(--color-bg-border)]">
            {members.map((member) => (
              <li key={member.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">
                    {member.displayName}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {member.slug ? `@${member.slug}` : member.personId}
                  </p>
                </div>
                <span className="rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-xs">
                  {WORKSPACE_ROLE_LABELS[member.role] ?? member.role}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-dashed border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <UserPlus size={16} />
          Invite member (stub)
        </h2>
        <p className="text-xs text-[var(--color-text-muted)]">
          Sprint 1 accepts a person ID directly. Email invite flow ships Sprint 2.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={invitePersonId}
            onChange={(e) => setInvitePersonId(e.target.value)}
            className="flex-1 rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm"
            placeholder="Person ID"
          />
          <button
            type="button"
            onClick={() => inviteMutation.mutate()}
            disabled={inviteMutation.isPending || !invitePersonId.trim()}
            className="rounded-lg border border-[var(--color-bg-border)] px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {inviteMutation.isPending ? 'Adding…' : 'Add'}
          </button>
        </div>
      </section>
    </div>
  );
}
