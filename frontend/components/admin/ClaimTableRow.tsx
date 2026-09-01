import Link from 'next/link';
import { ClaimStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, formatRelative, CATEGORY_LABELS } from '@/lib/utils';
import { ClaimSummaryResponse } from '@/lib/types';

// Note: the claims list endpoint (ClaimSummaryResponse) doesn't return a claimant
// name/matric or a competing-claims count — those only exist on the single-claim
// detail response. This row shows what's actually available rather than inventing
// placeholder claimant data.
export function ClaimTableRow({ claim }: { claim: ClaimSummaryResponse }) {
  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors">
      <td className="py-4 px-5">
        <span className="font-semibold text-sm text-[#111827]">{claim.itemTitle}</span>
      </td>
      <td className="py-4 px-2 text-sm text-gray-600">{CATEGORY_LABELS[claim.itemCategory]}</td>
      <td className="py-4 px-2 text-sm text-gray-600 whitespace-nowrap">{formatDate(claim.createdAt)}</td>
      <td className="py-4 px-2 text-sm text-gray-600 whitespace-nowrap">{formatRelative(claim.createdAt)}</td>
      <td className="py-4 px-2">
        <ClaimStatusBadge status={claim.status} />
      </td>
      <td className="py-4 px-5 text-right">
        <Link href={`/admin/claims/${claim.id}`}>
          <Button size="sm">Review</Button>
        </Link>
      </td>
    </tr>
  );
}
