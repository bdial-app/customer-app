"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { businessHref, HAS_LISTING_PAGES } from "@/utils/share-links";

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

/**
 * Website only: once the page is idle, fetch the first few business pages a
 * section shows, so tapping one opens it at once instead of waiting on the
 * server. Product cards are links and get this from Next already; business
 * cards open in code, so their sections ask for it here.
 */
export function usePrefetchBusinesses(
  list: ReadonlyArray<{ id: string | number; slug?: string | null }> | null | undefined,
  max = 6,
) {
  const router = useRouter();
  const key = (list ?? []).slice(0, max).map((b) => businessHref(b)).join("|");

  useEffect(() => {
    if (!HAS_LISTING_PAGES || !key) return;
    const run = () => key.split("|").forEach((href) => router.prefetch(href));
    const w = window as IdleWindow;
    if (w.requestIdleCallback && w.cancelIdleCallback) {
      const handle = w.requestIdleCallback(run, { timeout: 3000 });
      return () => w.cancelIdleCallback!(handle);
    }
    const timer = setTimeout(run, 1500);
    return () => clearTimeout(timer);
  }, [key, router]);
}
