"use client";

import { useSyncExternalStore } from "react";

/** Watches the `dark` class on <html>, which is where the theme toggle writes. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const read = () => document.documentElement.classList.contains("dark");

/**
 * Whether the app is in dark mode. Reads the DOM through an external store
 * rather than setting state in an effect, and stays in sync if the theme is
 * toggled while the component is on screen. False on the server.
 */
export function useIsDarkMode(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}
