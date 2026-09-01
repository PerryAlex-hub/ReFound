'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function NotFound() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center bg-gradient-to-br from-[#FB923C] to-[#EA580C] px-6">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-white/15 flex items-center justify-center">
          <div className="w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center shadow-lg">
            <Search size={30} className="text-[#F97316]" />
          </div>
        </div>

        <div>
          <p className="text-6xl font-extrabold text-white tracking-tight mb-2">404</p>
          <h1 className="text-xl font-bold text-white mb-1.5">This page got lost too</h1>
          <p className="text-sm font-medium text-white/85 leading-relaxed">
            No luck finding it here — the page you&apos;re after doesn&apos;t exist or has moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm font-bold text-white border border-white/40 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={16} /> Go Back
          </button>
          <Link
            href={user ? '/dashboard' : '/'}
            className="inline-flex items-center justify-center px-6 py-3.5 rounded-full text-sm font-bold bg-white text-[#F97316] hover:opacity-90 transition-opacity"
          >
            {user ? 'Back to Dashboard' : 'Back to ReFound'}
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 inset-x-0 flex flex-col items-center gap-0.5">
        <p className="text-xs text-white/70">Campus Lost &amp; Found Platform</p>
        <p className="text-[11px] text-white/50">v1.0.2</p>
      </div>
    </div>
  );
}
