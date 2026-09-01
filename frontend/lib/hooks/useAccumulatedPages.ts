'use client';

import useSWRInfinite from 'swr/infinite';
import { PageResponse } from '@/lib/types';

/**
 * Backs a "Load More" list (mobile card lists) as opposed to numbered
 * pagination (desktop tables, which fetch and show one page at a time via a
 * plain useSWR call). Each click grows the accumulated list instead of
 * replacing it.
 *
 * `keyPrefix` should change whenever the active filters change (it becomes
 * part of the SWR cache key) — call `reset()` alongside that so the page
 * count doesn't carry over and over-fetch for the new filters.
 */
export function useAccumulatedPages<T>(
  keyPrefix: readonly unknown[] | null,
  fetchPage: (pageIndex: number) => Promise<PageResponse<T>>,
) {
  const { data, size, setSize, isLoading } = useSWRInfinite<PageResponse<T>>(
    (pageIndex, previousPageData: PageResponse<T> | null) => {
      if (keyPrefix === null) return null;
      if (previousPageData && previousPageData.last) return null;
      return [...keyPrefix, pageIndex];
    },
    (key) => fetchPage((key as unknown[])[key.length - 1] as number),
    { revalidateOnFocus: false, revalidateFirstPage: false }
  );

  const items = data?.flatMap((p) => p.content) ?? [];
  const isLoadingInitial = isLoading && !data;
  const isLoadingMore = !!data && typeof data[size - 1] === 'undefined';
  const hasMore = !!data && data.length > 0 && !data[data.length - 1].last;

  return {
    items,
    isLoadingInitial,
    isLoadingMore,
    hasMore,
    loadMore: () => setSize((s) => s + 1),
    reset: () => setSize(1),
  };
}
