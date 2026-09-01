import { ItemStatus, ItemType, ClaimStatus } from '@/lib/types';
import { getItemStatusColor, getItemTypeColor, getClaimStatusColor } from '@/lib/utils';

interface BadgeProps {
  label: string;
  className?: string;
}

export function Badge({ label, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

export function ItemTypeBadge({ type }: { type: ItemType }) {
  return (
    <Badge
      label={type}
      className={`${getItemTypeColor(type)} text-xs font-bold tracking-wide`}
    />
  );
}

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  const labels: Record<ItemStatus, string> = {
    OPEN: 'Open',
    CLAIM_PENDING: 'Claim Pending',
    MATCHED: 'Matched',
    RETURNED: 'Returned',
    EXPIRED: 'Expired',
    CANCELLED: 'Cancelled',
  };
  return (
    <Badge
      label={labels[status]}
      className={`${getItemStatusColor(status)} text-xs font-semibold`}
    />
  );
}

export function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  const labels: Record<ClaimStatus, string> = {
    PENDING: 'Pending',
    AWAITING_INFO: 'Awaiting Info',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    WITHDRAWN: 'Withdrawn',
  };
  return (
    <Badge
      label={labels[status]}
      className={`${getClaimStatusColor(status)} text-xs font-semibold`}
    />
  );
}
