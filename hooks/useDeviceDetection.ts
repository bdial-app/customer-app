"use client";

import posthog from "posthog-js";
import { usePostHog } from "posthog-js/react";
import { useEffect, useMemo } from "react";
import { useIsClient } from "@/hooks/useIsClient";

type DeviceInfo = {
  device_type: "mobile" | "tablet" | "desktop";
  screen_width: number;
  screen_height: number;
  user_agent: string;
};
import { detectDeviceType, getDeviceInfo } from "@/utils/deviceDetection";

/**
 * Hook to get device type and identify users with device info
 */
export function useDeviceDetection() {
  const posthog = usePostHog();
  // Read from the browser once hydrated; the server and the hydration pass
  // get the defaults, so the markup matches.
  const isClient = useIsClient();
  const deviceInfo = useMemo(
    () =>
      isClient
        ? (getDeviceInfo() as DeviceInfo)
        : ({ device_type: "desktop", screen_width: 0, screen_height: 0, user_agent: "" } as DeviceInfo),
    [isClient],
  );

  // Update PostHog with device info
  useEffect(() => {
    if (!isClient || !posthog) return;
    posthog.setPersonProperties({
      device_type: deviceInfo.device_type,
      screen_width: deviceInfo.screen_width,
      screen_height: deviceInfo.screen_height,
    });
  }, [isClient, posthog, deviceInfo]);

  return deviceInfo;
}

/**
 * Identify user with device information
 */
export function identifyUserWithDevice(
  userId: string,
  userProperties?: Record<string, unknown>,
) {
  const deviceInfo = getDeviceInfo();

  if (posthog) {
    posthog.identify(userId, {
      ...userProperties,
      device_type: deviceInfo.device_type,
      screen_width: deviceInfo.screen_width,
      screen_height: deviceInfo.screen_height,
      first_seen_device: deviceInfo.device_type,
    });
  }
}

/**
 * Capture event with device info
 */
export function captureEventWithDevice(
  eventName: string,
  properties?: Record<string, unknown>,
) {
  const deviceInfo = getDeviceInfo();

  if (posthog) {
    posthog.capture(eventName, {
      ...properties,
      device_type: deviceInfo.device_type,
      screen_width: deviceInfo.screen_width,
      screen_height: deviceInfo.screen_height,
    });
  }
}
