"use client";
/**
 * The one sheet every bottom sheet and dialog in the app is built on.
 *
 * Phones: a bottom sheet that behaves like a native one — drag the handle or
 * the content down to close (the content only once it's scrolled to the top,
 * so lists still scroll), flick to close, let go early and it springs back.
 * The backdrop fades as it's dragged, and it stays above the keyboard.
 *
 * Wider screens (tablets, the web): a centred dialog that fades in, closes
 * with Esc or a click outside, and never slides up from the bottom.
 */
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import { useBackDismiss } from "@/hooks/useBackDismiss";
import { useIsClient } from "@/hooks/useIsClient";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Panel classes (background, padding…). */
  className?: string;
  /** The backdrop sits at this z-index, the panel just above it. */
  zIndex?: number;
  /** Panel width as a dialog on wide screens. */
  wideWidth?: string;
  /** Tallest a phone sheet may get. */
  maxHeight?: string;
  /** Keep the panel at least this tall (e.g. while showing search results). */
  minHeight?: string;
  /** Show the grab handle on phones (dragging works either way). */
  handle?: boolean;
  /** False while something mustn't be interrupted (a payment in progress). */
  dismissible?: boolean;
  /** Pad the bottom for the home indicator (off when a footer does it). */
  safeArea?: boolean;
  /** Accessible name. */
  label?: string;
  backdropClassName?: string;
}

const WIDE_QUERY = "(min-width: 640px)";
const subscribeWide = (cb: () => void) => {
  const mq = window.matchMedia(WIDE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
/** True on tablets and computers, where a centred dialog feels native. */
export const useWideScreen = () =>
  useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE_QUERY).matches, () => false);

// Esc closes only the sheet on top.
const openStack: symbol[] = [];

// Never start a sheet drag from these: they have their own gestures.
const NO_DRAG = "input[type=range], textarea, select, [contenteditable=true], [data-sheet-no-drag], .gm-style";

/** Dragged at least this far (or flicked), the sheet closes. */
const CLOSE_DISTANCE = 120;
const CLOSE_VELOCITY = 0.55; // px per ms

