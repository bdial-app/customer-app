import { QueryClient } from "@tanstack/react-query";
import { HOME_FEED_QUERY_KEY } from "@/hooks/useHomeFeed";
import { getItem, setItem, removeItem } from "@/utils/storage";

const CACHE_KEY = "tijarah-query-cache";
const CACHE_VERSION = 1;
// The saved feed is shown straight away on open and refreshed in the
// background (useHomeFeed refetches on mount), so an older copy is still far
// better than a loading screen. Past a day it's too stale to show.
const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  version: number;
  timestamp: number;
  data: Record<string, unknown>;
}

/**
 * Persists critical query data (home feed) to platform storage for instant load.
 * Uses @capacitor/preferences on native, localStorage on web.
 * Only persists specific queries to keep storage small and fast.
 */
const PERSIST_QUERIES = [HOME_FEED_QUERY_KEY, "top-level-categories", "conversations"];

export function persistQueryCache(queryClient: QueryClient) {
  const cache: Record<string, unknown> = {};
  const queryCache = queryClient.getQueryCache();

  for (const query of queryCache.getAll()) {
    const key = query.queryKey[0];
    if (typeof key === "string" && PERSIST_QUERIES.includes(key) && query.state.data) {
      cache[JSON.stringify(query.queryKey)] = {
        data: query.state.data,
        dataUpdatedAt: query.state.dataUpdatedAt,
      };
    }
  }

  try {
    const entry: CacheEntry = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      data: cache,
    };
    setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export async function restoreQueryCache(queryClient: QueryClient) {
  try {
    const raw = await getItem(CACHE_KEY);
    if (!raw) return;

    const entry: CacheEntry = JSON.parse(raw);

    // Version mismatch or expired
    if (entry.version !== CACHE_VERSION || Date.now() - entry.timestamp > MAX_AGE) {
      removeItem(CACHE_KEY);
      return;
    }

    for (const [keyStr, value] of Object.entries(entry.data)) {
      const queryKey = JSON.parse(keyStr);
      const { data, dataUpdatedAt } = value as { data: unknown; dataUpdatedAt: number };
      queryClient.setQueryData(queryKey, data, { updatedAt: dataUpdatedAt });
    }
  } catch {
    // Corrupted cache — remove and continue
    removeItem(CACHE_KEY);
  }
}
