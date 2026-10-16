"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector } from "@/hooks/useAppStore";
import { useAppContext } from "@/app/context/AppContext";
import { takeMyReviewIntent, takePendingGoLink } from "@/services/links.service";
import { markReviewFromLink, reviewRoute, splitAppTarget } from "@/utils/app-links";

/**
 * Someone tapped one of our links before they had the app (or before signing
 * in): once they're signed in, open what they were trying to reach — the
 * message's screen, or the review they started on the web page. Once per
 * account per app session.
 */
export default function PendingLinkOpener() {
  const user = useAppSelector((s) => s.auth.user);
  const router = useRouter();
  const pathname = usePathname();
  const { setUserMode, providerStatus, providerStatusResolved } = useAppContext();
  const checkedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id || checkedFor.current === user.id || !providerStatusResolved) return;
    if (pathname?.startsWith("/go") || pathname?.startsWith("/r")) return; // those pages handle it
    const userId = user.id;
    const timer = setTimeout(async () => {
      checkedFor.current = userId;
      try {
        const target = await takePendingGoLink();
        if (target) {
          const { path, mode } = splitAppTarget(target);
          if (mode === "provider" && providerStatus !== "not_applied") setUserMode("provider");
          if (mode === "customer") setUserMode("customer");
          router.push(path);
          return;
        }
        const intent = await takeMyReviewIntent();
        if (intent) {
          markReviewFromLink(intent.providerId);
          router.push(reviewRoute(intent.providerId, intent.stars));
        }
      } catch {
        // Nothing waiting, or offline: carry on as normal.
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [user?.id, pathname, providerStatus, providerStatusResolved, router, setUserMode]);

  return null;
}
