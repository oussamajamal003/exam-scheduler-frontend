import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchGlobalSearch } from "@/api/search.api";

/**
 * Debounced global search hook for the admin command palette.
 *
 * - Only triggers a network request when the trimmed query is >= 2 chars.
 * - Debounces user input by `delay` ms (default 220ms).
 * - Uses TanStack Query so results are cached + deduped across the app.
 */
export const useGlobalSearch = (query: string, delay = 220) => {
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(query), delay);
    return () => window.clearTimeout(handle);
  }, [query, delay]);

  const enabled = debounced.trim().length >= 2;

  const result = useQuery({
    queryKey: ["global-search", debounced.trim()],
    queryFn: ({ signal }) => fetchGlobalSearch(debounced.trim(), 6, signal),
    enabled,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  return {
    ...result,
    debouncedQuery: debounced,
    isDebouncing: debounced !== query,
    enabled,
  };
};
