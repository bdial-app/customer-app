"use client";
import {
  createContext,
  useContext,
  ReactNode,
} from "react";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import type { FeatureFlags } from "@/services/config.service";

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

const FeatureFlagContext = createContext<FeatureFlags>(DEFAULTS);

export const useFlags = () => useContext(FeatureFlagContext);

export const FeatureFlagProvider = ({ children }: { children: ReactNode }) => {
  const { flags, isLoading } = useFeatureFlags();

  if (flags.maintenance_mode) {
    return <MaintenanceScreen message={flags.maintenance_message} />;
  }

  return (
    <FeatureFlagContext.Provider value={flags}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

function MaintenanceScreen({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center px-6 z-[9999]">
      <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-amber-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.42 15.17l-5.42 5.42m0 0l-1.42-1.42m1.42 1.42L4.58 19.17m6.84-4l5.42-5.42M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h1 className="text-lg font-bold text-slate-800 mb-2 text-center">
        Under Maintenance
      </h1>
      <p className="text-sm text-slate-500 text-center max-w-xs">
        {message || "We're currently performing maintenance. Please check back soon."}
      </p>
    </div>
  );
}
