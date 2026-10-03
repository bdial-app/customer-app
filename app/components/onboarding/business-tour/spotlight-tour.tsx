"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { arrowBack, arrowForward, close, checkmark } from "ionicons/icons";
import { useIsClient } from "@/hooks/useIsClient";
import { triggerHaptic } from "@/utils/haptics";
import type { TourChapter, TourStep } from "./tour-content";

/** Space between the highlighted element and the edge of the spotlight. */
const PAD = 8;
const GAP = 14;
const EDGE = 12;
/** How long to wait for a step's element to appear before showing the card alone. */
const FIND_TIMEOUT_MS = 4000;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const sameRect = (a: Rect | null, b: Rect | null) =>
  !!a && !!b && Math.abs(a.top - b.top) < 0.5 && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5;

/**
 * The visible elements for a tour anchor (hidden tab panels keep theirs in the
 * DOM). Several elements may share one anchor — e.g. a search box and its
 * filter pills — and are spotlit together.
 */
const findTargets = (anchor: string): HTMLElement[] =>
  [...document.querySelectorAll<HTMLElement>(`[data-tour="${anchor}"]`)].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });

const unionRect = (els: HTMLElement[]): Rect => {
  const rs = els.map((el) => el.getBoundingClientRect());
  const top = Math.min(...rs.map((r) => r.top));
  const left = Math.min(...rs.map((r) => r.left));
  const bottom = Math.max(...rs.map((r) => r.bottom));
  const right = Math.max(...rs.map((r) => r.right));
  return { top, left, width: right - left, height: bottom - top };
};

interface Props {
  chapters: TourChapter[];
  /** Opens the tab (and Business sub-tab) a step lives on. */
  onNavigate: (step: TourStep) => void;
  /** Called with the chapter ids the person got through, and whether they finished. */
  onClose: (result: { completedChapters: string[]; finished: boolean }) => void;
}

/**
 * The interactive tour: dims the app, cuts a glowing window around the thing
 * being explained, and floats a small card beside it. Steps with no anchor
 * (chapter intros, the finale) show the card centred.
 */
