import Link from 'next/link';
import { ClaimStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatRelative } from '@/lib/utils';
import { ClaimSummaryResponse } from '@/lib/types';

export function ClaimCard({ claim }: { claim: ClaimSummaryResponse }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <ClaimStatusBadge status={claim.status} />
        </div>
        <p className="font-bold text-sm text-[#111827] truncate">{claim.itemTitle}</p>
        <p className="text-xs text-gray-500 mt-0.5">Submitted {formatRelative(claim.createdAt)}</p>
      </div>
      <Link href={`/admin/claims/${claim.id}`} className="shrink-0">
        <Button size="sm">Review</Button>
      </Link>
    </div>
  );
}
