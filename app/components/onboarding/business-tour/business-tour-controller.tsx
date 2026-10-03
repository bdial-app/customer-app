"use client";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { checkmarkCircle, chevronForward, playCircle, timeOutline } from "ionicons/icons";
import BottomSheet from "@/app/components/bottom-sheet";
import { useAppSelector } from "@/hooks/useAppStore";
import { useMyProvider } from "@/hooks/useMyProvider";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useMonetizationConfig } from "@/hooks/useMonetizationConfig";
import { onOpenBusinessTour, readBusinessTour, recordBusinessTour, subscribeBusinessTour } from "@/utils/business-tour";
import { hasSeenWelcomeTour } from "@/utils/welcome-tour";
import SpotlightTour from "./spotlight-tour";
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
      subscriptionsVisible: monetization?.flags.subscriptionsVisible ?? false,
      sponsorshipsEnabled: flags?.sponsorships_enabled ?? false,
    }),
    [user?.name, provider?.brandName, monetization?.flags.subscriptionsVisible, flags?.sponsorships_enabled],
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
  const totalMinutes = allChapters.reduce((n, c) => n + c.minutes, 0);

  return (
    <>
      {running && <SpotlightTour chapters={running} onNavigate={navigate} onClose={close} />}

      <BottomSheet opened={pickerOpen} onClose={() => setPickerOpen(false)}>
        <div className="px-5 pt-2 pb-5 overflow-y-auto">
          <h2 className="text-[20px] font-extrabold tracking-tight text-slate-900 dark:text-white">Learn your way around</h2>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
            Pick a part of the app, or take the whole tour — about {totalMinutes} minutes.
          </p>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={startFull}
            className="mt-4 w-full flex items-center gap-3 p-4 rounded-2xl text-left text-white shadow-lg shadow-indigo-500/25"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED 55%, #DB2777)" }}
          >
            <span className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <IonIcon icon={playCircle} className="text-2xl" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-bold">Take the full tour</span>
              <span className="block text-[12px] text-white/80 mt-0.5">Home, Business, Analytics and Chats, start to finish</span>
            </span>
            <IonIcon icon={chevronForward} className="text-lg text-white/80" />
          </motion.button>

          <div className="mt-4 space-y-2.5">
            {allChapters.map((c, i) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.05 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => startChapter(c.id)}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-left bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-700"
              >
                <span
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white text-xl"
                  style={{ background: `linear-gradient(135deg, ${c.color}, ${c.colorTo})` }}
                >
                  <IonIcon icon={c.icon} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[14.5px] font-bold text-slate-900 dark:text-white">{c.title}</span>
                    {done.has(c.id) && <IonIcon icon={checkmarkCircle} className="text-[15px] text-emerald-500" />}
                  </span>
                  <span className="block text-[12px] leading-snug text-slate-500 dark:text-slate-400 mt-0.5">{c.summary}</span>
                </span>
                <span className="flex items-center gap-0.5 text-[11px] font-semibold text-slate-400 shrink-0">
                  <IonIcon icon={timeOutline} className="text-[12px]" />
                  {c.steps.length} steps
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
