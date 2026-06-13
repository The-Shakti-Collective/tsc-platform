import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Search, Users } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import {
  SKILL_CATEGORY_OPTIONS,
  fetchSkillCreators,
  fetchSkills,
} from '../../lib/skillsApi';

function SkillCard({ skill, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(skill.slug)}
      className={`w-full rounded-xl border p-4 text-left transition-colors ${
        selected
          ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5'
          : 'border-[var(--color-bg-border)] hover:border-[var(--color-text-muted)]'
      }`}
    >
      <p className="font-medium text-[var(--color-text-primary)]">{skill.name}</p>
      <p className="mt-1 text-xs capitalize text-[var(--color-text-muted)]">{skill.category}</p>
      {skill.description && (
        <p className="mt-2 text-sm text-[var(--color-text-secondary)] line-clamp-2">
          {skill.description}
        </p>
      )}
    </button>
  );
}

function CreatorCard({ creator }) {
  return (
    <Link
      to={creator.routePath}
      className="block rounded-xl border border-[var(--color-bg-border)] p-4 hover:border-[var(--color-brand-primary)]"
    >
      <p className="font-medium text-[var(--color-text-primary)]">{creator.displayName}</p>
      {creator.headline && (
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{creator.headline}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)]">
        <span className="capitalize">{creator.proficiency}</span>
        {creator.primaryCity && (
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} />
            {creator.primaryCity}
          </span>
        )}
        {creator.endorsementCount > 0 && (
          <span>{creator.endorsementCount} endorsements</span>
        )}
      </div>
    </Link>
  );
}

/**
 * Skill discovery — browse canonical skills and find creators by capability.
 * Route: /discover/skills
 */
export default function SkillDiscoveryPage() {
  const [category, setCategory] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('cinematography');
  const [city, setCity] = useState('');

  const { data: catalog, isLoading: catalogLoading } = useQuery({
    queryKey: ['skills-discovery-catalog', category],
    queryFn: () => fetchSkills(category || undefined),
  });

  const { data: creatorsPayload, isLoading: creatorsLoading } = useQuery({
    queryKey: ['skills-discovery-creators', selectedSkill, city],
    queryFn: () =>
      fetchSkillCreators(selectedSkill, {
        city: city.trim() || undefined,
        limit: 24,
      }),
    enabled: !!selectedSkill,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Skill discovery</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Browse the canonical skill graph and find creators by capability. City filter is a stub for
          Module 3 talent discovery expansion.
        </p>
      </header>

      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Search size={16} className="text-[var(--color-text-muted)]" />
          <div className="flex flex-wrap gap-2">
            {[{ value: '', label: 'all' }, ...SKILL_CATEGORY_OPTIONS].map((option) => (
              <button
                key={option.value || 'all'}
                type="button"
                onClick={() => setCategory(option.value)}
                className={`rounded-full border px-3 py-1 text-xs capitalize ${
                  category === option.value
                    ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                    : 'border-[var(--color-bg-border)] text-[var(--color-text-muted)]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {catalogLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(catalog?.items ?? []).map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                selected={selectedSkill === skill.slug}
                onSelect={setSelectedSkill}
              />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <Users size={16} />
            Creators with {creatorsPayload?.skill?.name ?? selectedSkill.replace(/_/g, ' ')}
          </h2>
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Filter by city (stub)"
            className="w-full sm:w-56 rounded-lg border border-[var(--color-bg-border)] bg-transparent px-3 py-2 text-sm"
          />
        </div>

        {creatorsLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (creatorsPayload?.creators ?? []).length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            No public creators found for this skill{city ? ` in ${city}` : ''}.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {creatorsPayload.creators.map((creator) => (
              <CreatorCard key={creator.creativeIdentityId} creator={creator} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