export default function SpotlightTour({ chapters, onNavigate, onClose }: Props) {
  const mounted = useIsClient();
  const steps = chapters.flatMap((c) => c.steps.map((s) => ({ ...s, chapter: c })));
  const [index, setIndex] = useState(0);
  // Which way the person is moving, so an absent optional step is skipped the same way.
  const direction = useRef<1 | -1>(1);
  const [rect, setRect] = useState<Rect | null>(null);
  const [searching, setSearching] = useState(false);
  const [cardH, setCardH] = useState(0);
  // The card is re-created each step; measure whichever one is on screen.
  const cardObserver = useRef<ResizeObserver | null>(null);
  const cardRef = useCallback((el: HTMLDivElement | null) => {
    cardObserver.current?.disconnect();
    if (!el) return;
    setCardH(el.offsetHeight);
    cardObserver.current = new ResizeObserver(() => setCardH(el.offsetHeight));
    cardObserver.current.observe(el);
  }, []);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  const step = steps[index];
  const chapterSteps = steps.filter((s) => s.chapter.id === step.chapter.id);
  const posInChapter = chapterSteps.indexOf(step);
  const isLast = index === steps.length - 1;

  // Open the right tab, then find, scroll to and keep measuring the anchor.
  useEffect(() => {
    if (!step) return;
    onNavigate(step);
    setRect(null);
    if (!step.anchor) {
      setSearching(false);
      return;
    }
    setSearching(true);

    let raf = 0;
    let scrolled = false;
    const started = performance.now();

    const tick = () => {
      const els = findTargets(step.anchor!);
      if (els.length) {
        if (!scrolled) {
          scrolled = true;
          els[0].scrollIntoView({ block: step.scrollBlock ?? "center", inline: "nearest", behavior: "smooth" });
        }
        const next = unionRect(els);
        setRect((prev) => (sameRect(prev, next) ? prev : next));
        setSearching(false);
      } else if (performance.now() - started > (step.optional ? 1500 : FIND_TIMEOUT_MS)) {
        // This section isn't showing for this business — move past it quietly.
        const target = Math.min(Math.max(index + direction.current, 0), steps.length - 1);
        if (step.optional && target !== index) {
          setIndex(target);
          return;
        }
        setSearching(false);
      }
      raf = requestAnimationFrame(tick);
    };
    // Give the tab a frame to render before looking.
    const t = setTimeout(() => (raf = requestAnimationFrame(tick)), 120);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run per step only
  }, [index]);

  useEffect(() => {
    const read = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  const completedChapters = useCallback(
    (upTo: number, finished: boolean) => {
      const ids = new Set<string>();
      steps.forEach((s, i) => {
        const lastOfChapter = steps.filter((x) => x.chapter.id === s.chapter.id).at(-1) === s;
        if (lastOfChapter && (finished || i < upTo)) ids.add(s.chapter.id);
      });
      return [...ids];
    },
    [steps],
  );

  const next = () => {
    triggerHaptic("light");
    if (isLast) onClose({ completedChapters: completedChapters(index, true), finished: true });
    else {
      direction.current = 1;
      setIndex((i) => i + 1);
    }
  };
  const back = () => {
    if (index === 0) return;
    direction.current = -1;
    setIndex((i) => i - 1);
  };
  const skip = () => onClose({ completedChapters: completedChapters(index, false), finished: false });

  // Android back / Escape closes the tour rather than leaving the page under it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!mounted || !step) return null;

  const { w: vw, h: vh } = viewport;
  // Spotlight only the on-screen part, and at most ~half the screen, so a long
  // list still leaves room for the card.
  let hole: { x: number; y: number; w: number; h: number } | null = null;
  if (rect) {
    const top = Math.max(rect.top, 0) - PAD;
    const bottom = Math.min(rect.top + rect.height, vh) + PAD;
    const x = Math.max(EDGE / 2, rect.left - PAD);
    hole = {
      x,
      y: Math.max(EDGE / 2, top),
      w: Math.min(vw - EDGE - x + EDGE / 2, rect.width + PAD * 2),
      h: Math.max(24, Math.min(bottom - Math.max(EDGE / 2, top), vh * 0.5)),
    };
  }
  const radius = hole ? Math.min(20, hole.h / 2) : 0;

  // Card goes below the spotlight if it fits, else above, else pinned to the bottom.
  const cardW = Math.min(360, vw - 32);
  let cardTop: number;
  let cardLeft = (vw - cardW) / 2;
  let arrow: { side: "top" | "bottom"; x: number } | null = null;
  if (hole) {
    const centerX = hole.x + hole.w / 2;
    cardLeft = Math.min(Math.max(centerX - cardW / 2, 16), vw - 16 - cardW);
    const below = hole.y + hole.h + GAP;
    const above = hole.y - GAP - cardH;
    const safeTop = 56;
    if (below + cardH <= vh - 16) {
      cardTop = below;
      arrow = { side: "top", x: centerX - cardLeft };
    } else if (above >= safeTop) {
      cardTop = above;
      arrow = { side: "bottom", x: centerX - cardLeft };
    } else {
      cardTop = vh - cardH - 24;
    }
  } else {
    cardTop = (vh - cardH) / 2;
  }
  if (arrow) arrow.x = Math.min(Math.max(arrow.x, 24), cardW - 24);

  const accent = step.chapter.color;
  const centred = !step.anchor || (!rect && !searching);

  return createPortal(
    <div className="fixed inset-0 z-[400]" role="dialog" aria-modal="true" aria-label={`${step.chapter.title} tour`}>
      {/* Dim layer with a cut-out. Clicks on it are swallowed so the app can't change under the tour. */}
      <svg className="absolute inset-0 w-full h-full" onClick={(e) => e.stopPropagation()}>
        <defs>
          <mask id="tour-hole">
            <rect width="100%" height="100%" fill="white" />
            {hole && (
              <motion.rect
                initial={false}
                animate={{ x: hole.x, y: hole.y, width: hole.w, height: hole.h, rx: radius }}
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <motion.rect
          width="100%"
          height="100%"
          fill="rgb(15,23,42)"
          initial={{ opacity: 0 }}
          animate={{ opacity: centred ? 0.78 : 0.7 }}
          mask="url(#tour-hole)"
        />
      </svg>

      {/* Glow ring around the spotlight */}
      {hole && (
        <motion.div
          className="absolute pointer-events-none"
          initial={false}
          animate={{ left: hole.x, top: hole.y, width: hole.w, height: hole.h, borderRadius: radius }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          style={{ boxShadow: `0 0 0 2px ${accent}, 0 0 0 6px ${accent}40, 0 0 28px 6px ${accent}55` }}
        >
          <span className="absolute inset-0 rounded-[inherit] animate-ping opacity-30" style={{ boxShadow: `0 0 0 2px ${accent}` }} />
        </motion.div>
      )}

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          ref={cardRef}
          initial={{ opacity: 0, y: arrow?.side === "bottom" ? -8 : 8, scale: 0.97 }}
          animate={{ opacity: cardH ? 1 : 0, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.12 } }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="absolute"
          style={{ top: Math.max(cardTop, 12), left: cardLeft, width: cardW }}
        >
          {arrow && (
            <span
              className="absolute w-4 h-4 rotate-45 bg-white dark:bg-slate-800"
              style={{ left: arrow.x - 8, [arrow.side]: -7 }}
            />
          )}
          <div className="relative rounded-3xl bg-white dark:bg-slate-800 shadow-2xl shadow-black/30 overflow-hidden">
            {step.hero && (
              <div className="px-5 pt-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${accent}, ${step.chapter.colorTo})` }}
                >
                  <IonIcon icon={step.icon ?? step.chapter.icon} />
                </div>
              </div>
            )}

            <div className="px-5 pt-4 pb-4">
              <div className="flex items-center gap-2">
                {!step.hero && (
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[14px] shrink-0"
                    style={{ background: `linear-gradient(135deg, ${accent}, ${step.chapter.colorTo})` }}
                  >
                    <IonIcon icon={step.icon ?? step.chapter.icon} />
                  </span>
                )}
                <span className="text-[10.5px] font-bold uppercase tracking-[0.12em]" style={{ color: accent }}>
                  {step.chapter.title}
                  {chapterSteps.length > 1 && ` · ${posInChapter + 1} of ${chapterSteps.length}`}
                </span>
                <button
                  onClick={skip}
                  aria-label="Close tour"
                  className="ml-auto -mr-1.5 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 dark:active:bg-slate-700"
                >
                  <IonIcon icon={close} className="text-lg" />
                </button>
              </div>

              <h3 className={`mt-2.5 font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight ${step.hero ? "text-[21px]" : "text-[17px]"}`}>
                {step.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">{step.body}</p>

              {step.points && (
                <ul className="mt-3 space-y-1.5">
                  {step.points.map((p) => (
                    <li key={p} className="flex gap-2 text-[12.5px] leading-snug text-slate-600 dark:text-slate-300">
                      <span
                        className="mt-[3px] w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-white text-[10px]"
                        style={{ background: accent }}
                      >
                        <IonIcon icon={checkmark} />
                      </span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              )}

              {step.tip && (
                <div className="mt-3 rounded-xl px-3 py-2 text-[12px] leading-snug" style={{ background: `${accent}14`, color: accent }}>
                  <span className="font-bold">Tip · </span>
                  <span className="text-slate-700 dark:text-slate-200">{step.tip}</span>
                </div>
              )}
            </div>

            {/* Footer: overall progress and controls */}
            <div className="flex items-center gap-2 px-4 pb-4">
              <div className="flex-1 flex gap-1">
                {chapters.filter((c) => c.id !== "finale").map((c) => {
                  const cs = steps.filter((s) => s.chapter.id === c.id);
                  const first = steps.indexOf(cs[0]);
                  const done = Math.min(Math.max(index - first + 1, 0), cs.length) / cs.length;
                  return (
                    <span key={c.id} className="h-1 flex-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <motion.span
                        className="block h-full rounded-full"
                        style={{ background: c.color }}
                        initial={false}
                        animate={{ width: `${done * 100}%` }}
                      />
                    </span>
                  );
                })}
              </div>
              {step.secondary && (
                <button
                  onClick={skip}
                  className="h-10 px-3 rounded-full text-[13px] font-semibold text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-700"
                >
                  {step.secondary}
                </button>
              )}
              {index > 0 && !step.secondary && (
                <button
                  onClick={back}
                  aria-label="Previous"
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 active:scale-90 transition-transform"
                >
                  <IonIcon icon={arrowBack} className="text-base" />
                </button>
              )}
              <button
                onClick={next}
                className="h-10 px-4 rounded-full flex items-center gap-1.5 text-white text-[13.5px] font-bold active:scale-95 transition-transform shadow-md"
                style={{ background: `linear-gradient(135deg, ${accent}, ${step.chapter.colorTo})` }}
              >
                {step.cta ?? (isLast ? "Finish" : "Next")}
                <IonIcon icon={isLast ? checkmark : arrowForward} className="text-[15px]" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body,
  );
}
