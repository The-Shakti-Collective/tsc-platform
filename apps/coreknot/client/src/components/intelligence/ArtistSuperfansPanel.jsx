import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { fetchArtistSuperfanSegments, fetchArtistSuperfans } from '../../lib/fanApi';
import { Spinner } from '../ui/Spinner';
import { SuperfanBadge } from '../passport/SuperfanBadge';

function SegmentPill({ tier, count }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-[var(--color-bg-border)] px-2 py-1">
      <SuperfanBadge tier={tier} compact />
      <span className="text-xs font-medium text-[var(--color-text-primary)]">{count}</span>
    </div>
  );
}

/**
 * Top superfans list for Artist Workspace — Phase 8 Step 2.
 */
export default function ArtistSuperfansPanel({ artistId }) {
  const superfansQuery = useQuery({
    queryKey: ['artist', 'superfans', artistId],
    queryFn: () => fetchArtistSuperfans(artistId, 100),
    enabled: !!artistId,
  });

  const segmentsQuery = useQuery({
    queryKey: ['artist', 'superfan-segments', artistId],
    queryFn: () => fetchArtistSuperfanSegments(artistId),
    enabled: !!artistId,
  });

  if (superfansQuery.isLoading) {
    return (
      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 flex justify-center py-8">
        <Spinner size={24} />
      </section>
    );
  }

  const data = superfansQuery.data;
  const segments = segmentsQuery.data;
  const isMock = data?._source === 'mock' || segments?._source === 'mock';

  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <Users size={16} />
            Superfans
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Top 100 fans ranked by superfan score — events, purchases, community, referrals.
          </p>
        </div>
        {isMock && (
          <span className="text-xs text-amber-600 dark:text-amber-400">Sample data</span>
        )}
      </div>

      {segments?.segments?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {segments.segments.map((seg) => (
            <SegmentPill key={seg.tier} tier={seg.tier} count={seg.count} />
          ))}
        </div>
      )}

      {(data?.superfans ?? []).length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">No superfans scored yet for this artist.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--color-text-muted)] border-b border-[var(--color-bg-border)]">
                <th className="pb-2 pr-3 font-medium">#</th>
                <th className="pb-2 pr-3 font-medium">Fan</th>
                <th className="pb-2 pr-3 font-medium">Tier</th>
                <th className="pb-2 font-medium text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {data.superfans.map((fan, index) => (
                <tr
                  key={fan.personId}
                  className="border-b border-[var(--color-bg-border)] last:border-0"
                >
                  <td className="py-2 pr-3 text-[var(--color-text-muted)]">{index + 1}</td>
                  <td className="py-2 pr-3 text-[var(--color-text-primary)]">{fan.displayName}</td>
                  <td className="py-2 pr-3">
                    <SuperfanBadge tier={fan.tier} compact />
                  </td>
                  <td className="py-2 text-right font-medium text-[var(--color-text-primary)]">
                    {Math.round(fan.superfanScore)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
