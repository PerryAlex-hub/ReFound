'use client';

import { ChevronDown } from 'lucide-react';

export type SortOrder = 'newest' | 'oldest';

interface SortControlProps {
  value: SortOrder;
  onChange: (value: SortOrder) => void;
}

export function SortControl({ value, onChange }: SortControlProps) {
  return (
    <div className="relative inline-flex items-center shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOrder)}
        aria-label="Sort order"
        className="appearance-none bg-white border border-gray-200 rounded-full pl-4 pr-9 py-2 text-sm font-semibold text-[#111827] outline-none cursor-pointer transition-all focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/10"
      >
        <option value="newest">Sort: Newest First</option>
        <option value="oldest">Sort: Oldest First</option>
      </select>
      <ChevronDown size={14} className="absolute right-3 text-gray-400 pointer-events-none" />
    </div>
  );
}
