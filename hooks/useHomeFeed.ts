import { useQuery } from "@tanstack/react-query";
import {
  getHomeFeed,
  getLiveActivity,
  getCategoryProviders,
} from "@/services/home.service";
import { isNetworkError } from "@/utils/axios";

export const HOME_FEED_QUERY_KEY = "home-feed";

export const useHomeFeed = (params?: {
  lat?: number;
  lng?: number;
  city?: string;
}) => {
  return useQuery({
    queryKey: [HOME_FEED_QUERY_KEY, params?.lat, params?.lng, params?.city],
    queryFn: () => getHomeFeed(params),
    staleTime: 5 * 60 * 1000, // 5 minutes — prevents refetch on tab switch
    gcTime: 10 * 60 * 1000, // 10 minutes — keeps data in cache longer
    refetchOnWindowFocus: false,
    refetchOnMount: "always", // Always refetch on mount to avoid stale/corrupt cache
    placeholderData: (prev: any) => prev, // Show stale data instantly while revalidating
    retry: (failureCount, error) => {
      // Retry up to 2 times on network/timeout errors (common on mobile data)
      if (isNetworkError(error)) return failureCount < 2;
      return false;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });
};

export const useLiveActivity = (params?: {
  lat?: number;
  lng?: number;
  city?: string;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: ["live-activity", params?.lat, params?.lng, params?.city],
    queryFn: () => getLiveActivity(params),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: params?.enabled !== false ? 60 * 1000 : false, // Pause polling when tab hidden
    enabled: params?.enabled !== false,
  });
};

export const useCategoryProviders = (params: {
  slug: string;
  lat?: number;
  lng?: number;
  city?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["category-providers", params.slug, params.lat, params.lng],
    queryFn: () => getCategoryProviders(params),
    enabled: !!params.slug,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
  });
};
