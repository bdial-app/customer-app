import { useQuery } from "@tanstack/react-query";
import {
  getHomeFeed,
  getLiveActivity,
  getCategoryProviders,
} from "@/services/home.service";

export const useHomeFeed = (params?: {
  lat?: number;
  lng?: number;
  city?: string;
}) => {
  return useQuery({
    queryKey: ["home-feed", params?.lat, params?.lng, params?.city],
    queryFn: () => getHomeFeed(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
};

export const useLiveActivity = (params?: {
  lat?: number;
  lng?: number;
  city?: string;
}) => {
  return useQuery({
    queryKey: ["live-activity", params?.lat, params?.lng, params?.city],
    queryFn: () => getLiveActivity(params),
    staleTime: 30 * 1000, // 30 seconds — refreshes more often for social proof
    refetchInterval: 60 * 1000, // auto-refetch every minute
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
    staleTime: 2 * 60 * 1000,
  });
};
