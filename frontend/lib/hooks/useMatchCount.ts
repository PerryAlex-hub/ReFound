'use client';

import useSWR from 'swr';
import { getMyMatches } from '@/lib/api/matches';


export function useMatchCount() {
  const { data, isLoading } = useSWR('matches', getMyMatches, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });

  return { count: data?.length ?? 0, isLoading };
}
