import apiClient from "@/utils/axios";
import { CONFIG_URLS } from "@/utils/urls";

export interface FeatureFlags {
  maintenance_mode: boolean;
  maintenance_message?: string;
  registration_enabled: boolean;
  provider_onboarding_enabled: boolean;
  chat_enabled: boolean;
  reviews_enabled: boolean;
  search_enabled: boolean;
  offers_require_approval: boolean;
  sponsorship_requires_approval: boolean;
}

const DEFAULTS: FeatureFlags = {
  maintenance_mode: false,
  registration_enabled: true,
  provider_onboarding_enabled: true,
  chat_enabled: true,
  reviews_enabled: true,
  search_enabled: true,
  offers_require_approval: false,
  sponsorship_requires_approval: false,
};

export const getFeatureFlags = async (): Promise<FeatureFlags> => {
  try {
    const { data } = await apiClient.get(CONFIG_URLS.FEATURE_FLAGS);
    return { ...DEFAULTS, ...data };
  } catch {
    return DEFAULTS;
  }
};
