import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Shared paged-list caching strategy for directory-style pages.
 * - staleTime 5 min: directory data changes rarely, so back-navigation is instant.
 * - gcTime 30 min: recently visited pages stay in cache.
 * - keepPreviousData: page turns reuse the old rows (dimmed), no flash.
 * - Adjacent pages are prefetched, so Prev/Next feel instant.
 * - `invalidate()` wipes every page/limit combo under the key after mutations.
 */

export const LIST_STALE = 5 * 60 * 1000;
export const LIST_GC = 30 * 60 * 1000;

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
}

interface FetchResult<T> {
  data: T;
  meta?: unknown;
  message?: string;
}

export function usePagedList<T>(
  key: Array<string | number>,
  fetchPage: (page: number, limit: number) => Promise<FetchResult<T[]>>,
  opts?: { initialLimit?: number; staleTime?: number; gcTime?: number },
) {
  const [page, setPage] = useState(1);
  const [limit, setLimitState] = useState(opts?.initialLimit ?? 10);
  const qc = useQueryClient();
  const keyJson = JSON.stringify(key);
  const staleTime = opts?.staleTime ?? LIST_STALE;
  const gcTime = opts?.gcTime ?? LIST_GC;

  const query = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [...(JSON.parse(keyJson) as Array<string | number>), page, limit],
    queryFn: () => fetchPage(page, limit),
    staleTime,
    gcTime,
    placeholderData: keepPreviousData,
  });

  const total = (query.data?.meta as PageMeta | undefined)?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, pageCount);

  useEffect(() => {
    const k = JSON.parse(keyJson) as Array<string | number>;
    if (safePage < pageCount) {
      void qc.prefetchQuery({
        queryKey: [...k, safePage + 1, limit],
        queryFn: () => fetchPage(safePage + 1, limit),
        staleTime,
      });
    }
    if (safePage > 1) {
      void qc.prefetchQuery({
        queryKey: [...k, safePage - 1, limit],
        queryFn: () => fetchPage(safePage - 1, limit),
        staleTime,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc, keyJson, safePage, pageCount, limit, staleTime]);

  return {
    rows: query.data?.data ?? [],
    total,
    page: safePage,
    pageCount,
    setPage,
    limit,
    /** Changing page size always returns to page 1 (old offsets are meaningless). */
    setLimit: (next: number) => {
      setLimitState(next);
      setPage(1);
    },
    /** Call when filters change — stale page numbers would show empty lists. */
    resetPage: () => setPage(1),
    isPending: query.isPending,
    isError: query.isError,
    isFetching: query.isFetching,
    refetch: query.refetch,
    invalidate: () => qc.invalidateQueries({ queryKey: JSON.parse(keyJson) as Array<string | number> }),
  };
}
