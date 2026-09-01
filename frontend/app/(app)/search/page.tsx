'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CategoryChips } from '@/components/browse/CategoryChips';
import { DEFAULT_FILTERS, filtersFromParams, filtersToParams } from '@/components/browse/filterParams';
import { Category, ItemType } from '@/lib/types';

export default function SearchFilterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = filtersFromParams(searchParams);

  const [q, setQ] = useState(initial.q);
  const [type, setType] = useState<ItemType>(initial.type || 'LOST');
  const [category, setCategory] = useState<Category | ''>(initial.category);
  const [dateFrom, setDateFrom] = useState(initial.dateFrom);
  const [dateTo, setDateTo] = useState(initial.dateTo);
  const [location, setLocation] = useState(initial.location);

  const applyFilters = () => {
    const params = filtersToParams({ q, type, category, dateFrom, dateTo, location });
    router.push(`/dashboard?${params.toString()}`);
  };

  const resetFilters = () => {
    setQ(DEFAULT_FILTERS.q);
    setType(DEFAULT_FILTERS.type || 'LOST');
    setCategory(DEFAULT_FILTERS.category);
    setDateFrom(DEFAULT_FILTERS.dateFrom);
    setDateTo(DEFAULT_FILTERS.dateTo);
    setLocation(DEFAULT_FILTERS.location);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Search & Filter" />

      <div className="px-4 md:px-0 pb-6 flex flex-col gap-5 max-w-xl">
        <Input
          label="Keywords"
          placeholder="e.g. AirPods Pro"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div>
          <p className="text-sm font-semibold text-[#111827] mb-1.5">Report Type</p>
          <div className="flex bg-white rounded-2xl p-1 border border-gray-100 shadow-sm">
            {(['LOST', 'FOUND'] as ItemType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  type === t ? 'bg-[#F97316] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'LOST' ? 'Lost' : 'Found'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-[#111827] mb-1.5">Category</p>
          <CategoryChips value={category} onChange={setCategory} wrap />
        </div>

        <div>
          <p className="text-sm font-semibold text-[#111827] mb-1.5">Date Range</p>
          <div className="flex gap-3">
            <Input
              type="date"
              aria-label="From date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              max={dateTo || undefined}
            />
            <Input
              type="date"
              aria-label="To date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              min={dateFrom || undefined}
            />
          </div>
        </div>

        <Input
          label="Location Found"
          placeholder="e.g. Science Faculty"
          icon={<MapPin size={15} />}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <div className="flex flex-col items-center gap-4 mt-2">
          <Button onClick={applyFilters} fullWidth size="lg">
            Apply Filters
          </Button>
          <button
            type="button"
            onClick={resetFilters}
            className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}
