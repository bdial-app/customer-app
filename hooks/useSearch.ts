import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  searchAll,
  getSuggestions,
  getTrendingSearches,
  getRecentSearches,
  clearRecentSearches,
  SearchParams,
  SuggestionParams,
  SearchEntityType,
} from "@/services/search.service";
import { useAppSelector } from "./useAppStore";

// ─── Unified search with infinite scroll ────────────────────

export const useSearchResults = (
  params: Omit<SearchParams, "page"> & { enabled?: boolean }
) => {
  const { enabled = true, ...searchParams } = params;
  return useInfiniteQuery({
    queryKey: ["search-results", searchParams],
    queryFn: ({ pageParam = 1 }) =>
      searchAll({ ...searchParams, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // For paginated type-specific queries
      const activeType = searchParams.type || "all";
      if (activeType === "all") return undefined; // "All" tab shows limited results, no pagination
      const section =
        activeType === "providers"
          ? lastPage.providers
          : activeType === "products"
            ? lastPage.products
            : lastPage.categories;
      const totalPages = Math.ceil(section.total / (searchParams.limit || 10));
      return lastPageParam < totalPages ? lastPageParam + 1 : undefined;
    },
    enabled: enabled && !!searchParams.q && searchParams.q.length >= 1,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
};

// ─── Autocomplete suggestions ───────────────────────────────

export const useSearchSuggestions = (
  query: string,
  lat?: number,
  lng?: number
) => {
  // NOTE: query is already debounced by the parent (search-page-content.tsx)
  return useQuery({
    queryKey: ["search-suggestions", query, lat, lng],
    queryFn: () =>
      getSuggestions({ q: query, lat, lng }),
    enabled: query.length >= 1,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
};

// ─── Trending searches ──────────────────────────────────────

export const useTrendingSearches = (city?: string) => {
  return useQuery({
    queryKey: ["trending-searches", city],
    queryFn: () => getTrendingSearches(city, 10),
    staleTime: 15 * 60_000, // 15 min
  });
};

// ─── Recent searches ────────────────────────────────────────

export const useRecentSearches = () => {
  const user = useAppSelector((state) => state.auth.user);
  return useQuery({
    queryKey: ["recent-searches"],
    queryFn: () => getRecentSearches(10),
    staleTime: 60_000,
    enabled: !!user,
  });
};

// ─── Clear recent searches ─────────────────────────────────

export const useClearRecentSearches = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clearRecentSearches,
    onSuccess: () => {
      qc.setQueryData(["recent-searches"], []);
    },
  });
};
