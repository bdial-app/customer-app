"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False on the server and during hydration, true once running in the browser.
 *
 * Replaces the `useEffect(() => setMounted(true), [])` pattern for gating
 * portals and browser-only UI. Hydration still sees false (matching the
 * pre-rendered HTML), but anything mounted later on the client renders on its
 * first pass instead of one blank frame later.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
