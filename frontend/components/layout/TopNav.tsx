'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Search, ChevronDown } from 'lucide-react';
import useSWR from 'swr';
import { useAuth } from '@/lib/auth-context';
import { getUnreadCount } from '@/lib/api/notifications';
import { useMatchCount } from '@/lib/hooks/useMatchCount';
import { getInitials, getFirstName } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Browse' },
  { href: '/my-items', label: 'My Items' },
  // Automatic suggestions are the point of the system, so they get a top-level
  // entry rather than being buried — the page existed with nothing linking to it.
  { href: '/matches', label: 'Matches' },
  { href: '/claims', label: 'My Claims' },
];

const navLinkClass = (active: boolean) =>
  `h-full flex items-center text-sm font-semibold border-b-2 transition-colors ${
    active ? 'text-[#F97316] border-[#F97316]' : 'text-gray-500 border-transparent hover:text-[#111827]'
  }`;

/** "Report" needs a Lost/Found choice, same as the mobile FAB — not a plain link. */
function ReportNavItem({ active }: { active: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative h-full">
      <button type="button" onClick={() => setOpen((v) => !v)} className={`${navLinkClass(active)} gap-1`}>
        Report
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-2xl border border-gray-100 shadow-lg py-2 z-50 animate-scale-in">
            <Link
              href="/items/new?type=lost"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-[#111827] hover:bg-gray-50"
            >
              <span className="w-2 h-2 rounded-full bg-red-500" />
              I Lost Something
            </Link>
            <Link
              href="/items/new?type=found"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-[#111827] hover:bg-gray-50"
            >
              <span className="w-2 h-2 rounded-full bg-green-500" />
              I Found Something
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

/** Desktop-only horizontal nav — the mobile shell uses TopBar + BottomNav instead. */
export function TopNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { data: unread } = useSWR('unread-count', getUnreadCount, { refreshInterval: 30000 });
  const { count: matchCount } = useMatchCount();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const links = user?.role === 'ADMIN' ? [...NAV_LINKS, { href: '/admin', label: 'Admin' }] : NAV_LINKS;

  return (
    <header className="hidden md:block sticky top-0 z-30 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 flex items-center gap-8 h-16">
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-[#F97316] flex items-center justify-center">
            <Search size={15} className="text-white" />
          </div>
          <span className="font-extrabold text-lg text-[#111827]">ReFound</span>
        </Link>

        <nav className="flex items-center gap-7 flex-1 h-full">
          <Link href="/dashboard" className={navLinkClass(isActive('/dashboard'))}>Browse</Link>
          <ReportNavItem active={pathname.startsWith('/items/new')} />
          {links.slice(1).map(({ href, label }) => (
            <Link key={href} href={href} className={`${navLinkClass(isActive(href))} gap-1.5`}>
              {label}
              {href === '/matches' && matchCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#F97316] text-white text-[10px] font-bold flex items-center justify-center">
                  {matchCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5 shrink-0">
          <Link href="/notifications" className="relative text-gray-500 hover:text-[#111827] transition-colors">
            <Bell size={19} />
            {(unread ?? 0) > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full bg-[#F97316] text-white text-[9px] font-bold flex items-center justify-center">
                {unread}
              </span>
            )}
          </Link>
          {user && (
            <Link href="/profile" className="flex items-center gap-2.5">
              <div className="text-right leading-tight">
                <p className="text-sm font-bold text-[#111827]">{getFirstName(user.fullName)} 👋</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#F97316] flex items-center justify-center text-white font-bold text-xs shrink-0">
                {getInitials(user.fullName)}
              </div>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
