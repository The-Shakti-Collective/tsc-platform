import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Star, Trash2 } from 'lucide-react';
import {
  SKILL_CATEGORY_OPTIONS,
  SKILL_PROFICIENCY_OPTIONS,
  addSkillToMyProfile,
  deriveProficiencyFromYears,
  fetchMyCreativeIdentitySkills,
  fetchSkills,
  removeSkillFromMyProfile,
} from '../../lib/skillsApi';

function ProficiencyBadge({ value }) {
  const colors = {
    learning: 'text-amber-500 border-amber-500/40',
    intermediate: 'text-sky-500 border-sky-500/40',
    expert: 'text-emerald-500 border-emerald-500/40',
  };

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${colors[value] ?? ''}`}
    >
      {value}
    </span>
  );
}

export default function SkillsEditorSection() {
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState('');
  const [draft, setDraft] = useState({
    skillSlug: '',
    yearsExperience: '',
    proficiency: '',
    isPrimary: false,
  });

  const { data: mySkillsPayload, isLoading: skillsLoading } = useQuery({
    queryKey: ['my-creative-skills'],
    queryFn: fetchMyCreativeIdentitySkills,
  });

  const { data: catalog } = useQuery({
    queryKey: ['skills-catalog', categoryFilter],
    queryFn: () => fetchSkills(categoryFilter || undefined),
  });

  const availableSkills = useMemo(() => {
    const owned = new Set((mySkillsPayload?.skills ?? []).map((row) => row.skillSlug));
    return (catalog?.items ?? []).filter((skill) => !owned.has(skill.slug));
  }, [catalog?.items, mySkillsPayload?.skills]);

  const addMutation = useMutation({
    mutationFn: () => {
      const years = draft.yearsExperience === '' ? null : Number(draft.yearsExperience);
      const proficiency =
        draft.proficiency || deriveProficiencyFromYears(years);

      return addSkillToMyProfile({
        skillSlug: draft.skillSlug,
        yearsExperience: years,
        proficiency,
        isPrimary: draft.isPrimary,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-creative-skills'] });
      queryClient.invalidateQueries({ queryKey: ['creative-identity-me'] });
      setDraft({ skillSlug: '', yearsExperience: '', proficiency: '', isPrimary: false });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (skillId) => removeSkillFromMyProfile(skillId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-creative-skills'] });
      queryClient.invalidateQueries({ queryKey: ['creative-identity-me'] });
    },
  });

  const suggestedProficiency = deriveProficiencyFromYears(
    draft.yearsExperience === '' ? null : Number(draft.yearsExperience),
  );

  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Skill graph</h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            Structured capabilities replace legacy capability strings.
          </p>
        </div>
      </div>

      {skillsLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading skills…</p>
      ) : (
        <ul className="space-y-2">
          {(mySkillsPayload?.skills ?? []).length === 0 ? (
            <li className="text-sm text-[var(--color-text-muted)]">No skills added yet.</li>
          ) : (
            mySkillsPayload.skills.map((skill) => (
              <li
                key={skill.skillId}
                className="flex items-center justify-between rounded-lg border border-[var(--color-bg-border)] px-3 py-2 text-sm"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {skill.skillName}
                    </span>
                    {skill.isPrimary && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase text-[var(--color-brand-primary)]">
                        <Star size={10} />
                        Primary
                      </span>
                    )}
                    <ProficiencyBadge value={skill.proficiency} />
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] capitalize">
                    {skill.category.replace(/_/g, ' ')}
                    {skill.yearsExperience != null ? ` · ${skill.yearsExperience} yrs` : ''}
                    {skill.endorsementCount > 0
                      ? ` · ${skill.endorsementCount} endorsements`
                      : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeMutation.mutate(skill.skillId)}
                  className="text-[var(--color-text-muted)] hover:text-red-400"
                  aria-label={`Remove ${skill.skillName}`}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      <div className="rounded-lg border border-dashed border-[var(--color-bg-border)] p-4 space-y-3">
        <p className="text-xs font-medium text-[var(--color-text-secondary)]">Add skill</p>

        <div className="flex flex-wrap gap-2">
          {[{ value: '', label: 'all' }, ...SKILL_CATEGORY_OPTIONS].map((option) => (
            <button
              key={option.value || 'all'}
              type="button"
              onClick={() => setCategoryFilter(option.value)}
              className={`rounded-full border px-3 py-1 text-xs capitalize ${
                categoryFilter === option.value
                  ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                  : 'border-[var(--color-bg-border)] text-[var(--color-text-muted)]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={draft.skillSlug}
            onChange={(event) => setDraft((prev) => ({ ...prev, skillSlug: event.target.value }))}
            className="rounded-lg border border-[var(--color-bg-border)] bg-transparent px-3 py-2 text-sm"
          >
            <option value="">Select skill</option>
            {availableSkills.map((skill) => (
              <option key={skill.id} value={skill.slug}>
                {skill.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            max="60"
            value={draft.yearsExperience}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, yearsExperience: event.target.value }))
            }
            placeholder="Years experience"
            className="rounded-lg border border-[var(--color-bg-border)] bg-transparent px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={draft.proficiency}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, proficiency: event.target.value }))
            }
            className="rounded-lg border border-[var(--color-bg-border)] bg-transparent px-3 py-2 text-sm"
          >
            <option value="">Auto ({suggestedProficiency})</option>
            {SKILL_PROFICIENCY_OPTIONS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.isPrimary}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, isPrimary: event.target.checked }))
              }
            />
            Primary skill
          </label>
        </div>

        <button
          type="button"
          onClick={() => addMutation.mutate()}
          disabled={!draft.skillSlug || addMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          <Plus size={16} />
          Add skill
        </button>
      </div>
    </section>
  );
}
