import { ShieldAlert } from 'lucide-react';

export function CompetingClaimsBanner({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
      <ShieldAlert size={18} className="text-amber-600 shrink-0" />
      <p className="text-sm font-semibold text-amber-800">
        {count} other claim{count !== 1 ? 's' : ''} pending on this item. Evaluate verification answers thoroughly.
      </p>
    </div>
  );
}
