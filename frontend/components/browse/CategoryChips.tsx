'use client';

import { Category } from '@/lib/types';
import { ALL_CATEGORIES, CATEGORY_LABELS } from '@/lib/utils';
import { CategoryLucideIcon } from '@/components/items/CategoryIcon';

interface CategoryChipsProps {
  value: Category | '';
  onChange: (value: Category | '') => void;
  /** Wrap onto multiple lines instead of horizontal scroll — used on the Search & Filter page. */
  wrap?: boolean;
}

const chipClass = (active: boolean) =>
  `flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 border transition-all ${
    active
      ? 'border-[#F97316] bg-[#FFF7ED] text-[#F97316]'
      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
  }`;

export function CategoryChips({ value, onChange, wrap = false }: CategoryChipsProps) {
  return (
    <div className={wrap ? 'flex flex-wrap gap-2' : 'flex gap-2 overflow-x-auto scrollbar-hide pb-1'}>
      <button type="button" onClick={() => onChange('')} className={chipClass(value === '')}>
        All
      </button>
      {ALL_CATEGORIES.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onChange(cat === value ? '' : cat)}
          className={chipClass(value === cat)}
        >
          <CategoryLucideIcon category={cat} size={13} />
          {CATEGORY_LABELS[cat]}
        </button>
      ))}
    </div>
  );
}
