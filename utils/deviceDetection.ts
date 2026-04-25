/**
 * Detect device type based on user agent and window size
 * Returns: 'mobile' | 'tablet' | 'desktop'
 */
export function detectDeviceType(): "mobile" | "tablet" | "desktop" {
  // Check if window is available (client-side only)
  if (typeof window === "undefined") {
    return "desktop";
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const windowWidth = window.innerWidth;

  // Mobile detection
  const isMobileUserAgent =
    /android|webos|iphone|ipod|blackberry|iemobile|opera mini/.test(userAgent);

  // Tablet detection
  const isTabletUserAgent = /ipad|android|kindle|playbook|silk/.test(userAgent);

  // Screen size detection
  const isMobileSize = windowWidth < 768;
  const isTabletSize = windowWidth >= 768 && windowWidth < 1024;

  // Return device type based on user agent and screen size
  if (isMobileUserAgent && !isTabletUserAgent) {
    return "mobile";
  }

  if (isTabletUserAgent && isTabletSize) {
    return "tablet";
  }

  if (isMobileSize) {
    return "mobile";
  }

  if (isTabletSize) {
    return "tablet";
  }

  return "desktop";
}

/**
 * Get detailed device information
 */
export function getDeviceInfo() {
  if (typeof window === "undefined") {
    return {
      device_type: "desktop",
      screen_width: 0,
      screen_height: 0,
      user_agent: "",
    };
  }

  return {
    device_type: detectDeviceType(),
    screen_width: window.innerWidth,
    screen_height: window.innerHeight,
    user_agent: navigator.userAgent,
  };
}
