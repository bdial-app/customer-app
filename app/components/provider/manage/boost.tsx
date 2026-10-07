"use client";
/**
 * Boost, sold where it makes sense: a header button that always says
 * something true ("Boost" / "Boosted · 3 days left"), a hero that explains
 * what it gets you, and small prompts inside the sections where an owner
 * feels the need for more reach — never while a boost is already running,
 * and each can be waved off for a week.
 */
import { createContext, useContext, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { closeOutline, eyeOutline, flash, rocket, searchOutline, star, trendingUp } from "ionicons/icons";

export interface BoostState {
  /** Boosting is switched on for this app. */
  enabled: boolean;
  /** When the running boost ends, or null if none is running. */
  activeUntil: Date | null;
  /** Open a Manage Business section (e.g. "boost"). */
  openTab: (id: string) => void;
}

const BoostContext = createContext<BoostState>({ enabled: false, activeUntil: null, openTab: () => {} });
export const BoostProvider = ({ value, children }: { value: BoostState; children: ReactNode }) => (
  <BoostContext.Provider value={value}>{children}</BoostContext.Provider>
);
export const useBoost = () => useContext(BoostContext);

export const daysLeft = (until: Date) => Math.max(1, Math.ceil((until.getTime() - Date.now()) / 86_400_000));

const NUDGE_SNOOZE_MS = 7 * 86_400_000;
const nudgeKey = (id: string) => `tijarah_boost_nudge_${id}`;

/** The header's call to action: glowing "Boost", or "Boosted · N days left". */
export function BoostButton({ open, onClick, tourId }: { open: boolean; onClick: () => void; tourId: string }) {
  const { activeUntil } = useBoost();
  if (activeUntil) {
    return (
      <motion.button
        whileTap={{ scale: 0.94 }}
        type="button"
        data-tour={tourId}
        onClick={onClick}
        aria-pressed={open}
        className={`h-9 pl-2.5 pr-3 rounded-full text-[12px] font-extrabold flex items-center gap-1.5 shrink-0 ${
          open ? "bg-white text-emerald-700" : "bg-emerald-400 text-emerald-950 shadow-md shadow-emerald-500/30"
        }`}
      >
        <span className="relative flex w-2 h-2">
          <span className="absolute inset-0 rounded-full bg-emerald-700 animate-ping opacity-60" />
          <span className="relative w-2 h-2 rounded-full bg-emerald-800" />
        </span>
        Boosted · {daysLeft(activeUntil)}d left
      </motion.button>
    );
  }
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      type="button"
      data-tour={tourId}
      onClick={onClick}
      aria-pressed={open}
      className={`relative h-9 pl-2.5 pr-3.5 rounded-full text-[12.5px] font-extrabold flex items-center gap-1.5 shrink-0 overflow-hidden ${
        open
          ? "bg-white text-orange-600 shadow-md shadow-orange-950/20"
          : "bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 text-slate-950 shadow-[0_0_0_3px_rgba(251,191,36,0.25),0_6px_16px_-4px_rgba(249,115,22,0.7)]"
      }`}
    >
      {!open && (
        // A light sweep every few seconds: noticeable, not noisy.
        <motion.span
          aria-hidden
          className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-[-20deg]"
          animate={{ x: ["0%", "320%"] }}
          transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 3.2, ease: "easeInOut" }}
        />
      )}
      <IonIcon icon={rocket} className="relative text-[15px]" />
      <span className="relative">Boost</span>
    </motion.button>
  );
}

/** What Boost gets you, at the top of the growth area. */
export function BoostHero() {
  const { activeUntil } = useBoost();
  const perks = [
    { icon: searchOutline, text: "Top of search results" },
    { icon: star, text: "A spot in Featured" },
    { icon: eyeOutline, text: "Views & taps reported" },
  ];
  return (
    <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white shadow-xl shadow-orange-500/25">
      <div className="pointer-events-none absolute -top-12 -right-10 w-44 h-44 rounded-full bg-white/20 blur-2xl" />
      <div className="relative flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/25 text-[10.5px] font-extrabold uppercase tracking-wider">
            <IonIcon icon={flash} className="text-[11px]" />
            {activeUntil ? `Boost live · ${daysLeft(activeUntil)} days left` : "Get found first"}
          </span>
          <h2 className="mt-2 text-[22px] leading-tight font-extrabold tracking-tight">
            {activeUntil ? "Your business is being shown first" : "More eyes on your business, starting today"}
          </h2>
          <p className="mt-1.5 text-[13px] leading-snug text-white/90">
            {activeUntil
              ? "Customers nearby see you at the top. Extend it any time to keep the momentum."
              : "Boost puts you at the top when customers nearby browse and search — you choose how long."}
          </p>
        </div>
        <motion.span
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="w-14 h-14 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center shrink-0"
        >
          <IonIcon icon={rocket} className="text-[28px]" />
        </motion.span>
      </div>
      <div className="relative mt-4 grid grid-cols-3 gap-2">
        {perks.map((p) => (
          <div key={p.text} className="rounded-2xl bg-white/20 backdrop-blur-sm px-2 py-2.5 text-center">
            <IonIcon icon={p.icon} className="text-[17px]" />
            <p className="text-[11px] font-bold leading-tight mt-1">{p.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A small, contextual invitation to Boost from inside a section. */
export function BoostNudge({ id, title, body, cta = "Boost now" }: { id: string; title: string; body: string; cta?: string }) {
  const { enabled, activeUntil, openTab } = useBoost();
  const [hidden, setHidden] = useState(() => {
    try {
      const at = Number(localStorage.getItem(nudgeKey(id)) ?? 0);
      return Date.now() - at < NUDGE_SNOOZE_MS;
    } catch {
      return false;
    }
  });
  if (!enabled || activeUntil || hidden) return null;

  const snooze = () => {
    setHidden(true);
    try {
      localStorage.setItem(nudgeKey(id), String(Date.now()));
    } catch {
      /* ignore */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-[1.5px] bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 shadow-[0_10px_24px_-14px_rgba(249,115,22,0.7)]"
    >
      <div className="relative rounded-[15px] bg-white dark:bg-slate-900 p-3.5 flex items-center gap-3">
        <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-orange-500/30">
          <IonIcon icon={rocket} className="text-[20px] text-white" />
        </span>
        <div className="flex-1 min-w-0 pr-5">
          <p className="text-[13.5px] font-extrabold text-slate-900 dark:text-white leading-snug">{title}</p>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{body}</p>
          <button
            type="button"
            onClick={() => openTab("boost")}
            className="mt-2.5 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[12.5px] font-extrabold active:scale-[0.97] transition-transform"
          >
            <IonIcon icon={trendingUp} className="text-[14px]" />
            {cta}
          </button>
        </div>
        <button
          type="button"
          onClick={snooze}
          aria-label="Not now"
          className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 dark:active:bg-slate-800"
        >
          <IonIcon icon={closeOutline} className="text-lg" />
        </button>
      </div>
    </motion.div>
  );
}
