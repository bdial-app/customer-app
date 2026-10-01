import { getItemSync, setItemSync, removeItemSync } from "./storage";

const KEY = "tijarah.welcomeTourSeen.v1";

/**
 * Whether this device has been shown the welcome tour.
 *
 * Stored per device rather than per account on purpose: the tour explains what
 * the app is, and you can browse Tijarah without signing in at all.
 */
export function hasSeenWelcomeTour(): boolean {
  try {
    return getItemSync(KEY) === "1";
  } catch {
    // Storage can be unavailable (private mode, cleared site data). Treat that
    // as "seen" so a broken read can never trap someone in the tour.
    return true;
  }
}

export function markWelcomeTourSeen(): void {
  try {
    setItemSync(KEY, "1");
  } catch {
    /* ignore — worst case it shows once more */
  }
  notify();
}

/** Used by the "How Tijarah works" row in Profile to play it again. */
export function resetWelcomeTour(): void {
  try {
    removeItemSync(KEY);
  } catch {
    /* ignore */
  }
  notify();
}

// ── A tiny store, so the permission prompt can wait for the tour ──
type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

export function subscribeWelcomeTour(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
