import apiClient from "@/utils/axios";
import { CONFIG_URLS } from "@/utils/urls";

export interface FeatureFlags {
  maintenance_mode: boolean;
  maintenance_message: string;
  registration_enabled: boolean;
  provider_onboarding_enabled: boolean;
  chat_enabled: boolean;
  reviews_enabled: boolean;
  search_enabled: boolean;
  offers_require_approval: boolean;
  sponsorship_requires_approval: boolean;
  leads_monetization_enabled: boolean;
  deals_monetization_enabled: boolean;
  subscriptions_visible: boolean;
}

export const getFeatureFlags = async (): Promise<FeatureFlags> => {
  const { data } = await apiClient.get(CONFIG_URLS.FEATURE_FLAGS);
  return data;
};
