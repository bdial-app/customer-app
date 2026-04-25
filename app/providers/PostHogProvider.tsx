"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { detectDeviceType, getDeviceInfo } from "@/utils/deviceDetection";

function PostHogInit({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize PostHog
  useEffect(() => {
    // Skip initialization in development or if key is not set
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      console.warn("PostHog API key not configured");
      return;
    }

    if (posthog.__loaded) {
      console.log("PostHog already initialized");
      return; // Already initialized
    }

    try {
      const deviceInfo = getDeviceInfo();

      console.log("Initializing PostHog...");
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        person_profiles: "identified_only",
        capture_pageview: false,
        loaded: (ph) => {
          console.log("PostHog loaded successfully!");
          console.log("Device Info:", deviceInfo);
          ph.capture("app_loaded", deviceInfo);
        },
      });
    } catch (err) {
      console.error("Failed to initialize PostHog:", err);
    }
  }, []);

  // Track page views for Next.js App Router
  useEffect(() => {
    if (!posthog.__loaded) return;

    const deviceInfo = getDeviceInfo();
    const url =
      window.location.origin +
      pathname +
      (searchParams?.toString() ? `?${searchParams}` : "");
    posthog.capture("$pageview", {
      $current_url: url,
      device_type: deviceInfo.device_type,
      screen_width: deviceInfo.screen_width,
      screen_height: deviceInfo.screen_height,
    });
  }, [pathname, searchParams]);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <PostHogInit>{children}</PostHogInit>
    </Suspense>
  );
}
