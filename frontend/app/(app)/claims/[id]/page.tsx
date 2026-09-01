'use client';

import { use } from 'react';
import useSWR from 'swr';
import { getClaim } from '@/lib/api/claims';
import { TopBar } from '@/components/layout/TopBar';
import { ClaimStatusBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ApprovedClaimCard } from '@/components/claims/ApprovedClaimCard';
import { AwaitingInfoCard } from '@/components/claims/AwaitingInfoCard';
import { formatRelative, getClaimStatusColor } from '@/lib/utils';

export default function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: claim, isLoading } = useSWR(['claim', id], () => getClaim(id), { revalidateOnFocus: false });

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Claim Details" />

      <div className="px-4 md:px-0 pb-10 max-w-2xl flex flex-col gap-5">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-32 mx-auto rounded-full" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        ) : !claim ? (
          <p className="text-center text-sm text-gray-500 py-16">Claim not found.</p>
        ) : claim.status === 'APPROVED' ? (
          <>
            <div className="flex justify-center">
              <span className={`inline-flex items-center px-5 py-2 rounded-full text-sm font-bold uppercase tracking-wide ${getClaimStatusColor(claim.status)}`}>
                Approved
              </span>
            </div>
            <ApprovedClaimCard claim={claim} />
          </>
        ) : claim.status === 'AWAITING_INFO' ? (
          <>
            <div className="flex justify-center">
              <span className={`inline-flex items-center px-5 py-2 rounded-full text-sm font-bold uppercase tracking-wide ${getClaimStatusColor(claim.status)}`}>
                Awaiting Info
              </span>
            </div>
            <AwaitingInfoCard claim={claim} />
          </>
        ) : (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-[#111827]">{claim.itemTitle}</p>
              <ClaimStatusBadge status={claim.status} />
            </div>
            <p className="text-xs text-gray-400">Submitted: {formatRelative(claim.createdAt)}</p>
            {claim.decisionReason && (
              <p className="text-sm text-gray-600 mt-3">{claim.decisionReason}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
