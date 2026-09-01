'use client';

import { Suspense, useEffect, ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { SplashScreen } from '@/components/layout/SplashScreen';
import { AppShell } from '@/components/layout/AppShell';

// See app/(app)/layout.tsx — useSearchParams() needs a Suspense boundary here too.
function AdminAuthGate({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        const qs = searchParams.toString();
        const next = qs ? `${pathname}?${qs}` : pathname;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
      } else if (user.role !== 'ADMIN') {
        router.replace('/dashboard');
      }
    }
  }, [isLoading, user, router, pathname, searchParams]);

  if (isLoading) return <SplashScreen />;

  if (!user || user.role !== 'ADMIN') return null;

  return <AppShell>{children}</AppShell>;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<SplashScreen />}>
      <AdminAuthGate>{children}</AdminAuthGate>
    </Suspense>
  );
}
