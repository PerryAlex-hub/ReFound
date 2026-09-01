'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MatchResponse } from '@/lib/types';
import { formatMatchPercent, deriveBreakdownTags } from '@/lib/utils';
import { CategoryLucideIcon } from '@/components/items/CategoryIcon';
import { Button } from '@/components/ui/Button';
import gsap from 'gsap';

interface MatchCardProps {
  match: MatchResponse;
  onDismiss: (id: string) => void;
  dismissing?: boolean;
}

export function MatchCard({ match, onDismiss, dismissing }: MatchCardProps) {
  const router = useRouter();
  const barRef = useRef<HTMLDivElement>(null);
  const pct = formatMatchPercent(match.score);
  const tags = deriveBreakdownTags(match.breakdown);
  const item = match.candidate;

  useEffect(() => {
    if (!barRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(barRef.current, { width: '0%' }, { width: `${pct}%`, duration: 1, ease: 'power2.out', delay: 0.2 });
    });
    return () => ctx.revert();
  }, [pct]);

  const matchColor = pct >= 85 ? 'text-green-600 bg-green-50' : pct >= 65 ? 'text-amber-600 bg-amber-50' : 'text-blue-600 bg-blue-50';
  const barColor = pct >= 85 ? 'bg-green-500' : pct >= 65 ? 'bg-amber-500' : 'bg-blue-500';

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex gap-3 mb-3">
        <div className="w-16 h-16 rounded-xl bg-gray-100 shrink-0 flex items-center justify-center overflow-hidden">
          {item.thumbnailUrl ? (
            <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <CategoryLucideIcon category={item.category} size={24} className="text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold mb-1 ${matchColor}`}>
            {pct}% Match
          </span>
          <p className="font-bold text-sm text-[#111827] truncate">{item.title}</p>
          {item.locationLabel && (
            <p className="text-xs text-gray-500 truncate mt-0.5">{item.locationLabel}</p>
          )}
        </div>
      </div>

      <div className="h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
        <div ref={barRef} className={`h-full rounded-full ${barColor}`} style={{ width: 0 }} />
      </div>

      {tags.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {tags.map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">{tag}</span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          fullWidth
          onClick={() => router.push(`/claims/new?foundItemId=${item.id}`)}
        >
          Claim This
        </Button>
        <Button
          size="sm"
          variant="secondary"
          fullWidth
          onClick={() => onDismiss(match.id)}
          loading={dismissing}
        >
          Not Mine
        </Button>
      </div>
    </div>
  );
}
