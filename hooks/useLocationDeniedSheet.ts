"use client";
import { useEffect, useState } from "react";

interface SheetState {
  open: boolean;
  featureLabel?: string;
}

let currentState: SheetState = { open: false };
const listeners = new Set<(s: SheetState) => void>();

function setState(next: SheetState) {
  currentState = next;
  listeners.forEach((l) => l(currentState));
}

/** Show the location-denied bottom sheet. `featureLabel` is shown in the body copy. */
export function showLocationDeniedSheet(featureLabel?: string) {
  setState({ open: true, featureLabel });
}

export function hideLocationDeniedSheet() {
  setState({ open: false });
}

export function useLocationDeniedSheet(): SheetState {
  const [state, setLocal] = useState<SheetState>(currentState);
  useEffect(() => {
    listeners.add(setLocal);
    return () => {
      listeners.delete(setLocal);
    };
  }, []);
  return state;
}
