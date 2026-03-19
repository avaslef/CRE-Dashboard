"use client";

import { useState, useCallback } from "react";

/**
 * Generic hook to manage async data fetching with loading, error, and refresh.
 */
export function useDataRefresh<T>(
  fetcher: () => Promise<T>,
  initialData: T
) {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
      setLastFetched(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [fetcher]);

  return { data, isLoading, error, lastFetched, refresh: fetch };
}
