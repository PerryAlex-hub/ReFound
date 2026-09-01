'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { FileText, ChevronRight } from 'lucide-react';
import useSWR from 'swr';
import gsap from 'gsap';
import { getMyClaims } from '@/lib/api/claims';
import { ClaimStatusBadge } from '@/components/ui/Badge';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { TopBar } from '@/components/layout/TopBar';
import { formatRelative, formatDate } from '@/lib/utils';

export default function ClaimsPage() {
  const cardsRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useSWR('my-claims', () => getMyClaims({ size: 50 }), { revalidateOnFocus: false });

  useEffect(() => {
    // Guard on length too — gsap.from() against a selector that matches nothing (the
    // empty-state render has no .claim-card-anim elements) logs a console warning.
    if (!isLoading && data && data.content.length > 0) {
      const ctx = gsap.context(() => {
        gsap.from('.claim-card-anim', { opacity: 0, y: 16, stagger: 0.08, duration: 0.4, ease: 'power2.out' });
      });
      return () => ctx.revert();
    }
  }, [isLoading, data]);

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="My Claims" />
      <div className="px-4 md:px-0 pb-6">
        <div ref={cardsRef} className="flex flex-col gap-3">
          {isLoading ? (
            <ListSkeleton count={3} />
          ) : !data?.content.length ? (
            <EmptyState
              icon={<FileText size={24} />}
              title="No claims yet"
              description="When you claim a found item, it will appear here."
            />
          ) : (
            data.content.map((claim) => (
              <Link key={claim.id} href={`/claims/${claim.id}`} className="claim-card-anim block">
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow active:scale-[0.99]">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-bold text-sm text-[#111827] truncate">{claim.itemTitle}</p>
                      <ClaimStatusBadge status={claim.status} />
                    </div>
                    <p className="text-xs text-gray-400">
                      {claim.status === 'APPROVED' && claim.decidedAt
                        ? `Approved: ${formatDate(claim.decidedAt)}`
                        : `Submitted: ${formatRelative(claim.createdAt)}`}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 shrink-0" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
