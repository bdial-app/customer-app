"use client";
import { useEffect, useRef, useCallback } from "react";
import { trackEvent, trackDuration } from "@/utils/analytics-collector";

type SourceType = "home_feed" | "explore" | "search" | "direct" | "saved" | "chat" | "product_link";

/**
 * Tracks a provider profile view + time spent.
 * Call at the top of the provider detail page.
 */
export function useTrackProviderView(providerId: string | undefined, source: SourceType = "direct") {
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!providerId) return;

    trackEvent(providerId, "profile_view", { source });
    stopRef.current = trackDuration(providerId, "profile_view", { source });

    return () => {
      stopRef.current?.();
    };
  }, [providerId, source]);
}

/**
 * Tracks a product detail view + time spent.
 */
export function useTrackProductView(
  providerId: string | undefined,
  productId: string | undefined,
  source: SourceType = "direct",
) {
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!providerId || !productId) return;

    trackEvent(providerId, "product_view", { entityId: productId, source });
    stopRef.current = trackDuration(providerId, "product_view", { entityId: productId, source });

    return () => {
      stopRef.current?.();
    };
  }, [providerId, productId, source]);
}

/**
 * Returns action trackers for a specific provider.
 * Wrap around existing action buttons.
 */
export function useTrackAction(providerId: string | undefined) {
  const track = useCallback(
    (eventType: Parameters<typeof trackEvent>[1], entityId?: string, metadata?: Record<string, any>) => {
      if (!providerId) return;
      trackEvent(providerId, eventType, { entityId, metadata });
    },
    [providerId],
  );

  return {
    trackChat: () => track("chat_initiated"),
    trackCall: () => track("call_clicked"),
    trackDirection: () => track("direction_clicked"),
    trackShare: () => track("share_clicked"),
    trackSave: () => track("saved"),
    trackUnsave: () => track("unsaved"),
    trackOfferView: (offerId: string) => track("offer_viewed", offerId),
    trackPhotoView: (photoId?: string) => track("photo_viewed", photoId),
    trackReviewRead: () => track("review_read"),
    trackTabSwitch: (tab: string) => track("tab_switched", undefined, { tab }),
    trackProductView: (productId: string) => track("product_view", productId),
  };
}
