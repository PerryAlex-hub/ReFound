'use client';

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { ONBOARDED_KEY } from '@/app/onboarding/page';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  // First-time visitors get the onboarding walkthrough once, before login/register;
  // onboarding itself sets the flag on both "Skip" and "Get Started".
  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDED_KEY)) {
        router.replace('/onboarding');
      }
    } catch {
      // localStorage unavailable (e.g. private browsing) — not worth blocking auth over.
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col">
      <div className="flex items-center justify-center gap-2 py-5">
        <div className="w-8 h-8 rounded-xl bg-[#F97316] flex items-center justify-center">
          <Search size={15} className="text-white" />
        </div>
        <Link href="/" className="font-extrabold text-lg text-[#111827]">ReFound</Link>
      </div>
      <div className="flex-1 flex items-start justify-center px-4 pt-4 pb-12">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-gray-100 p-7">
          {children}
        </div>
      </div>
    </div>
  );
}
