import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyWhatsAppConsent,
  setMyWhatsAppConsent,
  whatsAppConsentLater,
  type WhatsAppConsentSource,
} from "@/services/whatsapp-consent.service";

export const WHATSAPP_CONSENT_KEY = ["whatsapp-consent"] as const;

/** The signed-in owner's WhatsApp alerts choice. */
export function useWhatsAppConsent(enabled = true) {
  return useQuery({
    queryKey: WHATSAPP_CONSENT_KEY,
    queryFn: getMyWhatsAppConsent,
    enabled,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/** Turn WhatsApp alerts on or off; the answer replaces the cached status. */
export function useSetWhatsAppConsent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ consent, source }: { consent: "opted_in" | "opted_out"; source: WhatsAppConsentSource }) =>
      setMyWhatsAppConsent(consent, source),
    onSuccess: (status) => qc.setQueryData(WHATSAPP_CONSENT_KEY, status),
  });
}

export function useWhatsAppConsentLater() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: whatsAppConsentLater,
    onSuccess: (status) => qc.setQueryData(WHATSAPP_CONSENT_KEY, status),
  });
}
