'use client';

import { Suspense, useEffect, ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AppShell } from '@/components/layout/AppShell';
import { SplashScreen } from '@/components/layout/SplashScreen';

// useSearchParams() requires a Suspense boundary once it's used above a route
// (like /claims/new) that reads the `searchParams` page prop directly — see
// https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
function AuthGate({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && !user) {
      const qs = searchParams.toString();
      const next = qs ? `${pathname}?${qs}` : pathname;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [isLoading, user, router, pathname, searchParams]);

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!user) return null;

  return <AppShell>{children}</AppShell>;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<SplashScreen />}>
      <AuthGate>{children}</AuthGate>
    </Suspense>
  );
}
