import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLeadPackCheckout,
  getLeadWallet,
  quoteLeads,
  unlockLeadsFromWallet,
} from "@/services/lead-wallet.service";
import { verifyAppleConsumable } from "@/services/payment.service";
import { payWithRazorpay } from "@/services/razorpay.service";
import { purchaseConsumable } from "@/services/iap.service";
import { getNativePlatform } from "@/utils/platform";
import { ANALYTICS_LEADS_KEY } from "@/hooks/useProviderAnalytics";

export const LEAD_WALLET_KEY = ["lead-wallet"];

export const useLeadWallet = (enabled = true) =>
  useQuery({ queryKey: LEAD_WALLET_KEY, queryFn: getLeadWallet, enabled, staleTime: 30_000 });

/** Everything that changes when contacts are bought or money moves. */
const refresh = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: LEAD_WALLET_KEY });
  qc.invalidateQueries({ queryKey: ANALYTICS_LEADS_KEY });
  qc.invalidateQueries({ queryKey: ["lead-unlock-info"] });
  qc.invalidateQueries({ queryKey: ["analytics-lead-detail"] });
  qc.invalidateQueries({ queryKey: ["chat-customer"] });
};

/** Buy a pack: Razorpay on Android and web, Apple on iPhone. */
export const useBuyLeadPack = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (packId: string) => {
      const apple = getNativePlatform() === "ios";
      const c = await createLeadPackCheckout(packId, apple ? "apple" : "razorpay");
      if (apple && c.gateway === "apple" && c.appleProductId) {
        await purchaseConsumable(c.appleProductId, (transactionId) =>
          verifyAppleConsumable({ paymentId: c.paymentId, transactionId }),
        );
      } else if (c.orderId && c.keyId) {
        await payWithRazorpay({
          orderId: c.orderId,
          amount: c.amount!,
          currency: c.currency!,
          paymentId: c.paymentId,
          keyId: c.keyId,
          description: c.description!,
          prefill: c.prefill || {},
        });
      } else {
        throw new Error("Couldn't start the payment");
      }
      return c;
    },
    onSettled: () => refresh(qc),
  });
};

export const useLeadQuote = (leadIds: string[]) =>
  useQuery({
    queryKey: ["lead-wallet-quote", [...leadIds].sort().join(",")],
    queryFn: () => quoteLeads(leadIds),
    enabled: leadIds.length > 0,
    staleTime: 10_000,
  });

export const useWalletUnlock = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: unlockLeadsFromWallet, onSuccess: () => refresh(qc) });
};
