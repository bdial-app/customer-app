import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  getTopLevelCategories,
  getAllCategories,
  searchCategoriesAPI,
  getSubCategories,
} from "@/services/category.service";
import { getCategoryProviders } from "@/services/home.service";
import { useAppSelector } from "@/hooks/useAppStore";

export const useTopLevelCategories = () => {
  return useQuery({
    queryKey: ["top-level-categories"],
    queryFn: getTopLevelCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes — categories rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    placeholderData: (prev: any) => prev, // Show cached data instantly
  });
};

export const useAllCategories = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ["all-categories", page, limit],
    queryFn: () => getAllCategories(page, limit),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
  });
};

export const useCategorySearch = (query: string) => {
  return useQuery({
    queryKey: ["category-search", query],
    queryFn: () => searchCategoriesAPI(query, 12),
    enabled: query.trim().length >= 2,
    staleTime: 2 * 60 * 1000, // matches backend 2-min cache
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData, // no flash between queries
    refetchOnWindowFocus: false,
  });
};

export const useSubCategories = (parentId: string | null) => {
  return useQuery({
    queryKey: ["sub-categories", parentId],
    queryFn: () => getSubCategories(parentId!),
    enabled: !!parentId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCategoryProviders = (slug: string | null, limit = 8) => {
  const user = useAppSelector((state) => state.auth.user);
  const guestCoords = useAppSelector((state) => state.location.guestCoords);
  const selectedCity = useAppSelector((state) => state.location.selectedCity);

  const lat = user?.latitude ?? guestCoords?.lat ?? undefined;
  const lng = user?.longitude ?? guestCoords?.lng ?? undefined;
  const city = selectedCity ?? user?.city ?? undefined;

  return useQuery({
    queryKey: ["category-providers", slug, limit, lat, lng, city],
    queryFn: () => getCategoryProviders({ slug: slug!, limit, lat, lng, city }),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
