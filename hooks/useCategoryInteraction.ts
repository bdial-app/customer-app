"use client";

import { useCallback, useRef } from "react";
import { useAppSelector } from "./useAppStore";
import { recordCategoryInteraction, InteractionType } from "@/services/user.service";

/**
 * Hook for tracking category interactions for personalization.
 * Fire-and-forget: failures are silently ignored.
 * Deduplicates: won't re-fire the same (categoryId, type) within 60s.
 */
export function useCategoryInteraction() {
  const user = useAppSelector((state) => state.auth.user);
  const recentRef = useRef<Map<string, number>>(new Map());

  const trackCategory = useCallback(
    (categoryId: string, type: InteractionType) => {
      if (!user || !categoryId) return;

      const key = `${categoryId}:${type}`;
      const now = Date.now();
      const last = recentRef.current.get(key);
      if (last && now - last < 60_000) return; // debounce 60s
      recentRef.current.set(key, now);

      // Fire and forget
      recordCategoryInteraction(categoryId, type).catch(() => {});
    },
    [user],
  );

  const trackCategories = useCallback(
    (categoryIds: string[], type: InteractionType) => {
      for (const id of categoryIds) {
        trackCategory(id, type);
      }
    },
    [trackCategory],
  );

  return { trackCategory, trackCategories };
}
