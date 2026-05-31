/**
 * usePersistentFilters
 *
 * Persists UI filter state across React Router navigations using two layers:
 *   1. URL query params  – survives back/forward navigation and is shareable
 *   2. sessionStorage    – survives sidebar-link navigation within the same tab
 *
 * Priority on page mount:  URL params → sessionStorage → defaults
 * On every change:          React state → URL params (replace) → sessionStorage
 *
 * State is intentionally cleared on:
 *   - Browser refresh (F5 / reload) — detected via boot-token
 *   - Logout — call clearAllPersistentFilters()
 *
 * sessionStorage key format:  `exam-ui-search-state:<pageKey>`
 * Storage format (spec-compliant):
 *   { searchQuery: string, selectedSemester: string | null, filters: Record<string, string> }
 *
 * Usage:
 *   const { filters, setFilter, setFilters, resetFilters } = usePersistentFilters('courses', {
 *     search: '',
 *     departmentId: '',
 *   });
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FilterRecord = Record<string, string>;

export interface StoredFilterState {
  searchQuery: string;
  selectedSemester: string | null;
  filters: Record<string, string>;
}

export interface UsePersistentFiltersReturn<T extends FilterRecord> {
  /** Current filter values */
  filters: T;
  /** Update a single filter key */
  setFilter: (key: keyof T & string, value: string) => void;
  /** Update multiple filter keys at once */
  setFilters: (updates: Partial<T>) => void;
  /** Reset all filters to their defaults */
  resetFilters: () => void;
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY_PREFIX = "exam-ui-search-state";
const BOOT_TOKEN_KEY = "exam-ui-boot-token";

/**
 * A unique token generated once per JS module load.
 * Because JS modules are re-evaluated on every page refresh (hard reload),
 * this value will differ from whatever is stored in sessionStorage after a
 * refresh — letting us detect a fresh page load vs. SPA navigation.
 */
const CURRENT_BOOT_TOKEN = Math.random().toString(36).slice(2);

/**
 * Clear all persisted filter state from sessionStorage.
 * Called automatically on page refresh (boot-token mismatch) and should
 * also be called explicitly on logout.
 */
export function clearAllPersistentFilters(): void {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(STORAGE_KEY_PREFIX)) toRemove.push(key);
    }
    toRemove.forEach((key) => sessionStorage.removeItem(key));
    // Update boot token so the current session is not cleared again
    sessionStorage.setItem(BOOT_TOKEN_KEY, CURRENT_BOOT_TOKEN);
  } catch {
    // Ignore storage errors (e.g. private mode)
  }
}

// Run once at module load time: if the stored boot token doesn't match the
// current one, the page was refreshed — wipe all filter state.
// `pendingRefreshClear` is consumed by the first usePersistentFilters instance
// that mounts after a refresh, so it strips URL params for that page too.
let pendingRefreshClear = false;

(function detectRefresh() {
  try {
    const stored = sessionStorage.getItem(BOOT_TOKEN_KEY);
    if (stored !== CURRENT_BOOT_TOKEN) {
      pendingRefreshClear = true;
      clearAllPersistentFilters();
    }
  } catch {
    // Ignore storage errors
  }
})();

function storageKey(pageKey: string): string {
  return `${STORAGE_KEY_PREFIX}:${pageKey}`;
}

function readFromStorage(pageKey: string): StoredFilterState | null {
  try {
    const raw = sessionStorage.getItem(storageKey(pageKey));
    if (!raw) return null;
    return JSON.parse(raw) as StoredFilterState;
  } catch {
    return null;
  }
}

function writeToStorage(pageKey: string, filters: FilterRecord): void {
  try {
    const { search, semesterId, ...rest } = filters;
    const stored: StoredFilterState = {
      searchQuery: search ?? "",
      selectedSemester: semesterId ?? null,
      filters: rest,
    };
    sessionStorage.setItem(storageKey(pageKey), JSON.stringify(stored));
  } catch {
    // Ignore storage errors (e.g. private mode quota)
  }
}

