import { useQuery } from "@tanstack/react-query";
import {
  reverseGeocode,
  ReverseGeocodePayload,
  searchGeocode,
} from "@/services/geocode.service";

export const useReverseGeocode = (payload: ReverseGeocodePayload | null) => {
  return useQuery({
    queryKey: ["reverse-geocode", payload?.lat, payload?.lng],
    queryFn: () => reverseGeocode(payload!),
    enabled: !!payload && !!payload.lat && !!payload.lng,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export const useSearchGeocode = (query: string) => {
  return useQuery({
    queryKey: ["search-geocode", query],
    queryFn: () => searchGeocode(query),
    enabled: query.length >= 3,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
