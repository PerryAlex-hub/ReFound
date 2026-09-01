'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';

interface TopBarProps {
  title: string;
  back?: boolean;
  trailing?: ReactNode;
}

export function TopBar({ title, back = true, trailing }: TopBarProps) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-3 px-4 md:px-0 py-4 md:py-8 bg-[#F5F6FA] sticky md:static top-0 z-10">
      {back && (
        <button
          onClick={() => router.back()}
          className="md:hidden w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm text-[#111827] hover:bg-gray-50 transition-colors shrink-0"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
      )}
      <h1 className="text-lg md:text-3xl font-bold md:font-extrabold text-[#111827] flex-1">{title}</h1>
      {trailing}
    </div>
  );
}
