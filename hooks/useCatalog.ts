import { useCallback, useMemo } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  browseCatalog,
  getCatalogShelves,
  getSimilarItems,
  type CatalogBrowseParams,
  type CatalogLocation,
  type CatalogType,
} from "@/services/catalog.service";
import { useAppSelector } from "./useAppStore";
import { useSavedItemIds, useToggleSaved } from "./useSavedItems";
import { useAuthGate } from "./useAuthGate";
import { triggerHaptic } from "@/utils/haptics";

/**
 * Where the customer is, for ranking and distance labels: the signed-in
 * user's saved location, else a guest's device location and picked city.
 */
export const useCatalogLocation = (): CatalogLocation => {
  const user = useAppSelector((state) => state.auth.user);
  const guestCoords = useAppSelector((state) => state.location.guestCoords);
  const selectedCity = useAppSelector((state) => state.location.selectedCity);

  const lat = user?.latitude ?? guestCoords?.lat ?? undefined;
  const lng = user?.longitude ?? guestCoords?.lng ?? undefined;
  const city = selectedCity ?? user?.city ?? undefined;

  return useMemo(() => ({ lat, lng, city }), [lat, lng, city]);
};

export const useCatalogShelves = (type: CatalogType) => {
  const location = useCatalogLocation();
  const userId = useAppSelector((state) => state.auth.user?.id);

  return useQuery({
    // userId in the key: "Picked for you" differs per signed-in user.
    queryKey: ["catalog-shelves", type, location.lat, location.lng, location.city, userId ?? null],
    queryFn: () => getCatalogShelves({ type, ...location }),
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => (prev?.type === type ? prev : undefined),
  });
};

export const useCatalogBrowse = (params: Omit<CatalogBrowseParams, "page" | "lat" | "lng" | "city">) => {
  const location = useCatalogLocation();
  const full = { ...params, ...location };

  return useInfiniteQuery({
    queryKey: ["catalog-browse", full],
    queryFn: ({ pageParam }) => browseCatalog({ ...full, page: pageParam, limit: params.limit ?? 20 }),
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * A short, single-page list for home-page sections ("around you", trending).
 * Nearest-first when we know where the customer is, else best-first in their city.
 */
export const useCatalogList = (
  type: CatalogType,
  mode: "around" | "popular",
  limit: number,
) => {
  const location = useCatalogLocation();
  const hasLocation = location.lat != null && location.lng != null;
  const area = hasLocation || location.city ? "city" : "all";
  const sort = mode === "popular" ? "popular" : hasLocation ? "nearest" : "recommended";

  const query = useQuery({
    queryKey: ["home-catalog", type, mode, limit, location.lat, location.lng, location.city],
    queryFn: () => browseCatalog({ type, sort, area, limit, page: 1, ...location }),
    staleTime: 3 * 60 * 1000,
    refetchOnWindowFocus: false,
    // An older API without the catalog routes answers 404 — just hide the section.
    retry: false,
  });

  return { ...query, items: query.data?.data ?? [], total: query.data?.total ?? 0, hasLocation, area, sort };
};

export const useSimilarItems = (productId: string) => {
  const location = useCatalogLocation();
  return useQuery({
    queryKey: ["similar-items", productId, location.lat, location.lng],
    queryFn: () => getSimilarItems(productId, { ...location, limit: 12 }),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
    // An older API without this route answers 404 — hide the section, don't retry.
    retry: false,
  });
};

/** Saved state + a heart toggle for product cards (asks guests to sign in first). */
export const useSavedProducts = () => {
  const { requireAuth } = useAuthGate();
  const { data: savedIds = [] } = useSavedItemIds();
  const toggleSaved = useToggleSaved();

  const savedSet = useMemo(
    () =>
      new Set(
        (Array.isArray(savedIds) ? savedIds : [])
          .filter((s) => s.itemType === "product")
          .map((s) => s.itemId),
      ),
    [savedIds],
  );

  const toggle = useCallback(
    (id: string) =>
      requireAuth(() => {
        triggerHaptic(savedSet.has(id) ? "light" : "medium");
        toggleSaved.mutate({ itemId: id, itemType: "product" });
      }),
    [requireAuth, savedSet, toggleSaved],
  );

  const isSaved = useCallback((id: string) => savedSet.has(id), [savedSet]);

  return { isSaved, toggle };
};