export function Sheet({
  open,
  onClose,
  children,
  className = "bg-white dark:bg-slate-900",
  zIndex = 9998,
  wideWidth = "max-w-lg",
  maxHeight = "92dvh",
  minHeight,
  handle = true,
  dismissible = true,
  safeArea = true,
  label,
  backdropClassName = "bg-slate-950/50 backdrop-blur-[2px]",
}: SheetProps) {
  const mounted = useIsClient();
  const wide = useWideScreen();
  const keyboard = useKeyboardOffset();
  const panelRef = useRef<HTMLDivElement>(null);
  const dragY = useMotionValue(0);
  const backdropOpacity = useTransform(dragY, [0, 420], [1, 0.15]);
  // Android back / iOS edge swipe close the sheet before leaving the page.
  useBackDismiss(open, onClose, { kind: "sheet", dismissible });

  // Latest values for listeners that are bound once per opening.
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);
  useEffect(() => {
    onCloseRef.current = onClose;
    dismissibleRef.current = dismissible;
  });

  // Fresh position each time it opens; Esc closes the top-most sheet.
  useEffect(() => {
    if (!open) return;
    dragY.set(0);
    const id = Symbol("sheet");
    openStack.push(id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || openStack[openStack.length - 1] !== id || !dismissibleRef.current) return;
      e.stopPropagation();
      onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      const i = openStack.indexOf(id);
      if (i >= 0) openStack.splice(i, 1);
    };
  }, [open, dragY]);

  // Drag to close (phones).
  useEffect(() => {
    const el = panelRef.current;
    if (!open || wide || !el) return;

    let mode: "idle" | "drag" | "pass" = "idle";
    let startX = 0;
    let startY = 0;
    // Recent finger positions, for the release speed (a flick).
    let samples: { y: number; t: number }[] = [];

    /** Can a downward drag starting here move the sheet (vs scroll a list)? */
    const canDragFrom = (target: EventTarget | null) => {
      let node = target as HTMLElement | null;
      if (node?.closest?.(NO_DRAG)) return false;
      while (node && node !== el) {
        if (node.scrollTop > 0) {
          const oy = getComputedStyle(node).overflowY;
          if (oy === "auto" || oy === "scroll") return false;
        }
        node = node.parentElement;
      }
      return true;
    };

    const begin = (x: number, y: number) => {
      mode = "idle";
      startX = x;
      startY = y;
      samples = [{ y, t: performance.now() }];
    };
    const move = (y: number) => {
      const now = performance.now();
      samples.push({ y, t: now });
      while (samples.length > 2 && now - samples[0].t > 100) samples.shift();
      const d = y - startY;
      // A little resistance upwards; the sheet doesn't grow.
      dragY.set(d >= 0 ? d : d * 0.15);
    };
    const finish = () => {
      if (mode !== "drag") {
        mode = "idle";
        return;
      }
      mode = "idle";
      const y = dragY.get();
      // Speed over the last ~100 ms; none if the finger paused before letting go.
      const first = samples[0];
      const last = samples[samples.length - 1];
      const now = performance.now();
      const velocity = last && first && last.t > first.t && now - last.t < 120 ? (last.y - first.y) / (last.t - first.t) : 0;
      if (dismissibleRef.current && (y > Math.min(CLOSE_DISTANCE, el.offsetHeight * 0.35) || velocity > CLOSE_VELOCITY)) {
        onCloseRef.current();
      } else {
        animate(dragY, 0, { type: "spring", stiffness: 520, damping: 40 });
      }
    };

    // Touch: decided on the first movement, before the browser starts scrolling.
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        mode = "pass";
        return;
      }
      begin(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (mode === "pass") return;
      const t = e.touches[0];
      if (mode === "idle") {
        const dy = t.clientY - startY;
        const dx = t.clientX - startX;
        if (dy <= 0 || Math.abs(dx) > dy || !canDragFrom(e.target)) {
          if (Math.abs(dy) > 2 || Math.abs(dx) > 2) mode = "pass";
          return;
        }
        mode = "drag";
      }
      if (e.cancelable) e.preventDefault();
      move(t.clientY);
    };
    const onTouchEnd = () => finish();

    // Mouse: drag by the handle (e.g. a narrow browser window).
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !(e.target as HTMLElement).closest("[data-sheet-handle]")) return;
      begin(e.clientX, e.clientY);
      mode = "drag";
      const onMove = (ev: PointerEvent) => move(ev.clientY);
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        finish();
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    el.addEventListener("pointerdown", onPointerDown);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, wide, dragY]);

  if (!mounted) return null;

  const close = () => dismissible && onClose();
  const bottomPad = safeArea && keyboard === 0 ? "max(var(--sab, env(safe-area-inset-bottom)), 0px)" : undefined;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div key="sheet" className="contents">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 touch-none"
            style={{ zIndex }}
            onClick={close}
            aria-hidden
          >
            <motion.div className={`absolute inset-0 ${backdropClassName}`} style={{ opacity: wide ? 1 : backdropOpacity }} />
          </motion.div>

          {wide ? (
            <div className="fixed inset-0 flex items-center justify-center p-6 pointer-events-none" style={{ zIndex: zIndex + 1 }}>
              <motion.div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={label}
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 4 }}
                transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
                style={{ minHeight }}
                className={`relative pointer-events-auto w-full ${wideWidth} max-h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl ${className}`}
              >
                <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overscroll-contain">{children}</div>
              </motion.div>
            </div>
          ) : (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38, mass: 0.9 }}
              className="fixed inset-x-0 flex flex-col"
              style={{
                zIndex: zIndex + 1,
                bottom: keyboard,
                maxHeight: keyboard > 0 ? `calc(100dvh - ${keyboard}px - var(--sat, env(safe-area-inset-top)) - 8px)` : maxHeight,
                transition: "bottom 0.15s ease-out, max-height 0.15s ease-out",
              }}
            >
              <motion.div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={label}
                style={{ y: dragY, paddingBottom: bottomPad, minHeight }}
                className={`relative min-h-0 rounded-t-[28px] overflow-hidden flex flex-col shadow-[0_-8px_40px_rgba(0,0,0,0.18)] ${className}`}
              >
                {handle && (
                  <div data-sheet-handle className="shrink-0 flex justify-center pt-2.5 pb-1.5 cursor-grab active:cursor-grabbing touch-none">
                    <div className="w-10 h-1.5 rounded-full bg-slate-300/80 dark:bg-slate-600" />
                  </div>
                )}
                <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overscroll-contain">{children}</div>
              </motion.div>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default Sheet;
