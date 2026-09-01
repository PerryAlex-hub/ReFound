'use client';

import useSWR from 'swr';
import { getItem } from '@/lib/api/items';
import { MatchResponse } from '@/lib/types';
import { formatOccurredOn } from '@/lib/utils';
import { MatchCard } from '@/components/matches/MatchCard';
import { Skeleton } from '@/components/ui/Skeleton';

interface MatchGroupProps {
  lostItemId: string;
  matches: MatchResponse[];
  onDismiss: (id: string) => void;
  dismissingId: string | null;
}

/** Groups matches under a header naming the lost report they were suggested for. */
export function MatchGroup({ lostItemId, matches, onDismiss, dismissingId }: MatchGroupProps) {
  const { data: lostItem, isLoading } = useSWR(
    ['item', lostItemId],
    () => getItem(lostItemId),
    { revalidateOnFocus: false }
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          {isLoading ? (
            <Skeleton className="h-5 w-40 rounded" />
          ) : (
            <>
              <p className="font-bold text-[#111827] truncate">
                Matching for: {lostItem?.title ?? 'Lost item'}
              </p>
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-red-600 bg-red-50 px-2 py-1 rounded-full">
                Lost Report Active
              </span>
            </>
          )}
        </div>
        {lostItem && (
          <span className="text-xs text-gray-400 shrink-0">Reported {formatOccurredOn(lostItem.occurredOn)}</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            onDismiss={onDismiss}
            dismissing={dismissingId === match.id}
          />
        ))}
      </div>
    </div>
  );
}
