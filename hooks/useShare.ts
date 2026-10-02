"use client";
import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNotification } from "@/app/context/NotificationContext";
import { getProviderDetails } from "@/services/provider.service";
import { getProductById } from "@/services/product.service";
import { businessCaption, productCaption } from "@/utils/share-copy";
import { toShareBusiness, toShareProduct } from "@/utils/share-data";
import { renderBusinessCard, renderProductCard } from "@/utils/share-card";
import { shareFilename, shareRich, type RichShare, type RichShareResult } from "@/utils/sharing";

const DETAILS_STALE_MS = 5 * 60_000;
const CARD_STALE_MS = 10 * 60_000;

// ── Toasts ───────────────────────────────────────────────

function useShareFeedback() {
  const { notify } = useNotification();
  return useCallback(
    (result: RichShareResult) => {
      if (result.status === "shared" && result.withImage && result.captionCopied) {
        notify({ title: "Caption copied", subtitle: "If the message came through without it, just paste.", variant: "info" });
      } else if (result.status === "copied") {
        notify({ title: "Copied — ready to paste", subtitle: "Paste it into WhatsApp or any chat.", variant: "success" });
      } else if (result.status === "failed") {
        notify({ title: "Couldn’t share right now", subtitle: "Please try again in a moment.", variant: "error" });
      }
    },
    [notify],
  );
}

/**
 * Builds the share on first use and keeps it for a while. Prefetching matters
 * in a browser: Web Share must run inside the tap that started it, and a card
 * drawn after the tap can outlive that window.
 */
function usePreparedShare(key: readonly unknown[], build: () => Promise<RichShare>, prefetch: boolean) {
  const qc = useQueryClient();
  const feedback = useShareFeedback();
  const [busy, setBusy] = useState(false);

  useQuery({ queryKey: key, queryFn: build, enabled: prefetch, staleTime: CARD_STALE_MS, gcTime: CARD_STALE_MS * 3, retry: false });

  const share = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const prepared: RichShare =
        qc.getQueryData<RichShare>(key) ?? (await qc.fetchQuery<RichShare>({ queryKey: key, queryFn: build, staleTime: CARD_STALE_MS }));
      feedback(await shareRich(prepared));
    } catch {
      feedback({ status: "failed", withImage: false, captionCopied: false });
    } finally {
      setBusy(false);
    }
  }, [busy, qc, key, build, feedback]);

  return { share, busy };
}

// ── Public hooks ─────────────────────────────────────────

/**
 * Share a business as a branded card plus a message. `asOwner` switches the
 * copy to the business speaking for itself, for the owner's own share buttons.
 */
export function useShareBusiness(providerId: string | undefined, opts: { asOwner?: boolean; prefetch?: boolean } = {}) {
  const { asOwner = false, prefetch = true } = opts;
  const qc = useQueryClient();

  const build = useCallback(async (): Promise<RichShare> => {
    if (!providerId) throw new Error("No business to share");
    const details = await qc.fetchQuery({
      queryKey: ["provider-details", providerId],
      queryFn: () => getProviderDetails(providerId),
      staleTime: DETAILS_STALE_MS,
    });
    const business = toShareBusiness(details);
    return {
      title: `${business.name} on Tijarah Connect`,
      caption: businessCaption(business, asOwner),
      image: await renderBusinessCard(business),
      filename: shareFilename(business.name),
    };
  }, [providerId, asOwner, qc]);

  return usePreparedShare(["share-card", "business", providerId, asOwner], build, prefetch && !!providerId);
}

/** Share a product or service as a branded card plus a message. */
export function useShareProduct(productId: string | undefined, opts: { asOwner?: boolean; prefetch?: boolean } = {}) {
  const { asOwner = false, prefetch = true } = opts;
  const qc = useQueryClient();

  const build = useCallback(async (): Promise<RichShare> => {
    if (!productId) throw new Error("No product to share");
    const details = await qc.fetchQuery({
      queryKey: ["product", productId],
      queryFn: () => getProductById(productId),
      staleTime: DETAILS_STALE_MS,
    });
    const providerId = details.provider?.id ?? details.product.providerId;
    const providerDetails = providerId
      ? await qc
          .fetchQuery({
            queryKey: ["provider-details", providerId],
            queryFn: () => getProviderDetails(providerId),
            staleTime: DETAILS_STALE_MS,
          })
          .catch(() => null)
      : null;
    const product = toShareProduct(details, providerDetails);
    return {
      title: `${product.name} — ${product.business.name}`,
      caption: productCaption(product, asOwner),
      image: await renderProductCard(product),
      filename: shareFilename(`${product.business.name}-${product.name}`),
    };
  }, [productId, asOwner, qc]);

  return usePreparedShare(["share-card", "product", productId, asOwner], build, prefetch && !!productId);
}
