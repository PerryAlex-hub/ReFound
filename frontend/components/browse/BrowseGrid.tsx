import { ItemSummaryResponse } from '@/lib/types';
import { ItemGridCard } from '@/components/items/ItemGridCard';
import { Skeleton } from '@/components/ui/Skeleton';

interface BrowseGridProps {
  items: ItemSummaryResponse[];
}

export function BrowseGrid({ items }: BrowseGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {items.map((item) => (
        <div key={item.id} className="item-card-anim">
          <ItemGridCard item={item} />
        </div>
      ))}
    </div>
  );
}

export function BrowseGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <Skeleton className="w-full aspect-[4/3]" />
          <div className="p-4 flex flex-col gap-2">
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-3.5 w-24 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
