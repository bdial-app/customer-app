"use client";

import { useEffect, useState } from "react";

/**
 * The current time, as state.
 *
 * Reading Date.now() during render makes a component impure: the same props
 * can render differently, and countdowns freeze at whatever moment the screen
 * happened to render. This keeps the time in state and refreshes it on an
 * interval, so "3 days left" stays true while the screen is open.
 */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
