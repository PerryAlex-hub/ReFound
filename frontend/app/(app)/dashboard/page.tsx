'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, Bell, Sparkles, ChevronRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import gsap from 'gsap';
import useSWR from 'swr';
import { useAuth } from '@/lib/auth-context';
import { getItems } from '@/lib/api/items';
import { getUnreadCount } from '@/lib/api/notifications';
import { ItemCard } from '@/components/items/ItemCard';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PillToggle } from '@/components/ui/PillToggle';
import { useRotatingPlaceholder } from '@/lib/hooks/useRotatingPlaceholder';
import { getGreeting, getFirstName } from '@/lib/utils';
import { Category, ItemType } from '@/lib/types';
import { CategoryChips } from '@/components/browse/CategoryChips';
import { FilterSidebar } from '@/components/browse/FilterSidebar';
import { SortControl, SortOrder } from '@/components/browse/SortControl';
import { BrowseGrid, BrowseGridSkeleton } from '@/components/browse/BrowseGrid';
import { filtersFromParams, filtersToParams } from '@/components/browse/filterParams';
import { useMatchCount } from '@/lib/hooks/useMatchCount';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { count: matchCount } = useMatchCount();

  // Lazy-initialized from the URL so both the initial load and returning here from
  // /search's "Apply Filters" (a cross-route navigation that remounts this page) pick up
  // the right filters, without syncing state from a prop in an effect.
  const [activeType, setActiveType] = useState<ItemType | ''>(() => filtersFromParams(searchParams).type);
  const [activeCategory, setActiveCategory] = useState<Category | ''>(() => filtersFromParams(searchParams).category);
  const [searchQ, setSearchQ] = useState(() => filtersFromParams(searchParams).q);
  const [location, setLocation] = useState(() => filtersFromParams(searchParams).location);
  // Date range is only ever set via /search's "Apply Filters" (a cross-route
  // navigation that remounts this page), so there's no local setter to wire up here.
  const [dateFrom] = useState(() => filtersFromParams(searchParams).dateFrom);
  const [dateTo] = useState(() => filtersFromParams(searchParams).dateTo);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const cardsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useRotatingPlaceholder(searchInputRef, [
    'Search for AirPods Pro...',
    'Search for a leather wallet...',
    'Search for dorm keys...',
    'Search for a water bottle...',
  ]);

  // The API has no dedicated "location" text param, so fold it into the full-text query
  // alongside keywords (the mobile search bar itself is labelled "items, locations...").
  const effectiveQ = useMemo(
    () => [searchQ, location].filter(Boolean).join(' ').trim() || undefined,
    [searchQ, location]
  );

  const { data, isLoading } = useSWR(
    ['items', activeType, activeCategory, effectiveQ, dateFrom, dateTo, sortOrder],
    () => getItems({
      type: activeType || undefined,
      category: activeCategory || undefined,
      q: effectiveQ,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sort: sortOrder === 'newest' ? 'createdAt,desc' : 'createdAt,asc',
      size: 12,
    }),
    { revalidateOnFocus: false }
  );

  const { data: unread } = useSWR('unread-count', getUnreadCount, { refreshInterval: 30000 });

  useEffect(() => {
    // Guard on length too — gsap.from() against a selector that matches nothing (the
    // empty-state render has no .item-card-anim elements) logs a console warning.
    if (!isLoading && data && data.content.length > 0) {
      const ctx = gsap.context(() => {
        gsap.from('.item-card-anim', { opacity: 0, y: 20, stagger: 0.07, duration: 0.45, ease: 'power2.out' });
      });
      return () => ctx.revert();
    }
  }, [isLoading, data]);

  const firstName = user ? getFirstName(user.fullName) : '';
  const greeting = getGreeting();

  const openSearch = () => {
    const params = filtersToParams({ type: activeType, category: activeCategory, q: searchQ, location, dateFrom, dateTo });
    router.push(`/search?${params.toString()}`);
  };

  const seeAllParams = filtersToParams({ type: activeType || undefined });

  return (
    <div className="px-4 md:px-0 pt-5 md:pt-8 pb-4">
      {/* Mobile header — desktop uses TopNav's greeting/bell/avatar instead */}
      <div className="md:hidden flex items-center justify-between mb-5">
        <div>
          <p className="text-sm text-gray-500 font-medium">{greeting},</p>
          <h1 className="text-xl font-extrabold text-[#111827]">{firstName} 👋</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/notifications" className="relative w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
            <Bell size={18} className="text-gray-600" />
            {(unread ?? 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#F97316] text-white text-[10px] font-bold flex items-center justify-center">
                {unread}
              </span>
            )}
          </Link>
          <div className="w-10 h-10 rounded-xl bg-[#F97316] flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {user?.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
        </div>
      </div>

      {/* Suggested matches — the strongest feature in the app, and previously
          unreachable: /matches had no link anywhere in the UI. Shown on both
          layouts because the mobile bottom nav has no free slot. */}
      {matchCount > 0 && (
        <Link
          href="/matches"
          className="flex items-center gap-3 mb-5 p-4 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] hover:border-[#F97316] transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-[#F97316] flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#111827]">
              {matchCount} possible {matchCount === 1 ? 'match' : 'matches'} for your lost {matchCount === 1 ? 'item' : 'items'}
            </p>
            <p className="text-xs text-gray-600">
              We compared your reports against everything handed in. Take a look.
            </p>
          </div>
          <ChevronRight size={18} className="text-[#F97316] shrink-0" />
        </Link>
      )}

      {/* Mobile browse controls */}
      <div className="md:hidden">
        <div className="relative flex items-center mb-5">
          <Search size={16} className="absolute left-4 text-gray-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="w-full pl-10 pr-12 py-3 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/10 transition-all"
          />
          <button
            type="button"
            onClick={openSearch}
            aria-label="Open search filters"
            className="absolute right-3 p-1.5 rounded-lg bg-[#FFF7ED] text-[#F97316]"
          >
            <SlidersHorizontal size={15} />
          </button>
        </div>

        <PillToggle
          className="mb-5"
          options={[{ value: 'LOST', label: 'Lost' }, { value: 'FOUND', label: 'Found' }]}
          value={activeType || 'LOST'}
          onChange={(t) => setActiveType(t as ItemType)}
        />

        <div className="mb-5">
          <p className="text-sm font-bold text-[#111827] mb-3">Categories</p>
          <CategoryChips value={activeCategory} onChange={setActiveCategory} />
        </div>

        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-[#111827]">Recent Reports</p>
          <Link href={`/search?${seeAllParams.toString()}`} className="text-xs font-bold text-[#F97316] hover:opacity-80">See All</Link>
        </div>

        <div className="flex flex-col gap-3">
          {isLoading ? (
            <ListSkeleton count={3} />
          ) : data?.content.length === 0 ? (
            <EmptyState
              icon={<Search size={24} />}
              title="No items found"
              description="Try adjusting your filters or be the first to report."
            />
          ) : (
            data?.content.map((item) => (
              <div key={item.id} className="item-card-anim">
                <ItemCard item={item} showType showStatus={false} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Desktop browse layout */}
      <div ref={cardsRef} className="hidden md:flex md:items-start gap-8">
        <FilterSidebar
          q={searchQ}
          onQChange={setSearchQ}
          type={activeType}
          onTypeChange={setActiveType}
          category={activeCategory}
          onCategoryChange={setActiveCategory}
          location={location}
          onLocationChange={setLocation}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-extrabold text-[#111827]">Recent Reports</h1>
            <SortControl value={sortOrder} onChange={setSortOrder} />
          </div>

          {isLoading ? (
            <BrowseGridSkeleton />
          ) : data?.content.length === 0 ? (
            <EmptyState
              icon={<Search size={24} />}
              title="No items found"
              description="Try adjusting your filters or be the first to report."
            />
          ) : (
            <BrowseGrid items={data?.content ?? []} />
          )}
        </div>
      </div>
    </div>
  );
}
