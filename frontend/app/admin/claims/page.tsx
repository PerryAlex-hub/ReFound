'use client';

import { useState } from 'react';
import { Search, FileText } from 'lucide-react';
import useSWR from 'swr';
import { getAdminClaims } from '@/lib/api/admin';
import { useAccumulatedPages } from '@/lib/hooks/useAccumulatedPages';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { ListSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ClaimCard } from '@/components/admin/ClaimCard';
import { ClaimTableRow } from '@/components/admin/ClaimTableRow';
import { Pagination } from '@/components/ui/Pagination';
import { ClaimStatus } from '@/lib/types';

const STATUS_TABS: ClaimStatus[] = ['PENDING', 'AWAITING_INFO', 'APPROVED', 'REJECTED'];

const STATUS_OPTIONS = STATUS_TABS.map((s) => ({ value: s, label: `Status: ${s.replace('_', ' ')}` }));

export default function AdminClaimsPage() {
  const [status, setStatus] = useState<ClaimStatus>('PENDING');
  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');

  const { data, isLoading } = useSWR(
    ['admin-claims', status, page],
    () => getAdminClaims({ status, page, size: 20 }),
    { revalidateOnFocus: false }
  );

  // Mobile: "Load More" grows the list instead of replacing it.
  const mobile = useAccumulatedPages(
    ['admin-claims-infinite', status],
    (pageIndex) => getAdminClaims({ status, page: pageIndex, size: 20 }),
  );

  // The claims list endpoint has no free-text search param, so this filters
  // the currently loaded page(s) client-side by item title only (real field).
  const visibleClaims = data?.content.filter((c) =>
    !q.trim() || c.itemTitle.toLowerCase().includes(q.trim().toLowerCase())
  ) ?? [];
  const visibleMobileClaims = mobile.items.filter((c) =>
    !q.trim() || c.itemTitle.toLowerCase().includes(q.trim().toLowerCase())
  );

  const rangeStart = data && data.totalElements > 0 ? data.page * data.size + 1 : 0;
  const rangeEnd = data ? Math.min(data.page * data.size + data.content.length, data.totalElements) : 0;

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Claims Review Queue" />

      <p className="hidden md:block text-sm text-gray-500 -mt-4 mb-6">
        Secure review chamber. Students must provide detailed description verification.
      </p>

      {/* Mobile status tabs */}
      <div className="md:hidden flex gap-2 px-4 overflow-x-auto scrollbar-hide pb-1 mb-4">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(0); mobile.reset(); }}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              status === s ? 'bg-[#F97316] text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="px-4 md:px-0 pb-6 flex flex-col gap-4">
        {/* Desktop filters */}
        <div className="hidden md:flex md:items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search claimant, matric or item name..."
              icon={<Search size={16} />}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="w-56">
            <Select
              options={STATUS_OPTIONS}
              value={status}
              onChange={(e) => { setStatus(e.target.value as ClaimStatus); setPage(0); mobile.reset(); }}
            />
          </div>
          {data && (
            <p className="text-xs text-gray-400 font-semibold shrink-0">
              Showing {rangeStart}-{rangeEnd} of {data.totalElements.toLocaleString()} {status.toLowerCase().replace('_', ' ')}
            </p>
          )}
        </div>

        {/* Mobile list */}
        <div className="md:hidden flex flex-col gap-3">
          {mobile.isLoadingInitial ? (
            <ListSkeleton count={5} />
          ) : !visibleMobileClaims.length ? (
            <EmptyState icon={<FileText size={24} />} title="No claims" description={`No ${status.toLowerCase().replace('_', ' ')} claims.`} />
          ) : (
            visibleMobileClaims.map((claim) => <ClaimCard key={claim.id} claim={claim} />)
          )}
        </div>

        {mobile.hasMore && (
          <div className="md:hidden">
            <Button variant="secondary" fullWidth onClick={mobile.loadMore} loading={mobile.isLoadingMore}>Load More</Button>
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-6 flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
            </div>
          ) : !visibleClaims.length ? (
            <EmptyState icon={<FileText size={24} />} title="No claims" description={`No ${status.toLowerCase().replace('_', ' ')} claims.`} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wide">Item</th>
                    <th className="py-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Category</th>
                    <th className="py-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Submitted</th>
                    <th className="py-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Time Waiting</th>
                    <th className="py-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wide text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleClaims.map((claim) => (
                    <ClaimTableRow key={claim.id} claim={claim} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {data && data.totalPages > 1 && (
          <div className="hidden md:block">
            <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
