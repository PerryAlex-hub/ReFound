'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Archive, User, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [fabOpen, setFabOpen] = useState(false);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const handleFabChoice = (type: 'lost' | 'found') => {
    setFabOpen(false);
    router.push(`/items/new?type=${type}`);
  };

  return (
    <>
      {fabOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setFabOpen(false)} />
      )}

      {fabOpen && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 items-center animate-scale-in">
          <button
            onClick={() => handleFabChoice('found')}
            className="flex items-center gap-3 bg-white rounded-2xl px-6 py-3.5 shadow-lg font-semibold text-[#111827] text-sm border border-gray-100 w-56 justify-center"
          >
            <span className="w-2 h-2 rounded-full bg-green-500" />
            I Found Something
          </button>
          <button
            onClick={() => handleFabChoice('lost')}
            className="flex items-center gap-3 bg-white rounded-2xl px-6 py-3.5 shadow-lg font-semibold text-[#111827] text-sm border border-gray-100 w-56 justify-center"
          >
            <span className="w-2 h-2 rounded-full bg-red-500" />
            I Lost Something
          </button>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 md:hidden safe-area-bottom">
        <div className="flex items-center justify-around px-2 pt-2 pb-4 max-w-lg mx-auto">
          <Link href="/dashboard" className={`flex flex-col items-center gap-1 px-4 py-1 ${isActive('/dashboard') ? 'text-[#F97316]' : 'text-gray-400'}`}>
            <Home size={22} />
            <span className="text-[10px] font-semibold">Home</span>
          </Link>

          <Link href="/my-items" className={`flex flex-col items-center gap-1 px-4 py-1 ${isActive('/my-items') ? 'text-[#F97316]' : 'text-gray-400'}`}>
            <Archive size={22} />
            <span className="text-[10px] font-semibold">My Items</span>
          </Link>

          <button
            onClick={() => setFabOpen((v) => !v)}
            className="relative -top-5 w-14 h-14 rounded-full bg-[#F97316] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            aria-label="Report item"
          >
            {fabOpen ? <X size={24} /> : <Plus size={24} />}
          </button>

          <Link href="/claims" className={`flex flex-col items-center gap-1 px-4 py-1 ${isActive('/claims') ? 'text-[#F97316]' : 'text-gray-400'}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span className="text-[10px] font-semibold">Claims</span>
          </Link>

          <Link href="/profile" className={`flex flex-col items-center gap-1 px-4 py-1 ${isActive('/profile') ? 'text-[#F97316]' : 'text-gray-400'}`}>
            <User size={22} />
            <span className="text-[10px] font-semibold">Profile</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
