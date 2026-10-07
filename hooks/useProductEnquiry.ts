import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { useAuthGate } from "./useAuthGate";
import { useAppDispatch } from "./useAppStore";
import { useCreateConversation } from "./useChat";
import { openChat } from "@/store/slices/chatSlice";
import { store } from "@/store";

export interface EnquiryTarget {
  providerId: string;
  /** The business owner's user id, so an owner never enquires with themselves. */
  providerUserId?: string | null;
  productId: string;
  productName: string;
  productType?: "product" | "service";
  photoUrl?: string | null;
  price?: number | null;
  currency?: string;
}

/**
 * Opens a chat with the business about one product or service, with a
 * first message that names it. Guests are asked to sign in first.
 */
export const useProductEnquiry = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { requireAuth } = useAuthGate();
  const { mutate: createConversation, isPending, variables } = useCreateConversation();

  const enquire = useCallback(
    (target: EnquiryTarget) => {
      requireAuth(() => {
        // Re-check after auth — the customer may have signed in as this business.
        const currentUser = store.getState().auth.user;
        if (currentUser && target.providerUserId && currentUser.id === target.providerUserId) return;

        const noun = target.productType === "service" ? "this service" : "this product";
        createConversation(
          {
            providerId: target.providerId,
            contextType: "product",
            contextId: target.productId,
            initialMessage: `Hi! I'm interested in ${target.productName || noun}. Could you share more details?`,
            initialMessageMetadata: {
              productId: target.productId,
              productName: target.productName,
              productImage: target.photoUrl ?? undefined,
              productPrice: target.price ?? undefined,
              currency: target.currency,
            },
          },
          {
            onSuccess: (conv) => {
              dispatch(openChat(conv.id));
              router.push("/");
            },
            onError: (err) => {
              const apiMsg = isAxiosError<{ message?: string | string[] }>(err)
                ? err.response?.data?.message
                : undefined;
              const msg = apiMsg || err?.message || "Could not start conversation";
              alert(Array.isArray(msg) ? msg.join(", ") : msg);
            },
          },
        );
      });
    },
    [requireAuth, createConversation, dispatch, router],
  );

  /** The product id whose enquiry is opening, for a per-card spinner. */
  const pendingProductId = isPending ? (variables?.contextId ?? null) : null;

  return { enquire, isPending, pendingProductId };
};
