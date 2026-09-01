'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Target } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import gsap from 'gsap';
import { getMyMatches, dismissMatch } from '@/lib/api/matches';
import { getItem } from '@/lib/api/items';
import { MatchCard } from '@/components/matches/MatchCard';
import { MatchGroup } from '@/components/matches/MatchGroup';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { TopBar } from '@/components/layout/TopBar';
import { toast } from '@/components/ui/Toast';

export default function MatchesPage() {
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { data: matches, isLoading } = useSWR('matches', getMyMatches, { revalidateOnFocus: false });

  useEffect(() => {
    if (!isLoading && matches?.length) {
      const ctx = gsap.context(() => {
        gsap.from('.match-card-anim', { opacity: 0, y: 24, stagger: 0.1, duration: 0.5, ease: 'power2.out', delay: 0.1 });
      });
      return () => ctx.revert();
    }
  }, [isLoading, matches]);

  const handleDismiss = async (id: string) => {
    setDismissingId(id);
    try {
      await dismissMatch(id);
      await mutate('matches');
      toast('Match dismissed.', 'info');
    } catch {
      toast('Failed to dismiss.', 'error');
    } finally {
      setDismissingId(null);
    }
  };

  const active = useMemo(() => matches?.filter((m) => m.status === 'SUGGESTED') ?? [], [matches]);

  // Group matches by their lost report so desktop can show one section per lost item.
  const groups = useMemo(() => {
    const map = new Map<string, typeof active>();
    for (const m of active) {
      const bucket = map.get(m.lostItemId);
      if (bucket) bucket.push(m);
      else map.set(m.lostItemId, [m]);
    }
    return Array.from(map.entries());
  }, [active]);

  const uniqueLostItemIds = useMemo(() => Array.from(new Set(active.map((m) => m.lostItemId))), [active]);
  const singleLostItemId = uniqueLostItemIds.length === 1 ? uniqueLostItemIds[0] : null;
  const { data: singleLostItem } = useSWR(
    singleLostItemId ? ['item', singleLostItemId] : null,
    () => getItem(singleLostItemId as string),
    { revalidateOnFocus: false }
  );

  const introText = singleLostItem
    ? `We found some found items that look like your reported lost ${singleLostItem.title}.`
    : 'We found some found items that may match your reported items.';

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Potential Matches" />

      <div className="px-4 md:px-0 pb-6 flex flex-col gap-4">
        {/* Desktop intro */}
        <div className="hidden md:block">
          <p className="text-sm text-gray-500">
            Our matching algorithms discovered logged found items similar to your lost reports.
          </p>
        </div>

        {/* Mobile intro */}
        {active.length > 0 && (
          <p className="text-sm text-gray-500 md:hidden">{introText}</p>
        )}

        {isLoading ? (
          <ListSkeleton count={2} />
        ) : active.length === 0 ? (
          <EmptyState
            icon={<Target size={24} />}
            title="Looking for more matches"
            description="We'll notify you automatically when new matching items are reported."
          />
        ) : (
          <>
            {/* Mobile: flat list */}
            <div ref={listRef} className="md:hidden flex flex-col gap-4">
              {active.map((match) => (
                <div key={match.id} className="match-card-anim">
                  <MatchCard
                    match={match}
                    onDismiss={handleDismiss}
                    dismissing={dismissingId === match.id}
                  />
                </div>
              ))}
            </div>

            {/* Desktop: grouped by lost report */}
            <div className="hidden md:flex md:flex-col gap-8">
              {groups.map(([lostItemId, groupMatches]) => (
                <MatchGroup
                  key={lostItemId}
                  lostItemId={lostItemId}
                  matches={groupMatches}
                  onDismiss={handleDismiss}
                  dismissingId={dismissingId}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
