import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Music, Sparkles, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchFanProfile, fetchFanScores, fetchSuperfan } from '../../lib/fanApi';
import { Spinner } from '../ui/Spinner';
import { SuperfanBadge } from './SuperfanBadge';

function ScorePill({ label, value }) {
  if (value == null) return null;
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 70 ? '#34d399' : pct >= 45 ? '#facc15' : '#94a3b8';

  return (
    <div className="rounded-lg border border-[var(--color-bg-border)] px-3 py-2 text-center min-w-[72px]">
      <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
      <p className="text-lg font-bold" style={{ color }}>
        {Math.round(pct)}
      </p>
    </div>
  );
}

/**
 * FanProfile section for Ecosystem Passport — Phase 8 Step 1.
 */
export function FanProfileSection({ personId }) {
  const profileQuery = useQuery({
    queryKey: ['fan', 'profile', personId],
    queryFn: () => fetchFanProfile(personId),
    enabled: !!personId,
  });

  const scoresQuery = useQuery({
    queryKey: ['fan', 'scores', personId],
    queryFn: () => fetchFanScores(personId),
    enabled: !!personId,
  });

  const superfanQuery = useQuery({
    queryKey: ['fan', 'superfan', personId],
    queryFn: () => fetchSuperfan(personId),
    enabled: !!personId,
  });

  if (profileQuery.isLoading) {
    return (
      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 flex justify-center">
        <Spinner size={24} />
      </section>
    );
  }

  const profile = profileQuery.data;
  const scores = scoresQuery.data;
  if (!profile) return null;

  const engagement = scores?.engagementScore ?? profile.engagementScore;
  const spend = scores?.spendScore ?? profile.spendScore;
  const attendance = scores?.attendanceScore ?? profile.attendanceScore;
  const influence = scores?.influenceScore ?? profile.influenceScore;
  const superfan = superfanQuery.data;
  const isMock =
    profile._source === 'mock' ||
    scores?._source === 'mock' ||
    superfan?._source === 'mock';

  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <Sparkles size={16} className="text-[var(--color-brand-primary)]" />
          Fan Profile
        </h2>
        {isMock && (
          <span className="text-[10px] text-amber-600 dark:text-amber-400">Sample data</span>
        )}
      </div>

      {superfan?.tier && (
        <SuperfanBadge tier={superfan.tier} score={superfan.superfanScore} />
      )}

      <div className="flex flex-wrap gap-2">
        <ScorePill label="Engagement" value={engagement} />
        <ScorePill label="Spend" value={spend} />
        <ScorePill label="Attendance" value={attendance} />
        <ScorePill label="Influence" value={influence} />
      </div>

      <Link
        to="/support/history"
        className="inline-flex items-center gap-1 text-xs text-[var(--color-brand-primary)] hover:underline"
      >
        <Heart size={12} />
        View support history
      </Link>

      {(profile.favoriteGenres ?? []).length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
            <Music size={12} />
            Favorite genres
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.favoriteGenres.map((genre) => (
              <span
                key={genre}
                className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border border-[var(--color-bg-border)] text-[var(--color-text-muted)]"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
      )}

      {(profile.cities ?? []).length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
            <MapPin size={12} />
            Cities
          </p>
          <p className="text-sm text-[var(--color-text-primary)]">{profile.cities.join(' · ')}</p>
        </div>
      )}

      {(profile.favoriteArtists ?? []).length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
            <Heart size={12} />
            Favorite artists
          </p>
          <p className="text-sm text-[var(--color-text-primary)]">
            {profile.favoriteArtists.length} artist
            {profile.favoriteArtists.length === 1 ? '' : 's'} tracked
          </p>
        </div>
      )}

      {scores?.source && (
        <p className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
          <TrendingUp size={10} />
          Scores from {scores.source}
          {scores.snapshotDate ? ` · snapshot ${new Date(scores.snapshotDate).toLocaleDateString()}` : ''}
        </p>
      )}
    </section>
  );
}

export default FanProfileSection;
