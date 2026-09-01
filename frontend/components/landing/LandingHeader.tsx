import Link from 'next/link';
import { Search } from 'lucide-react';

/**
 * Public marketing header shown to logged-out visitors on the landing page.
 * Mirrors the authenticated `TopNav` shell (logo, height, spacing) but swaps
 * the nav links / bell / avatar for Sign In + Get Started, since there's no
 * user session yet.
 */
export function LandingHeader() {
  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-[#F97316] flex items-center justify-center">
            <Search size={15} className="text-white" />
          </div>
          <span className="font-extrabold text-lg text-[#111827]">ReFound</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-sm font-semibold text-gray-600 hover:text-[#111827] transition-colors px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold bg-[#F97316] text-white px-5 py-2.5 rounded-full hover:opacity-90 active:opacity-80 transition-opacity"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
