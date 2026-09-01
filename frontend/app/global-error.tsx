'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import './globals.css';

/**
 * Only rendered if the ROOT layout itself throws — must supply its own
 * <html>/<body> since app/layout.tsx (and everything it provides, including
 * AuthProvider) is presumed broken in this scenario. Deliberately minimal.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F5F6FA] px-6">
          <div className="flex flex-col items-center gap-5 text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle size={26} className="text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#111827] mb-1.5">ReFound hit a problem</h1>
              <p className="text-sm text-gray-500 leading-relaxed">
                Something broke at the application level. Reloading usually fixes this.
              </p>
              {error.digest && <p className="text-xs text-gray-400 mt-2">Reference: {error.digest}</p>}
            </div>
            <button
              type="button"
              onClick={reset}
              className="px-6 py-3.5 rounded-full text-sm font-bold bg-[#F97316] text-white hover:opacity-90 transition-opacity"
            >
              Reload ReFound
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
