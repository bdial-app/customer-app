"use client";

import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";
import { useAppSelector } from "@/hooks/useAppStore";
import { getDeviceInfo } from "@/utils/deviceDetection";

/**
 * Hook to identify user in PostHog when they log in
 * Uses the user's name as the distinct ID to display in PostHog
 */
export function usePostHogIdentify() {
  const posthog = usePostHog();
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!posthog || !user) return;

    // Identify user with their name as the distinct ID
    const deviceInfo = getDeviceInfo();

    posthog.identify(user.name || user.id, {
      // Core user properties
      userId: user.id,
      email: user.email,
      mobileNumber: user.mobileNumber,
      city: user.city,
      gender: user.gender,
      role: user.role,
      ssoProvider: user.ssoProvider,

      // Device properties
      device_type: deviceInfo.device_type,
      screen_width: deviceInfo.screen_width,
      screen_height: deviceInfo.screen_height,
    });

    // Also set person properties for better filtering in PostHog
    posthog.setPersonProperties({
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
      city: user.city,
      gender: user.gender,
      role: user.role,
      device_type: deviceInfo.device_type,
    });
  }, [user, posthog]);
}
