import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getServiceableCities,
  checkServiceability,
  requestCity,
} from "@/services/serviceable-cities.service";
import { Capacitor } from "@capacitor/core";

function getDeviceInfo() {
  const ua = navigator.userAgent;
  let platform: string;
  let osVersion: string | undefined;

  if (Capacitor.isNativePlatform()) {
    platform = Capacitor.getPlatform(); // 'android' | 'ios'
  } else if (/android/i.test(ua)) {
    platform = "android";
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    platform = "ios";
  } else {
    platform = "web";
  }

  // Parse OS version from UA
  const androidMatch = ua.match(/Android\s([\d.]+)/);
  const iosMatch = ua.match(/OS\s([\d_]+)/);
  if (androidMatch) osVersion = `Android ${androidMatch[1]}`;
  else if (iosMatch) osVersion = `iOS ${iosMatch[1].replace(/_/g, ".")}`;
  else if (/Windows/i.test(ua)) osVersion = "Windows";
  else if (/Mac/i.test(ua)) osVersion = "macOS";
  else if (/Linux/i.test(ua)) osVersion = "Linux";

  // Device type
  const isMobile = /Mobi|Android.*Mobile|iPhone/i.test(ua);
  const isTablet = /Tablet|iPad/i.test(ua) || (/Android/i.test(ua) && !isMobile);
  const deviceType = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";

  return { platform, deviceType, osVersion };
}

export const useServiceableCities = () => {
  return useQuery({
    queryKey: ["serviceable-cities"],
    queryFn: getServiceableCities,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};

export const useCheckServiceability = (
  city: string | null,
  lat?: number,
  lng?: number,
) => {
  return useQuery({
    queryKey: ["check-serviceability", city, lat, lng],
    queryFn: () =>
      checkServiceability({
        city: city || undefined,
        lat,
        lng,
      }),
    enabled: !!(city || (lat && lng)),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useRequestCity = () => {
  return useMutation({
    mutationFn: ({ city, deviceId }: { city: string; deviceId?: string }) => {
      const info = getDeviceInfo();
      return requestCity(city, deviceId, {
        platform: info.platform,
        deviceType: info.deviceType,
        osVersion: info.osVersion,
      });
    },
  });
};
