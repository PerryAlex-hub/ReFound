'use client';

import { useEffect, useRef, useState } from 'react';
import { Archive } from 'lucide-react';
import useSWR from 'swr';
import gsap from 'gsap';
import { getMyItems } from '@/lib/api/items';
import { ItemCard } from '@/components/items/ItemCard';
import { ItemTableRow } from '@/components/items/ItemTableRow';
import { ListSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { PillToggle } from '@/components/ui/PillToggle';
import { ItemType } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

const TAB_LABELS: Record<ItemType, string> = { LOST: 'Lost Reports', FOUND: 'Found Reports' };

export default function MyItemsPage() {
  const [activeType, setActiveType] = useState<ItemType>('LOST');
  const cardsRef = useRef<HTMLDivElement>(null);

  // GET /items/mine takes no `type` filter, so splitting by tab has to happen
  // here. Previously both tabs issued the same request and therefore showed the
  // same list, and the two count-only fetches both reported the grand total.
  //
  // One request for everything, then filtered and paged client-side. Safe at
  // this scale: these are one student's own reports, not the whole campus.
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data: allData, isLoading } = useSWR(
    'my-items-all',
    () => getMyItems({ size: 200 }),
    { revalidateOnFocus: false }
  );

  const allItems = allData?.content ?? [];
  const counts: Record<ItemType, number> = {
    LOST: allItems.filter((i) => i.type === 'LOST').length,
    FOUND: allItems.filter((i) => i.type === 'FOUND').length,
  };

  const filtered = allItems.filter((i) => i.type === activeType);

  // Desktop: numbered pagination, one page shown at a time.
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  // Mobile: "Load More" grows the list instead of replacing it.
  const mobileItems = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const loadMore = () => setVisibleCount((c) => c + PAGE_SIZE);

  useEffect(() => {
    // Guard on length too — gsap.from() against a selector that matches nothing (the
    // empty-state render has no .my-item-card elements) logs a console warning. Only
    // animate the initial load, not items appended by "Load More" (they'd re-flash
    // cards already on screen).
    if (!isLoading && mobileItems.length > 0) {
      const ctx = gsap.context(() => {
        gsap.from('.my-item-card', { opacity: 0, y: 16, stagger: 0.07, duration: 0.4, ease: 'power2.out' });
      });
      return () => ctx.revert();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the initial-load transition should replay this
  }, [isLoading, activeType]);

  const handleTabChange = (t: ItemType) => {
    setActiveType(t);
    setPage(0);
    setVisibleCount(PAGE_SIZE);
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
      <div className="md:hidden mb-5">
        <PillToggle
          options={[{ value: 'LOST', label: 'Lost' }, { value: 'FOUND', label: 'Found' }]}
          value={activeType}
          onChange={(t) => handleTabChange(t as ItemType)}
        />
      </div>

      {/* Mobile: card list */}
      <div ref={cardsRef} className="md:hidden flex flex-col gap-3">
        {isLoading ? (
          <ListSkeleton count={4} />
        ) : mobileItems.length === 0 ? (
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
          mobileItems.map((item) => (
            <div key={item.id} className="my-item-card">
              <ItemCard item={item} showType showStatus />
            </div>
          ))
        )}
      </div>

      {hasMore && (
        <div className="mt-4 md:hidden">
          <Button variant="secondary" fullWidth onClick={loadMore}>
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
        ) : pageItems.length === 0 ? (
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
              {pageItems.map((item) => (
                <ItemTableRow key={item.id} item={item} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="hidden md:block mt-4">
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
