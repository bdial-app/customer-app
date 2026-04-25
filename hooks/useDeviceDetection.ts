"use client";

import { usePostHog } from "posthog-js/react";
import { useEffect, useState } from "react";
import { detectDeviceType, getDeviceInfo } from "@/utils/deviceDetection";

/**
 * Hook to get device type and identify users with device info
 */
export function useDeviceDetection() {
  const posthog = usePostHog();
  const [deviceInfo, setDeviceInfo] = useState({
    device_type: "desktop" as "mobile" | "tablet" | "desktop",
    screen_width: 0,
    screen_height: 0,
    user_agent: "",
  });

  useEffect(() => {
    const info = getDeviceInfo();
    setDeviceInfo(info as { device_type: "mobile" | "tablet" | "desktop"; screen_width: number; screen_height: number; user_agent: string });

    // Update PostHog with device info
    if (posthog) {
      posthog.setPersonProperties({
        device_type: info.device_type,
        screen_width: info.screen_width,
        screen_height: info.screen_height,
      });
    }
  }, [posthog]);

  return deviceInfo;
}

/**
 * Identify user with device information
 */
export function identifyUserWithDevice(
  userId: string,
  userProperties?: Record<string, any>,
) {
  const posthog = usePostHog();
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
  properties?: Record<string, any>,
) {
  const posthog = usePostHog();
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
