import { useQuery, useMutation } from "@tanstack/react-query";
import { getExploreFeed, trackAdEvent, TrackAdEventPayload } from "@/services/explore.service";

export const useExploreFeed = (params?: {
  lat?: number;
  lng?: number;
  city?: string;
}) => {
  return useQuery({
    queryKey: ["explore-feed", params?.lat, params?.lng, params?.city],
    queryFn: () => getExploreFeed(params),
    staleTime: 5 * 60 * 1000, // 5 minutes — prevents refetch on tab switch
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (prev: any) => prev,
  });
};

export const useTrackAd = () => {
  return useMutation({
    mutationFn: (payload: TrackAdEventPayload) => trackAdEvent(payload),
    // Fire-and-forget: no success/error handling needed
    retry: 1,
  });
};
