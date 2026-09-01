import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { ItemSummaryResponse } from '@/lib/types';
import { ItemTypeBadge } from '@/components/ui/Badge';
import { formatOccurredOn } from '@/lib/utils';
import { CategoryLucideIcon } from '@/components/items/CategoryIcon';

interface ItemGridCardProps {
  item: ItemSummaryResponse;
}

/** Grid-friendly card for the desktop browse layout — image-first, mirrors ItemCard's data/logic. */
export function ItemGridCard({ item }: ItemGridCardProps) {
  return (
    <Link href={`/items/${item.id}`} className="block group">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
        <div className="relative w-full aspect-[4/3] bg-gray-100 flex items-center justify-center overflow-hidden">
          {item.thumbnailUrl ? (
            <Image
              src={item.thumbnailUrl}
              alt={item.title}
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover group-hover:scale-[1.03] transition-transform"
            />
          ) : (
            <CategoryLucideIcon category={item.category} size={36} className="text-gray-300" />
          )}
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <ItemTypeBadge type={item.type} />
            <span className="text-xs text-gray-400">{formatOccurredOn(item.occurredOn)}</span>
          </div>
          <p className="font-bold text-sm text-[#111827] truncate mb-1">{item.title}</p>
          {item.locationLabel && (
            <div className="flex items-center gap-1">
              <MapPin size={11} className="text-gray-400 shrink-0" />
              <span className="text-xs text-gray-500 truncate">{item.locationLabel}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
