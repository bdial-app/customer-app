import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyProviderStatus,
  updateProvider,
  getMyAnalytics,
  replyToReview,
  getMyOffers,
  getOfferLimits,
  createOffer,
  updateOffer,
  deleteOffer,
  getSponsorshipPlans,
  getMySponsorships,
  createSponsorship,
  updateSponsorship,
  ProviderStatusResponse,
  ProviderAnalytics,
  UpdateProviderPayload,
  ProviderOfferFull,
  CreateOfferPayload,
  UpdateOfferPayload,
  OfferLimits,
  SponsorshipPlan,
  SponsoredListing,
  CreateSponsorshipPayload,
  UpdateSponsorshipPayload,
} from "@/services/provider.service";

export const PROVIDER_STATUS_KEY = ["my-provider-status"];

export const useMyProvider = () => {
  return useQuery<ProviderStatusResponse>({
    queryKey: PROVIDER_STATUS_KEY,
    queryFn: getMyProviderStatus,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
    placeholderData: (prev) => prev, // Keep stale data visible during refetch
  });
};

export const useUpdateProvider = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProviderPayload }) =>
      updateProvider(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDER_STATUS_KEY });
    },
  });
};

export const useProviderAnalytics = () => {
  return useQuery<ProviderAnalytics>({
    queryKey: ["my-provider-analytics"],
    queryFn: getMyAnalytics,
    staleTime: 1000 * 60 * 2,
  });
};

export const useReplyToReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, replyText }: { reviewId: string; replyText: string }) =>
      replyToReview(reviewId, replyText),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-provider-analytics"] });
      qc.invalidateQueries({ queryKey: PROVIDER_STATUS_KEY });
    },
  });
};

// ─── Offers / Deals ─────────────────────────────────────────────────

export const MY_OFFERS_KEY = ["my-provider-offers"];
const OFFER_LIMITS_KEY = ["my-offer-limits"];

export const useMyOffers = () => {
  return useQuery<ProviderOfferFull[]>({
    queryKey: MY_OFFERS_KEY,
    queryFn: getMyOffers,
    staleTime: 1000 * 60 * 2,
  });
};

export const useOfferLimits = () => {
  return useQuery<OfferLimits>({
    queryKey: OFFER_LIMITS_KEY,
    queryFn: getOfferLimits,
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreateOffer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOfferPayload) => createOffer(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_OFFERS_KEY });
      qc.invalidateQueries({ queryKey: OFFER_LIMITS_KEY });
      qc.invalidateQueries({ queryKey: PROVIDER_STATUS_KEY });
    },
  });
};

export const useUpdateOffer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ offerId, payload }: { offerId: string; payload: UpdateOfferPayload }) =>
      updateOffer(offerId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_OFFERS_KEY });
      qc.invalidateQueries({ queryKey: OFFER_LIMITS_KEY });
      qc.invalidateQueries({ queryKey: PROVIDER_STATUS_KEY });
    },
  });
};

export const useDeleteOffer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => deleteOffer(offerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_OFFERS_KEY });
      qc.invalidateQueries({ queryKey: OFFER_LIMITS_KEY });
      qc.invalidateQueries({ queryKey: PROVIDER_STATUS_KEY });
    },
  });
};

// ─── Sponsorships ───────────────────────────────────────────────────

export const SPONSORSHIP_PLANS_KEY = ["sponsorship-plans"];
export const MY_SPONSORSHIPS_KEY = ["my-sponsorships"];

export const useSponsorshipPlans = () => {
  return useQuery<SponsorshipPlan[]>({
    queryKey: SPONSORSHIP_PLANS_KEY,
    queryFn: getSponsorshipPlans,
    staleTime: 1000 * 60 * 10,
  });
};

export const useMySponsorships = () => {
  return useQuery<SponsoredListing[]>({
    queryKey: MY_SPONSORSHIPS_KEY,
    queryFn: getMySponsorships,
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreateSponsorship = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSponsorshipPayload) => createSponsorship(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_SPONSORSHIPS_KEY });
    },
  });
};

export const useUpdateSponsorship = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSponsorshipPayload }) =>
      updateSponsorship(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_SPONSORSHIPS_KEY });
    },
  });
};
