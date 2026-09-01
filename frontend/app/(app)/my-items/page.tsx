'use client';

import { useEffect, useRef, useState } from 'react';
import { Archive } from 'lucide-react';
import useSWR from 'swr';
import gsap from 'gsap';
import { getMyItems } from '@/lib/api/items';
import { useAccumulatedPages } from '@/lib/hooks/useAccumulatedPages';
import { ItemCard } from '@/components/items/ItemCard';
import { ItemTableRow } from '@/components/items/ItemTableRow';
import { ListSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { ItemType } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

const TAB_LABELS: Record<ItemType, string> = { LOST: 'Lost Reports', FOUND: 'Found Reports' };

export default function MyItemsPage() {
  const [activeType, setActiveType] = useState<ItemType>('LOST');
  const cardsRef = useRef<HTMLDivElement>(null);

  // Desktop: numbered pagination, one page shown at a time (replace on click).
  const [page, setPage] = useState(0);
  const { data, isLoading } = useSWR(
    ['my-items', activeType, page],
    () => getMyItems({ type: activeType, page, size: 20 }),
    { revalidateOnFocus: false }
  );

  // Mobile: "Load More" grows the list instead of replacing it.
  const mobile = useAccumulatedPages(
    ['my-items-infinite', activeType],
    (pageIndex) => getMyItems({ type: activeType, page: pageIndex, size: 20 }),
  );

  // Lightweight count-only fetches so both tab labels can show totals regardless of which tab is active.
  const { data: lostCountData } = useSWR(
    ['my-items-count', 'LOST'],
    () => getMyItems({ type: 'LOST', size: 1 }),
    { revalidateOnFocus: false }
  );
  const { data: foundCountData } = useSWR(
    ['my-items-count', 'FOUND'],
    () => getMyItems({ type: 'FOUND', size: 1 }),
    { revalidateOnFocus: false }
  );
  const counts: Record<ItemType, number> = {
    LOST: lostCountData?.totalElements ?? 0,
    FOUND: foundCountData?.totalElements ?? 0,
  };

  useEffect(() => {
    // Guard on length too — gsap.from() against a selector that matches nothing (the
    // empty-state render has no .my-item-card elements) logs a console warning. Only
    // animate the initial load, not items appended by "Load More" (they'd re-flash
    // cards already on screen).
    if (!mobile.isLoadingInitial && mobile.items.length > 0) {
      const ctx = gsap.context(() => {
        gsap.from('.my-item-card', { opacity: 0, y: 16, stagger: 0.07, duration: 0.4, ease: 'power2.out' });
      });
      return () => ctx.revert();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the initial-load transition should replay this
  }, [mobile.isLoadingInitial, activeType]);

  const handleTabChange = (t: ItemType) => {
    setActiveType(t);
    setPage(0);
    mobile.reset();
  };

  return (
    <div className="px-4 pt-5 pb-4 md:px-0 md:pt-8 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-extrabold text-[#111827]">
          <span className="md:hidden">My Items</span>
          <span className="hidden md:inline">My Item Reports</span>
        </h1>
        <Link href={`/items/new?type=${activeType.toLowerCase()}`} className="hidden md:block">
          <Button>Create New Report</Button>
        </Link>
      </div>

      {/* Mobile: pill toggle */}
      <div className="flex md:hidden bg-white rounded-2xl p-1 border border-gray-100 mb-5 shadow-sm">
        {(['LOST', 'FOUND'] as ItemType[]).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeType === t ? 'bg-[#F97316] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'LOST' ? 'Lost' : 'Found'}
          </button>
        ))}
      </div>

      {/* Mobile: card list */}
      <div ref={cardsRef} className="md:hidden flex flex-col gap-3">
        {mobile.isLoadingInitial ? (
          <ListSkeleton count={4} />
        ) : mobile.items.length === 0 ? (
          <EmptyState
            icon={<Archive size={24} />}
            title={`No ${activeType.toLowerCase()} reports`}
            description="You haven't reported any items yet."
            action={
              <Link href={`/items/new?type=${activeType.toLowerCase()}`}>
                <Button>Report {activeType === 'LOST' ? 'Lost' : 'Found'} Item</Button>
              </Link>
            }
          />
        ) : (
          mobile.items.map((item) => (
            <div key={item.id} className="my-item-card">
              <ItemCard item={item} showType showStatus />
            </div>
          ))
        )}
      </div>

      {mobile.hasMore && (
        <div className="mt-4 md:hidden">
          <Button variant="secondary" fullWidth onClick={mobile.loadMore} loading={mobile.isLoadingMore}>
            Load More
          </Button>
        </div>
      )}

      {/* Desktop: tabbed table */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex gap-8 px-6 border-b border-gray-100">
          {(['LOST', 'FOUND'] as ItemType[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={`py-4 text-sm font-bold border-b-2 -mb-px transition-colors ${
                activeType === t ? 'text-[#F97316] border-[#F97316]' : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              {TAB_LABELS[t]} ({counts[t]})
            </button>
          ))}
        </div>

        {isLoading ? (
          <table className="w-full">
            <tbody>
              {Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="py-4 pl-6 pr-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                      <Skeleton className="h-4 w-32 rounded" />
                    </div>
                  </td>
                  <td className="py-4 pr-4"><Skeleton className="h-4 w-20 rounded" /></td>
                  <td className="py-4 pr-4"><Skeleton className="h-5 w-24 rounded-full" /></td>
                  <td className="py-4 pr-4"><Skeleton className="h-4 w-20 rounded" /></td>
                  <td className="py-4 pr-6" />
                </tr>
              ))}
            </tbody>
          </table>
        ) : data?.content.length === 0 ? (
          <div className="py-4">
            <EmptyState
              icon={<Archive size={24} />}
              title={`No ${activeType.toLowerCase()} reports`}
              description="You haven't reported any items yet."
              action={
                <Link href={`/items/new?type=${activeType.toLowerCase()}`}>
                  <Button>Report {activeType === 'LOST' ? 'Lost' : 'Found'} Item</Button>
                </Link>
              }
            />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide">
                <th className="py-3 pl-6 pr-4 font-bold">Item</th>
                <th className="py-3 pr-4 font-bold">Category</th>
                <th className="py-3 pr-4 font-bold">Status</th>
                <th className="py-3 pr-4 font-bold">Date Reported</th>
                <th className="py-3 pr-6 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.content.map((item) => (
                <ItemTableRow key={item.id} item={item} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="hidden md:block mt-4">
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
