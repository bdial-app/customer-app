"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Tracks internal navigation depth so we can tell whether `router.back()`
 * has somewhere safe to go.  When the user lands on a page via an external
 * link (shared URL, notification, bookmark) the history stack is empty and
 * `router.back()` would exit the PWA or navigate to an unrelated site.
 *
 * Usage:
 *   const { goBack } = useBackNavigation();
 *   <button onClick={() => goBack("/")} />        // fallback = home
 *   <button onClick={() => goBack("/search")} />   // fallback = search
 */
export function useBackNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const navigationDepth = useRef(0);
  const lastPathname = useRef(pathname);

  // Increment depth every time the pathname changes (push / replace)
  useEffect(() => {
    if (pathname !== lastPathname.current) {
      navigationDepth.current += 1;
      lastPathname.current = pathname;
    }
  }, [pathname]);

  /**
   * Navigate back safely.
   *
   * - If the user navigated internally at least once → `router.back()`
   * - Otherwise → `router.push(fallback)` (defaults to "/")
   */
  const goBack = useCallback(
    (fallbackRoute: string = "/") => {
      if (navigationDepth.current > 0) {
        navigationDepth.current -= 1;
        router.back();
      } else {
        router.push(fallbackRoute);
      }
    },
    [router],
  );

  return { goBack };
}
