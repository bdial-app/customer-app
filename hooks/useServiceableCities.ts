import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getServiceableCities,
  checkServiceability,
  requestCity,
} from "@/services/serviceable-cities.service";

export const useServiceableCities = () => {
  return useQuery({
    queryKey: ["serviceable-cities"],
    queryFn: getServiceableCities,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};

export const useCheckServiceability = (
  city: string | null,
  lat?: number,
  lng?: number,
) => {
  return useQuery({
    queryKey: ["check-serviceability", city, lat, lng],
    queryFn: () =>
      checkServiceability({
        city: city || undefined,
        lat,
        lng,
      }),
    enabled: !!(city || (lat && lng)),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useRequestCity = () => {
  return useMutation({
    mutationFn: ({ city, deviceId }: { city: string; deviceId?: string }) =>
      requestCity(city, deviceId),
  });
};
