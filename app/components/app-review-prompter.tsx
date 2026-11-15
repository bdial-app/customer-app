"use client";

import { useEffect } from "react";
import { useAppSelector } from "@/hooks/useAppStore";
import { isNativePlatform } from "@/utils/platform";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { noteAppReviewAsked } from "@/services/app-review.service";
import {
  maybeAskForReview,
  noteBackground,
  noteForeground,
  returnedFromContact,
  setReviewAppVersion,
  setReviewConfig,
  setReviewReporter,
  setReviewSignedIn,
} from "@/utils/app-review";

/**
 * Feeds the review prompt (utils/app-review) what it needs: sessions, who is
 * signed in, the app version, the server's tuning, and the moment someone
 * comes back after calling or WhatsApping a business.
 *
 * Native apps only; renders nothing.
 */
export default function AppReviewPrompter() {
  const signedIn = useAppSelector((s) => !!s.auth.user?.name);
  const { data: flags } = useFeatureFlags();

  useEffect(() => {
    setReviewSignedIn(signedIn);
  }, [signedIn]);

  useEffect(() => {
    setReviewConfig(flags as unknown as Record<string, unknown>);
  }, [flags]);

  useEffect(() => {
    // Tell the server when an ask is spent, so a WhatsApp or push campaign
    // doesn't land on the same person straight after.
    setReviewReporter((channel) => {
      void noteAppReviewAsked(channel);
    });
    return () => setReviewReporter(null);
  }, []);

  useEffect(() => {
    if (!isNativePlatform()) return;
    noteForeground();
    let remove: (() => void) | null = null;
    let cancelled = false;
    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        App.getInfo()
          .then((info) => setReviewAppVersion(info.version))
          .catch(() => undefined);
        const listener = await App.addListener("appStateChange", ({ isActive }) => {
          if (!isActive) return noteBackground();
          noteForeground();
          // Back from a call or WhatsApp: give the app a beat to settle first.
          if (returnedFromContact()) setTimeout(() => void maybeAskForReview("contact-return"), 1200);
        });
        if (cancelled) listener.remove();
        else remove = () => listener.remove();
      } catch {
        // @capacitor/app not available
      }
    })();
    return () => {
      cancelled = true;
      remove?.();
    };
  }, []);

  return null;
}
