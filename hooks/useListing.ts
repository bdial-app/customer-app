import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  CreateListingPayload,
  UpdateListingPayload,
  ListingData,
} from "@/services/listing.service";

export const MY_LISTINGS_KEY = ["my-listings"];

export const useMyListings = () => {
  return useQuery<ListingData[]>({
    queryKey: MY_LISTINGS_KEY,
    queryFn: getMyListings,
    staleTime: 1000 * 60 * 5,
  });
};

export const useListingById = (id: string) => {
  return useQuery<ListingData>({
    queryKey: ["listing", id],
    queryFn: () => getListingById(id),
    enabled: !!id,
  });
};

export const useCreateListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateListingPayload) => createListing(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_LISTINGS_KEY });
    },
  });
};

export const useUpdateListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateListingPayload }) =>
      updateListing(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_LISTINGS_KEY });
    },
  });
};

export const useDeleteListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_LISTINGS_KEY });
    },
  });
};
