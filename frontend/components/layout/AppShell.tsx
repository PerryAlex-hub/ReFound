'use client';

import { ReactNode } from 'react';
import { TopNav } from './TopNav';
import { Footer } from './Footer';
import { BottomNav } from './BottomNav';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col">
      <TopNav />
      <main className="flex-1 w-full max-w-2xl md:max-w-7xl mx-auto md:px-6 pb-24 md:pb-16">
        {children}
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
      <BottomNav />
    </div>
  );
}
