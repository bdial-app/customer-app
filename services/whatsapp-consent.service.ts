import apiClient from "@/utils/axios";
import { WHATSAPP_CONSENT_URLS } from "@/utils/urls";

/** A business owner's WhatsApp alerts choice (GET /whatsapp/consent/me). */
export interface WhatsAppConsentStatus {
  /** False when the user has no usable phone number. */
  applicable: boolean;
  /** owner: alerts about their business · customer: replies from businesses */
  role: "owner" | "customer";
  providerId: string | null;
  brandName: string | null;
  /** The number alerts go to, e.g. "+91 98••••3210". */
  phoneMasked: string | null;
  consent: "unknown" | "opted_in" | "opted_out";
  /** Our team recorded a yes when onboarding them; they haven't confirmed. */
  recordedByAdmin: boolean;
  ownerConfirmed: boolean;
  /** The app should ask now. */
  shouldPrompt: boolean;
  /** ask: never agreed · confirm: agreed through our team, please confirm */
  promptKind: "ask" | "confirm" | null;
}

export type WhatsAppConsentSource =
  | "app_onboarding"
  | "app_prompt"
  | "app_settings"
  | "app_home_card"
  | "app_dashboard_card";

export async function getMyWhatsAppConsent(): Promise<WhatsAppConsentStatus> {
  const { data } = await apiClient.get(WHATSAPP_CONSENT_URLS.ME);
  return data;
}

export async function setMyWhatsAppConsent(
  consent: "opted_in" | "opted_out",
  source: WhatsAppConsentSource,
): Promise<WhatsAppConsentStatus> {
  const { data } = await apiClient.put(WHATSAPP_CONSENT_URLS.ME, { consent, source });
  return data;
}

/** "Not now": the server asks again later, a few times at most. */
export async function whatsAppConsentLater(): Promise<WhatsAppConsentStatus> {
  const { data } = await apiClient.post(WHATSAPP_CONSENT_URLS.LATER);
  return data;
}
