"use client";
import { useQuery } from "@tanstack/react-query";
import { getHomeCollection, getHomeCollections } from "@/services/home.service";
import { useCatalogLocation } from "@/hooks/useCatalog";

/** The home screen's "needs" (admin-managed), with real photos from nearby listings. */
export const useHomeCollections = () => {
  const location = useCatalogLocation();
  return useQuery({
    queryKey: ["home-collections", location.lat, location.lng, location.city],
    queryFn: () => getHomeCollections(location),
    staleTime: 3 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
};

export const useHomeCollection = (id: string | null) => {
  const location = useCatalogLocation();
  return useQuery({
    queryKey: ["home-collection", id, location.lat, location.lng, location.city],
    queryFn: () => getHomeCollection(id as string, location),
    enabled: !!id,
    staleTime: 3 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
