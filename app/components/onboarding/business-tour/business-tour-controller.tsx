"use client";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useAppSelector } from "@/hooks/useAppStore";
import { useMyProvider } from "@/hooks/useMyProvider";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useMonetizationConfig } from "@/hooks/useMonetizationConfig";
import { onOpenBusinessTour, readBusinessTour, recordBusinessTour, subscribeBusinessTour } from "@/utils/business-tour";
import { hasSeenWelcomeTour } from "@/utils/welcome-tour";
import SpotlightTour from "./spotlight-tour";
import TourPicker from "./tour-picker";
import { buildBusinessTour, buildFinale, type TourChapter, type TourStep } from "./tour-content";

interface Props {
  /** True while the person is in business mode on the main screen. */
  active: boolean;
  goToTab: (tab: string) => void;
  openBusinessSubTab: (subTab: string) => void;
  openAnalyticsView: (view: string) => void;
}

/**
 * Owns the business tour: opens it once per owner and device, listens for the
 * ? button, shows the chapter picker, and turns each step into the right tab.
 */
export default function BusinessTourController({ active, goToTab, openBusinessSubTab, openAnalyticsView }: Props) {
  const user = useAppSelector((state) => state.auth.user);
  const { data: status } = useMyProvider();
  const { data: flags } = useFeatureFlags();
  const { data: monetization } = useMonetizationConfig();
  const provider = status?.provider ?? null;
  const userId = user?.id ?? null;

  const ctx = useMemo(
    () => ({
      firstName: (user?.name ?? "").trim().split(/\s+/)[0] ?? "",
      businessName: provider?.brandName ?? "",
      verification:
        status?.providerStatus === "approved" || status?.verificationStatus === "approved"
          ? ("verified" as const)
          : status?.verificationStatus === "rejected"
            ? ("rejected" as const)
            : status?.verificationStatus
              ? ("in_review" as const)
              : ("not_started" as const),
      subscriptionsVisible: monetization?.flags.subscriptionsVisible ?? false,
      sponsorshipsEnabled: flags?.sponsorships_enabled ?? false,
    }),
    [user?.name, provider?.brandName, status?.providerStatus, status?.verificationStatus, monetization?.flags.subscriptionsVisible, flags?.sponsorships_enabled],
  );
  const allChapters = useMemo(() => buildBusinessTour(ctx), [ctx]);

  // Re-read progress whenever it's saved, so the picker's ticks stay current.
  const record = useSyncExternalStore(
    subscribeBusinessTour,
    () => (userId ? JSON.stringify(readBusinessTour(userId)) : "{}"),
    () => "{}",
  );
  const progress = useMemo(() => JSON.parse(record) as { chapters?: string[]; dismissed?: boolean }, [record]);

  const [running, setRunning] = useState<TourChapter[] | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const startFull = useCallback(() => {
    setPickerOpen(false);
    setRunning([...allChapters, buildFinale(ctx)]);
  }, [allChapters, ctx]);

  const startChapter = useCallback(
    (id: string) => {
      const chapter = allChapters.find((c) => c.id === id);
      if (!chapter) return;
      setPickerOpen(false);
      // A single chapter skips the welcome card and starts on the real screen.
      setRunning([{ ...chapter, steps: chapter.steps.filter((s) => !s.secondary) }]);
    },
    [allChapters],
  );

  // First time this owner opens the business side on this device — new sign-ups,
  // bulk-imported businesses and long-time owners alike — offer the tour once.
  useEffect(() => {
    if (!active || !userId || !provider || running) return;
    if (progress.dismissed || (progress.chapters?.length ?? 0) > 0) return;
    // Never stack on top of the first-run welcome tour.
    if (!hasSeenWelcomeTour()) return;
    // Let the dashboard settle so the first spotlight lands on real content.
    const t = setTimeout(startFull, 1200);
    return () => clearTimeout(t);
  }, [active, userId, provider, running, progress, startFull]);

  // The ? button (or anything else) asks to open the tour.
  useEffect(
    () =>
      onOpenBusinessTour((chapterId) => {
        if (chapterId === "all") startFull();
        else if (chapterId) startChapter(chapterId);
        else setPickerOpen(true);
      }),
    [startFull, startChapter],
  );

  const navigate = useCallback(
    (step: TourStep) => {
      if (step.tab === "listings" && step.subTab) openBusinessSubTab(step.subTab);
      else if (step.tab === "analytics" && step.analyticsView) openAnalyticsView(step.analyticsView);
      else goToTab(step.tab);
    },
    [goToTab, openBusinessSubTab, openAnalyticsView],
  );

  const close = useCallback(
    ({ completedChapters, finished }: { completedChapters: string[]; finished: boolean }) => {
      if (userId) recordBusinessTour(userId, completedChapters.filter((c) => c !== "finale"), !finished);
      setRunning(null);
      goToTab("home");
    },
    [userId, goToTab],
  );

  if (!active) return null;

  const done = new Set(progress.chapters ?? []);

  return (
    <>
      {running && <SpotlightTour chapters={running} onNavigate={navigate} onClose={close} />}

      <TourPicker
        opened={pickerOpen}
        onClose={() => setPickerOpen(false)}
        chapters={allChapters}
        done={done}
        onStartAll={startFull}
        onStartChapter={startChapter}
        fullTourBlurb="Home, Business, Analytics and Chats, start to finish"
        gradient="linear-gradient(135deg, #4F46E5, #7C3AED 55%, #DB2777)"
      />
    </>
  );
}