function storedToFilters(stored: StoredFilterState): FilterRecord {
  const result: FilterRecord = { ...stored.filters };
  if (stored.searchQuery) result.search = stored.searchQuery;
  if (stored.selectedSemester) result.semesterId = stored.selectedSemester;
  return result;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePersistentFilters<T extends FilterRecord>(
  pageKey: string,
  defaults: T,
): UsePersistentFiltersReturn<T> {
  const [searchParams, setSearchParams] = useSearchParams();

  // -------------------------------------------------------------------------
  // Derive current filters: URL params are the source of truth.
  // If the URL has NO params for any default key, we try to hydrate from
  // sessionStorage on first render (see the hydration effect below).
  // -------------------------------------------------------------------------
  const filters = useMemo<T>(() => {
    const result = { ...defaults };
    for (const key of Object.keys(defaults) as (keyof T & string)[]) {
      const urlVal = searchParams.get(key);
      if (urlVal !== null) {
        (result as FilterRecord)[key] = urlVal;
      }
    }
    return result;
    // Intentionally only track searchParams (not defaults which is stable)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // -------------------------------------------------------------------------
  // Hydration: on mount, if URL has no filter params, restore from storage.
  // We only do this once (the ref guard prevents re-running after we set
  // params ourselves).
  // -------------------------------------------------------------------------
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    // On page refresh, pendingRefreshClear is true. sessionStorage has already
    // been wiped by the IIFE, but URL params still carry old filter values.
    // Strip them so the page starts clean.
    if (pendingRefreshClear) {
      pendingRefreshClear = false; // consume — only the first mounted page needs to clear its own URL
      const hasAny = Object.keys(defaults).some((k) => searchParams.has(k));
      if (hasAny) {
        const next = new URLSearchParams(searchParams);
        for (const key of Object.keys(defaults)) next.delete(key);
        setSearchParams(next, { replace: true });
      }
      return;
    }

    // Check if the URL already carries any of our keys
    const urlHasAny = Object.keys(defaults).some((k) => searchParams.has(k));
    if (urlHasAny) {
      // URL params are already present — write them to storage so that future
      // sidebar navigation can restore them.
      const currentFilters: FilterRecord = {};
      for (const key of Object.keys(defaults)) {
        const v = searchParams.get(key);
        if (v !== null) currentFilters[key] = v;
      }
      writeToStorage(pageKey, currentFilters);
      return;
    }

    // Try sessionStorage
    const stored = readFromStorage(pageKey);
    if (!stored) return;

    const storedFilters = storedToFilters(stored);
    const next = new URLSearchParams(searchParams);
    let changed = false;

    for (const key of Object.keys(defaults)) {
      const storedVal = storedFilters[key];
      if (storedVal && storedVal !== defaults[key]) {
        next.set(key, storedVal);
        changed = true;
      }
    }

    if (changed) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Sync to sessionStorage whenever URL params change
  // -------------------------------------------------------------------------
  useEffect(() => {
    const currentFilters: FilterRecord = {};
    for (const key of Object.keys(defaults)) {
      const v = searchParams.get(key);
      if (v !== null) currentFilters[key] = v;
    }
    writeToStorage(pageKey, currentFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // -------------------------------------------------------------------------
  // setFilter / setFilters / resetFilters
  // -------------------------------------------------------------------------
  const setFilter = useCallback(
    (key: keyof T & string, value: string) => {
      const next = new URLSearchParams(searchParams);
      if (value) next.set(key, value);
      else next.delete(key);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setFilters = useCallback(
    (updates: Partial<T>) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value as string);
        else next.delete(key);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const resetFilters = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    for (const key of Object.keys(defaults)) {
      next.delete(key);
    }
    setSearchParams(next, { replace: true });
    try {
      sessionStorage.removeItem(storageKey(pageKey));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setSearchParams]);

  return { filters, setFilter, setFilters, resetFilters };
}
