'use client';

import useSWR from 'swr';
import { getMyMatches } from '@/lib/api/matches';

/**
 * How many open match suggestions the current user has.
 *
 * There is no count-only endpoint — GET /matches/mine returns the full list —
 * so the list itself is fetched and cached under one shared SWR key. Every
 * caller (nav badge, dashboard banner) reuses the same request rather than
 * issuing its own.
 *
 * Refreshed on the same 30s cadence as the notification badge: matching runs
 * the instant someone files a report, so a suggestion can appear while the user
 * is sitting on the page.
 */
export function useMatchCount() {
  // Same SWR key the /matches page uses, deliberately: one shared request, and
  // dismissing a suggestion there updates this badge without extra plumbing.
  const { data, isLoading } = useSWR('matches', getMyMatches, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });

  return { count: data?.length ?? 0, isLoading };
}
