import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Trash2 } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import {
  CREATIVE_ROLE_TAG_OPTIONS,
  CREATIVE_VERTICAL_OPTIONS,
  addCreativeRoleAssignment,
  fetchMyCreativeIdentity,
  patchMyCreativeIdentity,
  removeCreativeRoleAssignment,
  fetchCreativeIdentityRoles,
} from '../../lib/creativeIdentityApi';
import SkillsEditorSection from './SkillsEditorSection';

function toggleValue(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export default function CreativeIdentityEditPage() {
  const queryClient = useQueryClient();
  const { data: identity, isLoading } = useQuery({
    queryKey: ['creative-identity-me'],
    queryFn: fetchMyCreativeIdentity,
  });

  const { data: rolesPayload } = useQuery({
    queryKey: ['creative-identity-me-roles', identity?.slug],
    queryFn: () => fetchCreativeIdentityRoles(identity.slug),
    enabled: !!identity?.slug,
  });

  const [form, setForm] = useState({
    headline: '',
    bio: '',
    primaryCity: '',
    verticals: [],
    roles: [],
    isPublic: true,
  });

  const [newRole, setNewRole] = useState({ role: 'artist', entityType: '', entityId: '' });

  useEffect(() => {
    if (!identity) return;
    setForm({
      headline: identity.headline ?? '',
      bio: identity.bio ?? '',
      primaryCity: identity.primaryCity ?? '',
      verticals: identity.verticals ?? [],
      roles: identity.roles ?? [],
      isPublic: identity.isPublic ?? true,
    });
  }, [identity]);

  const saveMutation = useMutation({
    mutationFn: () =>
      patchMyCreativeIdentity({
        headline: form.headline || null,
        bio: form.bio || null,
        primaryCity: form.primaryCity || null,
        verticals: form.verticals,
        roles: form.roles,
        isPublic: form.isPublic,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-identity-me'] });
    },
  });

  const addRoleMutation = useMutation({
    mutationFn: () =>
      addCreativeRoleAssignment({
        role: newRole.role,
        entityType: newRole.entityType || null,
        entityId: newRole.entityId || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-identity-me-roles'] });
      setNewRole({ role: 'artist', entityType: '', entityId: '' });
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: (roleId) => removeCreativeRoleAssignment(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-identity-me-roles'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Edit creative identity
          </h1>
          {identity?.slug && (
            <p className="text-sm text-[var(--color-text-muted)]">
              Public at{' '}
              <Link to={`/creator/${identity.slug}`} className="text-[var(--color-brand-primary)]">
                /creator/{identity.slug}
              </Link>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          <Save size={16} />
          Save
        </button>
      </div>

      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-4">
        <label className="block space-y-1">
          <span className="text-sm text-[var(--color-text-muted)]">Headline</span>
          <input
            value={form.headline}
            onChange={(event) => setForm((prev) => ({ ...prev, headline: event.target.value }))}
            className="w-full rounded-lg border border-[var(--color-bg-border)] bg-transparent px-3 py-2 text-sm"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-[var(--color-text-muted)]">Bio</span>
          <textarea
            value={form.bio}
            onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
            rows={4}
            className="w-full rounded-lg border border-[var(--color-bg-border)] bg-transparent px-3 py-2 text-sm"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-[var(--color-text-muted)]">Primary city</span>
          <input
            value={form.primaryCity}
            onChange={(event) => setForm((prev) => ({ ...prev, primaryCity: event.target.value }))}
            className="w-full rounded-lg border border-[var(--color-bg-border)] bg-transparent px-3 py-2 text-sm"
          />
        </label>

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isPublic}
            onChange={(event) => setForm((prev) => ({ ...prev, isPublic: event.target.checked }))}
          />
          Public profile
        </label>
      </section>

      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Verticals</h2>
        <div className="flex flex-wrap gap-2">
          {CREATIVE_VERTICAL_OPTIONS.map((vertical) => (
            <button
              key={vertical}
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  verticals: toggleValue(prev.verticals, vertical),
                }))
              }
              className={`rounded-full border px-3 py-1 text-xs capitalize ${
                form.verticals.includes(vertical)
                  ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                  : 'border-[var(--color-bg-border)] text-[var(--color-text-muted)]'
              }`}
            >
              {vertical}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Creative roles</h2>
        <div className="flex flex-wrap gap-2">
          {CREATIVE_ROLE_TAG_OPTIONS.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  roles: toggleValue(prev.roles, role),
                }))
              }
              className={`rounded-full border px-3 py-1 text-xs capitalize ${
                form.roles.includes(role)
                  ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                  : 'border-[var(--color-bg-border)] text-[var(--color-text-muted)]'
              }`}
            >
              {role.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </section>

      <SkillsEditorSection />

      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Entity role assignments
        </h2>

        <div className="grid gap-3 sm:grid-cols-3">
          <select
            value={newRole.role}
            onChange={(event) => setNewRole((prev) => ({ ...prev, role: event.target.value }))}
            className="rounded-lg border border-[var(--color-bg-border)] bg-transparent px-3 py-2 text-sm"
          >
            {CREATIVE_ROLE_TAG_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <input
            value={newRole.entityType}
            onChange={(event) => setNewRole((prev) => ({ ...prev, entityType: event.target.value }))}
            placeholder="Entity type (Artist)"
            className="rounded-lg border border-[var(--color-bg-border)] bg-transparent px-3 py-2 text-sm"
          />
          <input
            value={newRole.entityId}
            onChange={(event) => setNewRole((prev) => ({ ...prev, entityId: event.target.value }))}
            placeholder="Entity ID"
            className="rounded-lg border border-[var(--color-bg-border)] bg-transparent px-3 py-2 text-sm"
          />
        </div>

        <button
          type="button"
          onClick={() => addRoleMutation.mutate()}
          disabled={addRoleMutation.isPending}
          className="rounded-lg border border-[var(--color-bg-border)] px-4 py-2 text-sm"
        >
          Add role assignment
        </button>

        <ul className="space-y-2">
          {(rolesPayload?.roles ?? []).map((role) => (
            <li
              key={role.id}
              className="flex items-center justify-between rounded-lg border border-[var(--color-bg-border)] px-3 py-2 text-sm"
            >
              <span className="capitalize">
                {role.role.replace(/_/g, ' ')}
                {role.entityType ? ` · ${role.entityType}` : ''}
              </span>
              <button
                type="button"
                onClick={() => removeRoleMutation.mutate(role.id)}
                className="text-[var(--color-text-muted)] hover:text-red-400"
                aria-label="Remove role"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
