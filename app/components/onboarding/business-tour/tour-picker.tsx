"use client";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { checkmarkCircle, chevronForward, playCircle, timeOutline } from "ionicons/icons";
import BottomSheet from "@/app/components/bottom-sheet";
import type { TourChapter } from "./tour-content";

interface Props {
  opened: boolean;
  onClose: () => void;
  chapters: TourChapter[];
  /** Chapter ids already completed — they get a tick. */
  done: Set<string>;
  onStartAll: () => void;
  onStartChapter: (id: string) => void;
  /** One line under "Take the full tour". */
  fullTourBlurb: string;
  /**
   * Shown as a one-time offer (not opened from a help button): a welcoming
   * heading and a clear "Not now", so it reads as an invitation, not a block.
   */
  invite?: { title: string; body: string };
  /** Gradient for the full-tour button. */
  gradient: string;
}

const stepCount = (c: TourChapter) => c.steps.filter((s) => !s.secondary).length;

/** "Learn your way around": take the whole tour, or replay one part of it. */
export default function TourPicker({ opened, onClose, chapters, done, onStartAll, onStartChapter, fullTourBlurb, gradient, invite }: Props) {
  const totalMinutes = chapters.reduce((n, c) => n + c.minutes, 0);

  return (
    <BottomSheet opened={opened} onClose={onClose}>
      <div className="px-5 pt-2 pb-5 overflow-y-auto">
        <div className="flex items-start gap-3">
          <h2 className="flex-1 text-[20px] font-extrabold tracking-tight text-slate-900 dark:text-white">
            {invite?.title ?? "Learn your way around"}
          </h2>
          {invite && (
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 h-9 px-3.5 mt-0.5 rounded-full text-[13px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700"
            >
              Not now
            </button>
          )}
        </div>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
          {invite?.body ?? `Pick a part of the app, or take the whole tour — about ${totalMinutes} minutes.`}
        </p>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onStartAll}
          className="mt-4 w-full flex items-center gap-3 p-4 rounded-2xl text-left text-white shadow-lg shadow-black/10"
          style={{ background: gradient }}
        >
          <span className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <IonIcon icon={playCircle} className="text-2xl" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[15px] font-bold">Take the full tour</span>
            <span className="block text-[12px] text-white/80 mt-0.5">{fullTourBlurb}</span>
          </span>
          <IonIcon icon={chevronForward} className="text-lg text-white/80" />
        </motion.button>

        <div className="mt-4 space-y-2.5">
          {chapters.map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.05 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => onStartChapter(c.id)}
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
                {stepCount(c)} {stepCount(c) === 1 ? "step" : "steps"}
              </span>
            </motion.button>
          ))}
        </div>

        {invite && (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full h-12 rounded-xl text-[14px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700"
          >
            Not now — I&apos;ll explore myself
          </button>
        )}
        {invite && (
          <p className="mt-2 text-center text-[11.5px] text-slate-400 dark:text-slate-500">
            You can take the tour any time from Profile → Take the app tour.
          </p>
        )}
      </div>
    </BottomSheet>
  );
}
