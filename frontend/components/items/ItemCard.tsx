import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ChevronRight } from 'lucide-react';
import { ItemSummaryResponse } from '@/lib/types';
import { ItemTypeBadge, ItemStatusBadge } from '@/components/ui/Badge';
import { formatOccurredOn } from '@/lib/utils';
import { CategoryLucideIcon } from '@/components/items/CategoryIcon';

interface ItemCardProps {
  item: ItemSummaryResponse;
  showType?: boolean;
  showStatus?: boolean;
}

export function ItemCard({ item, showType = true, showStatus = false }: ItemCardProps) {
  return (
    <Link href={`/items/${item.id}`} className="block">
      <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3 hover:shadow-sm transition-shadow active:scale-[0.99] transition-transform">
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
          {item.thumbnailUrl ? (
            <Image src={item.thumbnailUrl} alt={item.title} fill sizes="64px" className="object-cover" />
          ) : item.hasPhotos ? (
            <div className="flex flex-col items-center gap-1 text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span className="text-[8px] font-medium text-center leading-tight">Photo after verify</span>
            </div>
          ) : (
            <CategoryLucideIcon category={item.category} size={24} className="text-gray-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {showType && <ItemTypeBadge type={item.type} />}
            {showStatus && <ItemStatusBadge status={item.status} />}
            <span className="text-xs text-gray-400 ml-auto shrink-0">{formatOccurredOn(item.occurredOn).replace(', 2026', '')}</span>
          </div>
          <p className="font-bold text-sm text-[#111827] truncate">{item.title}</p>
          {item.locationLabel && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={11} className="text-gray-400 shrink-0" />
              <span className="text-xs text-gray-500 truncate">{item.locationLabel}</span>
            </div>
          )}
        </div>

        <ChevronRight size={16} className="text-gray-300 shrink-0" />
      </div>
    </Link>
  );
}
