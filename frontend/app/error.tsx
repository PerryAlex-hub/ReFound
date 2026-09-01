'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { user } = useAuth();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F5F6FA] px-6">
      <div className="flex flex-col items-center gap-5 text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle size={26} className="text-red-500" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-[#111827] mb-1.5">Something went wrong</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            An unexpected error interrupted this page. It&apos;s been logged — try again, or head
            back and pick up where you left off.
          </p>
          {error.digest && <p className="text-xs text-gray-400 mt-2">Reference: {error.digest}</p>}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-1">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm font-bold bg-[#F97316] text-white hover:opacity-90 transition-opacity"
          >
            <RotateCcw size={15} /> Try Again
          </button>
          <Link
            href={user ? '/dashboard' : '/'}
            className="inline-flex items-center justify-center px-6 py-3.5 rounded-full text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {user ? 'Go to Dashboard' : 'Go Home'}
          </Link>
        </div>
      </div>
    </div>
  );
}
