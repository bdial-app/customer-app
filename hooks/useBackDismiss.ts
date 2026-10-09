"use client";

import { useEffect, useRef } from "react";

/**
 * One back stack for everything that sits on top of a page, so "back" — the
 * Android back button or gesture, or an iOS edge swipe — closes what is on
 * top before it ever leaves the page:
 *
 *   sheet   bottom sheets, dialogs, the photo viewer — back closes them
 *   screen  full-screen panels that slide in from the right — back closes
 *           them, and on iOS an edge swipe does too, like a pushed screen
 *   menu    small pop-overs (sort menus, the notifications dropdown)
 *   tab     the home page on a tab other than Home — back returns to Home
 *           (Android); never blocks page navigation
 */
export type OverlayKind = "sheet" | "screen" | "menu" | "tab";

type Entry = { kind: OverlayKind; close: () => void; canClose: () => boolean };

const stack: Entry[] = [];
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

export function subscribeBackStack(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export const topOverlay = (): Entry | undefined => stack[stack.length - 1];

/** Something other than a tab is open — page navigation should wait. */
export const hasOpenOverlay = (): boolean => stack.some((e) => e.kind !== "tab");

/**
 * Handle a back press: close whatever is on top. Returns true when it was
 * consumed — including by something that can't be dismissed right now.
 */
export function handleBackPress(): boolean {
  const top = topOverlay();
  if (!top) return false;
  if (top.canClose()) top.close();
  return true;
}

/** Register an overlay while `open`, so back closes it. */
export function useBackDismiss(
  open: boolean,
  onClose: () => void,
  { kind = "sheet", dismissible = true }: { kind?: OverlayKind; dismissible?: boolean } = {},
) {
  const latest = useRef({ onClose, dismissible });
  useEffect(() => {
    latest.current = { onClose, dismissible };
  });

  useEffect(() => {
    if (!open) return;
    const entry: Entry = {
      kind,
      close: () => latest.current.onClose(),
      canClose: () => latest.current.dismissible,
    };
    stack.push(entry);
    notify();
    return () => {
      const i = stack.indexOf(entry);
      if (i >= 0) stack.splice(i, 1);
      notify();
    };
  }, [open, kind]);
}
