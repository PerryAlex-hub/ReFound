import Link from 'next/link';
import { ItemSummaryResponse } from '@/lib/types';
import { ItemStatusBadge } from '@/components/ui/Badge';
import { CATEGORY_LABELS, formatOccurredOn } from '@/lib/utils';
import { CategoryLucideIcon } from '@/components/items/CategoryIcon';

interface ItemTableRowProps {
  item: ItemSummaryResponse;
}

export function ItemTableRow({ item }: ItemTableRowProps) {
  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors">
      <td className="py-4 pl-6 pr-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
            <CategoryLucideIcon category={item.category} size={18} className="text-[#F97316]" />
          </div>
          <span className="font-bold text-sm text-[#111827] truncate">{item.title}</span>
        </div>
      </td>
      <td className="py-4 pr-4 text-sm text-gray-600">{CATEGORY_LABELS[item.category]}</td>
      <td className="py-4 pr-4">
        <ItemStatusBadge status={item.status} />
      </td>
      <td className="py-4 pr-4 text-sm text-gray-600 whitespace-nowrap">{formatOccurredOn(item.occurredOn)}</td>
      <td className="py-4 pr-6">
        <div className="flex items-center justify-end gap-4">
          <Link href={`/items/${item.id}`} className="text-sm font-semibold text-[#F97316] hover:opacity-80">
            View
          </Link>
          <Link href={`/items/${item.id}/edit`} className="text-sm font-semibold text-gray-500 hover:text-gray-700">
            Edit
          </Link>
        </div>
      </td>
    </tr>
  );
}
