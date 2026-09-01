'use client';

import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Category, ItemType } from '@/lib/types';
import { ALL_CATEGORIES, CATEGORY_LABELS } from '@/lib/utils';

interface FilterSidebarProps {
  q: string;
  onQChange: (value: string) => void;
  type: ItemType | '';
  onTypeChange: (value: ItemType | '') => void;
  category: Category | '';
  onCategoryChange: (value: Category | '') => void;
  location: string;
  onLocationChange: (value: string) => void;
}

const STATES: { value: ItemType | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'LOST', label: 'Lost' },
  { value: 'FOUND', label: 'Found' },
];

/** Desktop-only left filter panel — hidden below `md`, where the mobile toggle/chips take over. */
export function FilterSidebar({
  q, onQChange, type, onTypeChange, category, onCategoryChange, location, onLocationChange,
}: FilterSidebarProps) {
  return (
    <aside className="hidden md:block w-64 shrink-0">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
        <h2 className="text-base font-bold text-[#111827] mb-5">Filters</h2>

        <div className="mb-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Search</p>
          <Input
            placeholder="Type to find items..."
            icon={<Search size={15} />}
            value={q}
            onChange={(e) => onQChange(e.target.value)}
          />
        </div>

        <div className="mb-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Item State</p>
          <div className="flex bg-[#F5F6FA] rounded-xl p-1">
            {STATES.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => onTypeChange(s.value)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  type === s.value ? 'bg-[#F97316] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Category</p>
          <div className="flex flex-col gap-2.5">
            {ALL_CATEGORIES.map((cat) => (
              <label key={cat} className="flex items-center gap-2.5 cursor-pointer text-sm text-[#111827]">
                <input
                  type="checkbox"
                  checked={category === cat}
                  onChange={() => onCategoryChange(category === cat ? '' : cat)}
                  className="w-4 h-4 rounded accent-[#F97316] cursor-pointer"
                />
                {CATEGORY_LABELS[cat]}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Location</p>
          <Input
            placeholder="e.g. Science Library"
            icon={<MapPin size={15} />}
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
          />
        </div>
      </div>
    </aside>
  );
}
