import { ClaimSummaryResponse } from '@/lib/types';
import { formatRelative } from '@/lib/utils';

interface RecentActivityLogProps {
  claims: ClaimSummaryResponse[];
}

// There's no dedicated activity-feed endpoint, so this is built from the
// pending claims queue we already fetch — real submissions, not invented events.
export function RecentActivityLog({ claims }: RecentActivityLogProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <p className="text-base font-extrabold text-[#111827] mb-4">Recent Activity Log</p>
      {claims.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">No recent claim activity.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-gray-100">
          {claims.map((claim) => (
            <li key={claim.id} className="flex items-center justify-between gap-4 py-3">
              <span className="flex items-center gap-2.5 text-sm text-gray-700 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] shrink-0" />
                <span className="truncate">New claim submitted for {claim.itemTitle}</span>
              </span>
              <span className="text-xs text-gray-400 shrink-0">{formatRelative(claim.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
